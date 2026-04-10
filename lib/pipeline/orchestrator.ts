import { createLogger } from '@/lib/logger'
import { generateBlueprint } from '@/lib/templates/blueprint'
import { generateDeterministicFiles } from '@/lib/templates/deterministic'
import generatedSitePackage from '@/lib/templates/generated-site-package.json'
import { runDeveloperAgent } from '@/lib/agents/developer'
import { fixBuildErrors } from '@/lib/agents/fixer'
import { validateFiles } from '@/lib/pipeline/validator'
import { runImagePipeline } from '@/lib/services/image-pipeline'
import { injectImages } from '@/lib/services/image-injector'
import { createSandboxService } from '@/lib/sandbox/service'
import { createProject } from '@/lib/store/project-store'
import type { PipelineState, PipelineStage, SSEEvent } from '@/types/pipeline'
import type { Blueprint } from '@/types/blueprint'
import type { SandboxInstance } from '@/lib/sandbox/types'

const log = createLogger('pipeline')
const NPM_INSTALL_CMD = 'npm install 2>&1'
const PREBUILT_TEMPLATE_PACKAGE_PATHS = [
  ...new Set([
    ...Object.keys(generatedSitePackage.dependencies),
    ...Object.keys(generatedSitePackage.devDependencies),
  ]),
].map((pkg) => `node_modules/${pkg}/package.json`)

const PREBUILT_TEMPLATE_DEPS_CMD = [
  'if [ ! -d node_modules ]; then',
  '  if [ -d /home/user/project/node_modules ]; then ln -s /home/user/project/node_modules node_modules;',
  '  elif [ -d /home/user/node_modules ]; then ln -s /home/user/node_modules node_modules;',
  '  else echo "Prebuilt template node_modules not found" >&2; exit 1; fi;',
  'fi;',
  `if ${PREBUILT_TEMPLATE_PACKAGE_PATHS.map((pkgPath) => `[ -f "${pkgPath}" ]`).join(' && ')}; then exit 0; fi;`,
  'echo "Prebuilt template is missing baseline packages" >&2;',
  'exit 2',
].join(' ')

type EmitFn = (event: SSEEvent) => void

function createInitialState(prompt: string): PipelineState {
  return {
    id: crypto.randomUUID(),
    stage: 'idle',
    prompt,
    blueprint: null,
    files: [],
    sandboxId: null,
    previewUrl: null,
    error: null,
    startedAt: Date.now(),
    completedAt: null,
    metrics: {
      planningMs: null,
      generatingMs: null,
      sandboxWriteMs: null,
      installMs: null,
      buildMs: null,
      totalMs: null,
      filesGenerated: 0,
      tokensUsed: { input: 0, output: 0 },
      llmCalls: 0,
      provider: 'anthropic',
    },
  }
}

function emitStage(emit: EmitFn, stage: PipelineStage, message: string) {
  emit({ type: 'stage', data: { stage, message } })
}

function emitProgress(emit: EmitFn, message: string, percent: number) {
  emit({ type: 'progress', data: { message, percent } })
}

function usesPrebuiltTemplate(): boolean {
  return Boolean(process.env.E2B_TEMPLATE?.trim())
}

async function runNpmInstall(
  sandbox: SandboxInstance,
  label: string
): Promise<{ exitCode: number; stdout: string; stderr: string; ms: number }> {
  const installTimer = log.time(label)
  const result = await sandbox.runCommand(NPM_INSTALL_CMD, { timeout: 180 })
  const ms = installTimer.end({ exitCode: result.exitCode })
  return { ...result, ms }
}

async function preparePrebuiltTemplateDeps(
  sandbox: SandboxInstance,
  label: string
): Promise<{ exitCode: number; stdout: string; stderr: string; ms: number }> {
  const prepTimer = log.time(label)
  const result = await sandbox.runCommand(PREBUILT_TEMPLATE_DEPS_CMD, { timeout: 30 })
  const ms = prepTimer.end({ exitCode: result.exitCode })
  return { ...result, ms }
}

