import { Octokit } from 'octokit'
import { createLogger } from '@/lib/logger'

const log = createLogger('github')

export interface GitHubSyncResult {
  url: string
  commitSha: string
}

export async function pushToGitHub(
  token: string,
  repoName: string,
  files: Array<{ path: string; content: string }>,
  commitMessage: string
): Promise<GitHubSyncResult> {
  const octokit = new Octokit({ auth: token })
  const timer = log.time('github-sync')

  log.info('Starting GitHub sync', { repoName, fileCount: files.length })

  try {
    // 1. Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated()
    const owner = user.login

    // 2. Find or create repository
    let repo
    try {
      const response = await octokit.rest.repos.get({ owner, repo: repoName })
      repo = response.data
      log.info('Found existing repository', { fullName: repo.full_name })
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (err.status === 404) {
        log.info('Creating new repository', { repoName })
        const response = await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          private: true,
          auto_init: true, // creates an initial commit so we have a branch to push to
        })
        repo = response.data
        // Wait a second for GitHub to initialize the default branch
        await new Promise(r => setTimeout(r, 2000))
      } else {
        throw error
      }
    }

    const branch = repo.default_branch || 'main'

    // 3. Get the latest commit SHA
    let latestCommitSha = ''
    let baseTreeSha = ''
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo: repo.name,
        ref: `heads/${branch}`,
      })
      latestCommitSha = ref.object.sha

      const { data: commit } = await octokit.rest.git.getCommit({
        owner,
        repo: repo.name,
        commit_sha: latestCommitSha,
      })
      baseTreeSha = commit.tree.sha
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (err.status === 409) {
        throw new Error(`Repository is completely empty and lacks a default branch (${branch}). Please initialize it.`)
      }
      throw err
    }

    // 4. Create blobs and tree
    const treePayload = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.rest.git.createBlob({
          owner,
          repo: repo.name,
          content: file.content,
          encoding: 'utf-8',
        })
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        }
      })
    )

    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo: repo.name,
      base_tree: baseTreeSha,
      tree: treePayload,
    })

    // 5. Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo: repo.name,
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha],
    })

    // 6. Update ref
    await octokit.rest.git.updateRef({
      owner,
      repo: repo.name,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    })

    timer.end({ files: files.length, commit: newCommit.sha })

    return {
      url: repo.html_url,
      commitSha: newCommit.sha,
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    log.error('GitHub sync failed', { error: err.message || error })
    throw new Error(`Failed to push to GitHub: ${err.message || 'Unknown error'}`)
  }
}
