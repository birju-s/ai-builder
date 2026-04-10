import { Sandbox } from 'e2b'

import { createLogger } from '@/lib/logger'
import type { SandboxService, SandboxInstance, CommandResult } from '@/lib/sandbox/types'

const logger = createLogger('sandbox')
const SANDBOX_TIMEOUT_MS = Number(process.env.E2B_SANDBOX_TIMEOUT_MS || 3_600_000)

class E2BSandboxInstance implements SandboxInstance {
  readonly id: string

  constructor(private readonly sandbox: Sandbox) {
    this.id = sandbox.sandboxId
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`
    await this.sandbox.files.write(fullPath, content)
    logger.debug('File written', { path })
  }

  async writeFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    const optimizeWrites = process.env.OPTIMIZE_FILE_WRITES === 'true'

    if (optimizeWrites) {
      await Promise.all(
        files.map(async (file) => {
          const fullPath = file.path.startsWith('/') ? file.path : `/home/user/project/${file.path}`
          await this.sandbox.files.write(fullPath, file.content)
        })
      )
      logger.info('Files written concurrently', { count: files.length })
    } else {
      for (const file of files) {
        const fullPath = file.path.startsWith('/') ? file.path : `/home/user/project/${file.path}`
        await this.sandbox.files.write(fullPath, file.content)
      }
      logger.info('Files written sequentially', { count: files.length })
    }
  }

  async runCommand(cmd: string, opts?: { timeout?: number }): Promise<CommandResult> {
    const timeoutMs = (opts?.timeout ?? 120) * 1000
    try {
      const result = await this.sandbox.commands.run(cmd, { timeoutMs, cwd: '/home/user/project' })

      logger.info('Command executed', {
        cmd: cmd.slice(0, 120),
        exitCode: result.exitCode,
        stdoutTail: result.stdout?.slice(-200) || '',
        stderrTail: result.stderr?.slice(-200) || '',
      })

      return {
        exitCode: result.exitCode,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
      }
    } catch (err: unknown) {
      // E2B SDK v2 throws CommandExitError on non-zero exit codes.
      // It implements CommandResult, so stdout/stderr are on the error object.
      const hasResult = err != null && typeof err === 'object' &&
        'exitCode' in err && 'stdout' in err && 'stderr' in err
      if (hasResult) {
        const e = err as { exitCode: number; stdout: string; stderr: string }
        logger.warn('Command exited with non-zero code', {
          cmd: cmd.slice(0, 120),
          exitCode: e.exitCode,
          stdoutTail: (e.stdout ?? '').slice(-500),
          stderrTail: (e.stderr ?? '').slice(-500),
        })
        return {
          exitCode: e.exitCode,
          stdout: e.stdout ?? '',
          stderr: e.stderr ?? '',
        }
      }

      const msg = err instanceof Error ? err.message : String(err)
      logger.error('Command threw unexpected exception', { cmd: cmd.slice(0, 120), error: msg })
      return {
        exitCode: 1,
        stdout: '',
        stderr: `E2B exception: ${msg}`,
      }
    }
  }

  async startProcess(cmd: string): Promise<void> {
    try {
      await this.sandbox.commands.run(cmd, { background: true, cwd: '/home/user/project' })
      logger.info('Background process started', { cmd })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('Background process failed to start', { cmd, error: msg })
      throw new Error(`Failed to start background process "${cmd}": ${msg}`)
    }
  }

  getPreviewUrl(port: number): string {
    return `https://${this.sandbox.getHost(port)}`
  }

  async destroy(): Promise<void> {
    await this.sandbox.kill()
    logger.info('Sandbox destroyed', { id: this.id })
  }
}

class E2BSandboxService implements SandboxService {
  async create(): Promise<SandboxInstance> {
    const apiKey = process.env.E2B_API_KEY
    if (!apiKey) {
      throw new Error('E2B_API_KEY environment variable is not set')
    }

    const template = process.env.E2B_TEMPLATE || undefined
    const sandbox = template
      ? await Sandbox.create(template, { apiKey, timeoutMs: SANDBOX_TIMEOUT_MS })
      : await Sandbox.create({ apiKey, timeoutMs: SANDBOX_TIMEOUT_MS })

    logger.info('Sandbox created', {
      id: sandbox.sandboxId,
      template: template || 'default',
      timeoutMs: SANDBOX_TIMEOUT_MS,
    })

    return new E2BSandboxInstance(sandbox)
  }

  async connect(sandboxId: string): Promise<SandboxInstance> {
    const apiKey = process.env.E2B_API_KEY
    if (!apiKey) {
      throw new Error('E2B_API_KEY environment variable is not set')
    }

    const sandbox = await Sandbox.connect(sandboxId, { apiKey })
    await sandbox.setTimeout(SANDBOX_TIMEOUT_MS)
    logger.info('Sandbox connected', { id: sandbox.sandboxId })

    return new E2BSandboxInstance(sandbox)
  }
}

export function createSandboxService(): SandboxService {
  return new E2BSandboxService()
}
