'use client'

import { createElement, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { FileCode2, FileText, File, ChevronRight, ChevronDown, Pencil, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodePanelProps {
  files: Array<{ path: string; content: string }>
  onFileEdit?: (path: string, newContent: string) => void
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

export function CodePanel({ files, onFileEdit }: CodePanelProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    files.length > 0 ? files[0].path.replace(/^\//, '') : null
  )
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    [isEditing, selectedFile, editContent, onFileEdit]
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSave()
      }
      // Allow Tab to insert a tab character
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const value = textarea.value
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        setEditContent(newValue)
        // Restore cursor position after state update
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 2
        })
      }
    },
    [handleSave]
  )

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

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
          {selectedFile && onFileEdit && (
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

        {/* Code display / editor */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            isEditing ? (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="w-full h-full bg-neutral-950 text-neutral-100 font-mono text-xs leading-relaxed p-4 resize-none outline-none border-none"
                spellCheck={false}
              />
            ) : (
              <pre className="p-4 overflow-x-auto">
                <code className="font-mono text-xs leading-relaxed text-neutral-200 whitespace-pre">
                  {selectedFile.content}
                </code>
              </pre>
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
