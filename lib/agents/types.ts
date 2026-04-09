import type { Blueprint, GeneratedFile, FileManifest } from '@/types/blueprint'

export interface DeveloperAgentInput {
  prompt: string
  blueprint: Blueprint
}

export interface DeveloperAgentOutput {
  files: GeneratedFile[]
  manifest: FileManifest[]
  totalTokens: { input: number; output: number }
}

export type FileGeneratedCallback = (file: GeneratedFile, index: number, total: number) => void