/**
 * Parallel pipeline architecture:
 *
 * T=0:  Planning ──────────┐
 *       Sandbox creation ──┤ (parallel)
 *                          │
 * T=~8s: Blueprint ready   │
 *        ├─ Deterministic files → write to sandbox immediately
 *        ├─ npm install (starts as soon as files are written)
 *        ├─ AI codegen (parallel components → parallel pages)
 *        └─ Image pipeline (runs alongside codegen)
 *                          │
 * T=~Ns: Codegen done ────┤
 *        Batch validation  │
 *        Write AI files    │
 *        (npm install likely already done)
 *                          │
 * T=~N+5s: Build ─────────┤
 *          (image pipeline done, inject images)
 *                          │
 * T=~N+20s: Dev server start
 * T=~N+25s: Preview ready
 */
export async function runPipeline(prompt: string, emit: EmitFn, preApprovedBlueprint?: Blueprint): Promise<void> {
  const state = createInitialState(prompt)
  const timer = log.time('pipeline')

  try {
    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Planning + Sandbox creation (PARALLEL)
    // ═══════════════════════════════════════════════════════════════
    state.stage = 'planning'
    emitStage(emit, 'planning', 'Analyzing your prompt and preparing environment...')
    emitProgress(emit, 'Creating blueprint + warming sandbox', 5)

    // Fire sandbox creation at T=0 (runs during planning + codegen)
    const sandboxService = createSandboxService()
    const sandboxPromise = sandboxService.create().catch((err) => {
      log.error('Early sandbox creation failed', { error: (err as Error).message })
      return null
    })

    if (preApprovedBlueprint) {
      state.blueprint = preApprovedBlueprint
      state.blueprint.prompt = prompt
      state.metrics.planningMs = 0
      emitProgress(emit, 'Blueprint loaded', 10)
      log.info('Using pre-approved blueprint', {
        name: state.blueprint.name,
        pages: state.blueprint.pages.length,
      })
    } else {
      const planTimer = log.time('planning')
      state.blueprint = await generateBlueprint(prompt)
      state.metrics.planningMs = planTimer.end({
        sections: state.blueprint.pages[0]?.sections.length,
      })
      emitProgress(emit, `Blueprint ready: ${state.blueprint.name}`, 12)
      log.info('Blueprint generated', {
        name: state.blueprint.name,
        pages: state.blueprint.pages.length,
        sections: state.blueprint.pages.reduce((n, p) => n + p.sections.length, 0),
      })
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Deterministic files + sandbox write + npm install
    //          OVERLAPPED with AI codegen + image pipeline
    // ═══════════════════════════════════════════════════════════════
    state.stage = 'generating'
    emitStage(emit, 'generating', 'Generating React components...')

    const deterministicFiles = generateDeterministicFiles(state.blueprint.designSystem)
    const usingPrebuiltTemplate = usesPrebuiltTemplate()
    for (const f of deterministicFiles) {
      state.files.push({
        path: f.path,
        content: f.content,
        sizeBytes: new TextEncoder().encode(f.content).length,
        generationTimeMs: 0,
      })
    }
    emitProgress(emit, `${deterministicFiles.length} config files ready`, 15)

    // Await sandbox (should be ready by now -- was created during planning)
    let sandbox = await sandboxPromise
    if (!sandbox) {
      log.warn('Retrying sandbox creation synchronously')
      sandbox = await sandboxService.create()
    }
    state.sandboxId = sandbox.id
    log.info('Sandbox ready', { id: sandbox.id })

    // Write deterministic files immediately + start dependency preparation
    const writeTimer = log.time('sandbox-write-deterministic')
    await sandbox.writeFiles(deterministicFiles)
    writeTimer.end({ files: deterministicFiles.length })
    emitProgress(
      emit,
      usingPrebuiltTemplate
        ? 'Config files written, linking prebuilt deps'
        : 'Config files written, installing deps',
      18
    )

    // Start dependency prep in background (runs WHILE AI codegen happens)
    const dependencyPromise = usingPrebuiltTemplate
      ? preparePrebuiltTemplateDeps(sandbox, 'template-deps')
      : runNpmInstall(sandbox, 'npm-install')

    // Fire image pipeline (non-blocking, runs during codegen + install)
    const imagePromise = runImagePipeline({
      name: state.blueprint.name,
      description: state.blueprint.description,
      designSystem: {
        mood: state.blueprint.designSystem.mood,
        colors: {
          primary: state.blueprint.designSystem.colors.primary,
          background: state.blueprint.designSystem.colors.background,
        },
      },
      pages: state.blueprint.pages.map((p) => ({
        sections: p.sections.map((s) => ({
          id: s.id,
          type: s.type,
          headline: s.headline,
          subtext: s.subtext,
        })),
      })),
    }).catch((err) => {
      log.warn('Image pipeline failed, continuing without images', {
        error: (err as Error).message,
      })
      return { images: [], sectionImageMap: {} }
    })

    // AI codegen (parallel components → parallel pages) -- runs WHILE install happens
    const genTimer = log.time('generating')

    const { files: aiFiles } = await runDeveloperAgent(
      state.blueprint,
      (file, index, total) => {
        state.files.push(file)
        state.metrics.filesGenerated = state.files.length
        const percent = 20 + Math.round((index / total) * 45)
        emitProgress(emit, `Generated ${file.path}`, percent)
        emit({
          type: 'file',
          data: { path: file.path, content: file.content, index, total },
        })
      }
    )

    state.metrics.generatingMs = genTimer.end({ aiFiles: aiFiles.length })

    const generatedPageCount = aiFiles.filter((file) => /(^|\/)page\.tsx$/.test(file.path)).length
    if (aiFiles.length === 0 || generatedPageCount === 0) {
      throw new Error(
        'AI generation produced no usable page files. This usually means the configured model failed before sections could be generated.'
      )
    }

    emitProgress(emit, `${aiFiles.length} components generated`, 68)

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Batch validation + write AI files + await install + images
    // ═══════════════════════════════════════════════════════════════
    state.stage = 'writing-sandbox'
    emitStage(emit, 'writing-sandbox', 'Validating and writing files to sandbox...')

    // Batch validation
    const aiFilesToWrite = state.files.filter(
      (f) => !deterministicFiles.some((d) => d.path === f.path)
    )
    const batchValidation = validateFiles(
      aiFilesToWrite.map((f) => ({ path: f.path, content: f.content }))
    )

    for (const vf of batchValidation.files) {
      const idx = state.files.findIndex((f) => f.path === vf.path)
      if (idx >= 0) {
        state.files[idx] = {
          ...state.files[idx],
          content: vf.content,
          sizeBytes: new TextEncoder().encode(vf.content).length,
        }
      }
    }

    // Patch package.json with missing deps
    if (batchValidation.allMissingDeps.length > 0) {
      log.info('Patching package.json with missing deps', {
        deps: batchValidation.allMissingDeps,
      })

      const pkgFile = deterministicFiles.find((f) => f.path === 'package.json')
      if (pkgFile) {
        try {
          const pkg = JSON.parse(pkgFile.content)
          for (const dep of batchValidation.allMissingDeps) {
            if (!pkg.dependencies[dep]) {
              pkg.dependencies[dep] = 'latest'
            }
          }
          const updatedPkg = JSON.stringify(pkg, null, 2) + '\n'
          await sandbox.writeFile('package.json', updatedPkg)

          const stateIdx = state.files.findIndex((f) => f.path === 'package.json')
          if (stateIdx >= 0) {
            state.files[stateIdx] = {
              ...state.files[stateIdx],
              content: updatedPkg,
              sizeBytes: new TextEncoder().encode(updatedPkg).length,
            }
          }
        } catch (e) {
          log.warn('Failed to patch package.json', { error: (e as Error).message })
        }
      }
    }

    // Write AI files -- if sandbox connection went stale, reconnect and rewrite everything
    const aiWriteTimer = log.time('sandbox-write-ai')
    let sandboxRecreated = false
    try {
      await sandbox.writeFiles(
        batchValidation.files.map((f) => ({ path: f.path, content: f.content }))
      )
    } catch (writeErr) {
      const msg = writeErr instanceof Error ? writeErr.message : String(writeErr)
      if (msg.includes('fetch failed') || msg.includes('ECONNRESET') || msg.includes('socket hang up')) {
        log.warn('Sandbox connection stale, reconnecting...', { error: msg })
        const previousSandboxId = sandbox.id
        sandbox = await sandboxService.connect(sandbox.id).catch(async () => {
          log.warn('Reconnect failed, creating fresh sandbox')
          return sandboxService.create()
        })
        sandboxRecreated = sandbox.id !== previousSandboxId
        state.sandboxId = sandbox.id
        // Rewrite ALL files to the fresh/reconnected sandbox
        const allFiles = state.files.map((f) => ({ path: f.path, content: f.content }))
        await sandbox.writeFiles(allFiles)
      } else {
        throw writeErr
      }
    }
    state.metrics.sandboxWriteMs = aiWriteTimer.end({ files: batchValidation.files.length })
    emitProgress(emit, 'All files written', 72)

    // Await dependency preparation (likely already done since codegen took a while)
    const missingDepsPatched = batchValidation.allMissingDeps.length > 0
    let totalInstallMs = 0
    let dependenciesReady = false
    let prebuiltDepsPrepared = false

    try {
      const dependencyResult = await dependencyPromise
      totalInstallMs += dependencyResult.ms
      if (dependencyResult.exitCode === 0) {
        dependenciesReady = true
        prebuiltDepsPrepared = usingPrebuiltTemplate
      } else {
        log.warn(
          usingPrebuiltTemplate
            ? 'Prebuilt template dependency prep failed'
            : 'Initial npm install failed',
          {
            exitCode: dependencyResult.exitCode,
            stderr: dependencyResult.stderr.slice(0, 500),
          }
        )
      }
    } catch (dependencyErr) {
      log.warn('Dependency preparation promise rejected (sandbox may have been replaced)', {
        error: (dependencyErr as Error).message,
      })
    }

    if (sandboxRecreated) {
      dependenciesReady = false
      prebuiltDepsPrepared = false
    }

    if (missingDepsPatched) {
      dependenciesReady = false
    }

    if (!dependenciesReady && usingPrebuiltTemplate && !prebuiltDepsPrepared) {
      const prepReason = sandboxRecreated
        ? 'sandbox was recreated after dependency prep started'
        : 'initial prebuilt dependency prep did not complete successfully'

      log.info('Preparing prebuilt template deps on current sandbox', { reason: prepReason })

      const prebuiltResult = await preparePrebuiltTemplateDeps(sandbox, 'template-deps-retry')
      totalInstallMs += prebuiltResult.ms

      if (prebuiltResult.exitCode === 0) {
        prebuiltDepsPrepared = true
        dependenciesReady = !missingDepsPatched
      } else {
        log.warn('Prebuilt template deps unavailable, falling back to npm install', {
          exitCode: prebuiltResult.exitCode,
          stderr: (prebuiltResult.stderr || prebuiltResult.stdout).slice(0, 300),
        })
      }
    }

    if (!dependenciesReady) {
      const reason = missingDepsPatched
        ? 'package.json patched with missing deps'
        : sandboxRecreated
          ? 'sandbox was recreated after install started'
          : 'initial install did not complete successfully'

      log.info('Running npm install on current sandbox', {
        reason,
        usingPrebuiltTemplate,
        missingDeps: batchValidation.allMissingDeps,
      })

      const installResult = await runNpmInstall(
        sandbox,
        missingDepsPatched ? 'npm-install-missing-deps' : 'npm-install-retry'
      )
      totalInstallMs += installResult.ms

      if (installResult.exitCode !== 0) {
        throw new Error(
          `npm install failed (exit ${installResult.exitCode}): ${installResult.stderr.slice(0, 300)}`
        )
      }

      dependenciesReady = true
    }

    state.metrics.installMs = totalInstallMs
    emitProgress(
      emit,
      usingPrebuiltTemplate && prebuiltDepsPrepared && !missingDepsPatched
        ? 'Dependencies ready from template'
        : 'Dependencies installed',
      75
    )

    // Await image pipeline (should be done by now)
    const imageResult = await imagePromise
    if (imageResult.images.length > 0) {
      emitProgress(emit, `Injecting ${imageResult.images.length} AI images`, 77)

      const patchedFiles = injectImages(state.files, imageResult)
      state.files = patchedFiles.map((f) => ({
        path: f.path,
        content: f.content,
        sizeBytes: new TextEncoder().encode(f.content).length,
        generationTimeMs: 0,
      }))

      const changedComponents = patchedFiles.filter((f) => f.path.endsWith('.tsx'))
      for (const f of changedComponents) {
        await sandbox.writeFile(f.path, f.content)
      }

      await sandbox.runCommand('mkdir -p public/images', { timeout: 5 })
      for (const img of imageResult.images) {
        // Write base64 to temp file via file API (avoids shell arg length limits),
        // then decode to binary
        const tmpPath = `${img.localPath}.b64`
        await sandbox.writeFile(tmpPath, img.base64Data)
        await sandbox.runCommand(`base64 -d ${tmpPath} > ${img.localPath} && rm ${tmpPath}`, {
          timeout: 15,
        })
      }

      log.info('Images injected', { count: imageResult.images.length })
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: Build with self-healing + server start
    // ═══════════════════════════════════════════════════════════════
    state.stage = 'building'
    emitStage(emit, 'building', 'Building Next.js project...')

    const buildTimer = log.time('next-build')
    const MAX_BUILD_ATTEMPTS = 3
    let buildSuccess = false

    // SPEEDUP OPPORTUNITY: Skip full Next.js production build and self-healing loop
    // if FAST_PREVIEW is enabled. Dev server will compile on-demand instantly.
    const isFastPreview = process.env.FAST_PREVIEW === 'true'

    if (isFastPreview) {
      log.info('FAST_PREVIEW enabled, skipping production build validation')
      emitProgress(emit, 'Fast preview enabled, skipping build validation...', 85)
      buildSuccess = true
    } else {
      for (let attempt = 1; attempt <= MAX_BUILD_ATTEMPTS; attempt++) {
        emitProgress(
          emit,
          attempt === 1
            ? 'Running next build...'
            : `Fixing errors, rebuild ${attempt}/${MAX_BUILD_ATTEMPTS}...`,
          78 + attempt * 3
        )

        const buildResult = await sandbox.runCommand('npx next build 2>&1', { timeout: 180 })
        const buildOut = buildResult.stdout + '\n' + buildResult.stderr

        if (buildResult.exitCode === 0) {
          log.info(`Build attempt ${attempt} succeeded`)
        } else {
          log.warn(`Build attempt ${attempt} failed`, {
            exitCode: buildResult.exitCode,
            output: buildOut.slice(-800),
          })
        }

        if (buildResult.exitCode === 0) {
          buildSuccess = true
          break
        }

        if (attempt < MAX_BUILD_ATTEMPTS) {
          emitProgress(emit, `Build failed, auto-fixing (attempt ${attempt})...`, 82 + attempt * 2)

          const fixes = await fixBuildErrors(buildOut, state.files)
          if (fixes.length === 0) {
            log.warn('No fixable errors found')
            throw new Error(
              `next build failed (exit ${buildResult.exitCode}):\n${buildOut.slice(-600)}`
            )
          }

          for (const fix of fixes) {
            const idx = state.files.findIndex((f) => f.path === fix.path)
            if (idx >= 0) {
              state.files[idx] = {
                ...state.files[idx],
                content: fix.content,
                sizeBytes: new TextEncoder().encode(fix.content).length,
              }
            }
            await sandbox.writeFile(fix.path, fix.content)
            log.info('Applied fix', { file: fix.path })
          }
        } else {
          throw new Error(
            `next build failed after ${MAX_BUILD_ATTEMPTS} attempts:\n${buildOut.slice(-600)}`
          )
        }
      }
    }

    state.metrics.buildMs = buildTimer.end({ success: buildSuccess })
    emitProgress(emit, 'Build complete, starting server...', 92)

    // Start dev server (HMR for hot-patch iterations)
    await sandbox.startProcess('npx next dev --port 3000')

    let serverReady = false
    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const check = await sandbox.runCommand(
          'curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000',
          { timeout: 10 }
        )
        const httpCode = check.stdout.trim()
        if (/^[2345]\d{2}$/.test(httpCode)) {
          serverReady = true
          log.info('Server ready', { httpCode, attempt })
          break
        }
      } catch {
        /* not yet */
      }
      emitProgress(emit, `Starting server (${attempt + 1}/15)...`, 93 + Math.min(attempt, 4))
    }

    if (!serverReady) {
      throw new Error('Server failed to start after successful build')
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: Preview ready + save project
    // ═══════════════════════════════════════════════════════════════
    state.stage = 'preview-ready'
    state.previewUrl = sandbox.getPreviewUrl(3000)
    state.completedAt = Date.now()
    state.metrics.totalMs = state.completedAt - state.startedAt

    let projectId: string | null = null
    try {
      const project = await createProject({
        name: state.blueprint!.name,
        description: state.blueprint!.description,
        prompt,
        blueprint: state.blueprint!,
        files: state.files.map((f) => ({ path: f.path, content: f.content })),
        sandboxId: sandbox.id,
        previewUrl: state.previewUrl,
      })
      projectId = project.id
      log.info('Project saved', { projectId })
    } catch (err) {
      log.warn('Failed to save project', { error: (err as Error).message })
    }

    emitStage(emit, 'preview-ready', 'Your website is ready!')
    emitProgress(emit, 'Preview ready', 100)
    emit({ type: 'preview', data: { url: state.previewUrl, sandboxId: sandbox.id, projectId } })
    emit({ type: 'metrics', data: { metrics: state.metrics } })
    emit({
      type: 'done',
      data: { success: true, previewUrl: state.previewUrl, totalMs: state.metrics.totalMs },
    })

    timer.end({
      success: true,
      totalFiles: state.files.length,
      previewUrl: state.previewUrl,
    })

    log.info('Pipeline complete (parallel)', {
      planningMs: state.metrics.planningMs,
      generatingMs: state.metrics.generatingMs,
      installMs: state.metrics.installMs,
      buildMs: state.metrics.buildMs,
      totalMs: state.metrics.totalMs,
    })
  } catch (error) {
    emitPipelineError(state, emit, timer, error)
  }
}

function emitPipelineError(
  state: PipelineState,
  emit: EmitFn,
  timer: { end: (data?: Record<string, unknown>) => number },
  error: unknown
) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  state.stage = 'failed'
  state.error = message
  state.completedAt = Date.now()
  state.metrics.totalMs = state.completedAt - state.startedAt

  log.error('Pipeline failed', { stage: state.stage, error: message })
  emit({ type: 'error', data: { message, stage: state.stage, recoverable: false } })
  emit({
    type: 'done',
    data: { success: false, previewUrl: null, totalMs: state.metrics.totalMs ?? 0 },
  })

  timer.end({ success: false, error: message })
}
