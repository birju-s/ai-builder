export interface SandboxService {
  create(): Promise<SandboxInstance>
  connect(sandboxId: string): Promise<SandboxInstance>
}

export interface SandboxInstance {
  id: string
  writeFile(path: string, content: string): Promise<void>
  writeFiles(files: Array<{ path: string; content: string }>): Promise<void>
  runCommand(cmd: string, opts?: { timeout?: number }): Promise<CommandResult>
  startProcess(cmd: string): Promise<void>
  getPreviewUrl(port: number): string
  destroy(): Promise<void>
}

export interface CommandResult {
  exitCode: number
  stdout: string
  stderr: string
}
