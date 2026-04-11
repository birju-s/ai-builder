'use client'

import { createElement, useState, useCallback, useMemo } from 'react'
import { FileCode2, FileText, File, ChevronRight, ChevronDown, Pencil, Save, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'

import Editor from '@monaco-editor/react'

import { DiffEditor } from '@monaco-editor/react'

interface CodePanelProps {
  files: Array<{ path: string; content: string }>
  previousFiles?: Array<{ path: string; content: string }>
  onFileEdit?: (path: string, newContent: string) => void
  selectedPath?: string | null
  onSelectPath?: (path: string) => void
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children: TreeNode[]
}

function getFileIcon(path: string) {
  if (/\.(tsx?|jsx?)$/.test(path)) return FileCode2
  if (/\.(css|json|md)$/.test(path)) return FileText
  return File
}

import type { OnMount } from '@monaco-editor/react'

function getLanguage(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript'
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.html')) return 'html'
  return 'plaintext'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function buildFileTree(files: Array<{ path: string; content: string }>): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const parts = file.path.replace(/^\//, '').split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isFile = i === parts.length - 1
      const fullPath = parts.slice(0, i + 1).join('/')

      let existing = current.find((n) => n.name === name)
      if (!existing) {
        existing = {
          name,
          path: fullPath,
          type: isFile ? 'file' : 'directory',
          children: [],
        }
        current.push(existing)
      }
      current = existing.children
    }
  }

  // Sort: directories first, then files, alphabetically
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }))
  }

  return sortNodes(root)
}

function FileTreeNode({
  node,
  depth,
  selectedPath,
  expandedDirs,
  onSelectFile,
  onToggleDir,
}: {
  node: TreeNode
  depth: number
  selectedPath: string | null
  expandedDirs: Set<string>
  onSelectFile: (path: string) => void
  onToggleDir: (path: string) => void
}) {
  const isExpanded = expandedDirs.has(node.path)
  const isSelected = selectedPath === node.path
  const icon = node.type === 'directory'
    ? (isExpanded ? ChevronDown : ChevronRight)
    : getFileIcon(node.path)

  return (
    <>
      <button
        onClick={() => {
          if (node.type === 'directory') {
            onToggleDir(node.path)
          } else {
            onSelectFile(node.path)
          }
        }}
        className={cn(
          'flex items-center gap-1.5 w-full text-left px-2 py-1 text-xs font-mono truncate transition-colors',
          isSelected
            ? 'bg-blue-600/20 text-blue-400'
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.path}
      >
        {createElement(icon, { className: 'h-3.5 w-3.5 flex-shrink-0' })}
        <span className="truncate">{node.name}</span>
      </button>
      {node.type === 'directory' && isExpanded &&
        node.children.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            expandedDirs={expandedDirs}
            onSelectFile={onSelectFile}
            onToggleDir={onToggleDir}
          />
        ))}
    </>
  )
}

export function CodePanel({ files, previousFiles, onFileEdit, selectedPath: externalSelectedPath, onSelectPath }: CodePanelProps) {
  const [internalSelectedPath, setInternalSelectedPath] = useState<string | null>(
    files.length > 0 ? files[0].path.replace(/^\//, '') : null
  )
  const [isDiffMode, setIsDiffMode] = useState(false)

  const selectedPath = externalSelectedPath !== undefined ? externalSelectedPath : internalSelectedPath
  
  const setSelectedPath = useCallback((path: string | null) => {
    setInternalSelectedPath(path)
    if (path && onSelectPath) {
      onSelectPath(path)
    }
  }, [onSelectPath])

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    // Auto-expand all directories initially
    const dirs = new Set<string>()
    for (const file of files) {
      const parts = file.path.replace(/^\//, '').split('/')
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'))
      }
    }
    return dirs
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const tree = useMemo(() => buildFileTree(files), [files])

  const selectedFile = files.find(
    (f) => f.path.replace(/^\//, '') === selectedPath
  )

  const handleToggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleSelectFile = useCallback(
    (path: string) => {
      // Save current edits before switching
      if (isEditing && selectedFile && editContent !== selectedFile.content) {
        onFileEdit?.(selectedFile.path, editContent)
      }
      setIsEditing(false)
      setSelectedPath(path)
    },
    [isEditing, selectedFile, editContent, onFileEdit, setSelectedPath]
  )

  const handleStartEditing = useCallback(() => {
    if (!selectedFile) return
    setEditContent(selectedFile.content)
    setIsEditing(true)
  }, [selectedFile])

  const handleSave = useCallback(() => {
    if (!selectedFile) return
    onFileEdit?.(selectedFile.path, editContent)
    setIsEditing(false)
  }, [selectedFile, editContent, onFileEdit])

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })
  }, [handleSave])

  return (
    <div className="flex h-full w-full bg-neutral-950 text-neutral-100">
      {/* File tree sidebar */}
      <div className="w-[200px] flex-shrink-0 border-r border-neutral-800 flex flex-col">
        <div className="px-3 py-2 border-b border-neutral-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Files
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {tree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expandedDirs={expandedDirs}
              onSelectFile={handleSelectFile}
              onToggleDir={handleToggleDir}
            />
          ))}
        </div>
      </div>

      {/* Code content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-2 min-w-0">
            {selectedFile && (
              <>
                {createElement(getFileIcon(selectedFile.path), {
                  className: 'h-3.5 w-3.5 text-neutral-400 flex-shrink-0',
                })}
                <span className="text-xs font-mono text-neutral-300 truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] text-neutral-600 flex-shrink-0">
                  {formatBytes(new TextEncoder().encode(selectedFile.content).length)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedFile && previousFiles && previousFiles.length > 0 && (
              <button
                onClick={() => {
                  setIsDiffMode(!isDiffMode)
                  if (isEditing) setIsEditing(false)
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  isDiffMode
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100'
                )}
              >
                <GitCompare className="h-3 w-3" />
                Diff
              </button>
            )}
            {selectedFile && onFileEdit && !isDiffMode && (
              <button
                onClick={isEditing ? handleSave : handleStartEditing}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  isEditing
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100'
                )}
              >
              {isEditing ? (
                <>
                  <Save className="h-3 w-3" />
                  Save
                </>
              ) : (
                <>
                  <Pencil className="h-3 w-3" />
                  Edit
                </>
              )}
            </button>
          )}
          </div>
        </div>

        {/* Code display / editor */}
        <div className="flex-1 overflow-hidden relative">
          {selectedFile ? (
            isDiffMode ? (
              <DiffEditor
                height="100%"
                language={getLanguage(selectedFile.path)}
                theme="vs-dark"
                original={previousFiles?.find((f) => f.path === selectedFile.path)?.content || ''}
                modified={selectedFile.content}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  padding: { top: 16, bottom: 16 },
                  renderSideBySide: false,
                }}
                loading={<div className="flex items-center justify-center h-full text-neutral-600 text-sm">Loading diff...</div>}
              />
            ) : (
              <Editor
                height="100%"
                language={getLanguage(selectedFile.path)}
                theme="vs-dark"
                value={isEditing ? editContent : selectedFile.content}
                onChange={(value) => {
                  if (isEditing && value !== undefined) {
                    setEditContent(value)
                  }
                }}
                onMount={handleEditorMount}
                options={{
                  readOnly: !isEditing,
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  padding: { top: 16, bottom: 16 },
                  tabSize: 2,
                  folding: false,
                }}
                loading={<div className="flex items-center justify-center h-full text-neutral-600 text-sm">Loading editor...</div>}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
