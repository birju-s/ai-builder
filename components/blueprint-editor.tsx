'use client'

import { useState } from 'react'
import { Palette, Type, Layout, Plus, Trash2, Check, RefreshCw } from 'lucide-react'
import type { Blueprint, SectionType, SectionSpec } from '@/types/blueprint'

interface BlueprintEditorProps {
  blueprint: Blueprint
  onApprove: (edited: Blueprint) => void
  onRegenerate: () => void
}

const SECTION_TYPES: SectionType[] = [
  'hero',
  'features',
  'services',
  'menu',
  'schedule',
  'testimonials',
  'pricing',
  'cta',
  'about',
  'contact',
  'gallery',
  'faq',
  'stats',
  'team',
  'footer',
  'navbar',
]

export function BlueprintEditor({ blueprint, onApprove, onRegenerate }: BlueprintEditorProps) {
  const [edited, setEdited] = useState<Blueprint>(structuredClone(blueprint))
  const [editingColor, setEditingColor] = useState<string | null>(null)

  const updateField = <K extends keyof Blueprint>(key: K, value: Blueprint[K]) => {
    setEdited((prev) => ({ ...prev, [key]: value }))
  }

  const updateDesignSystem = (path: string, value: string) => {
    setEdited((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let target: Record<string, unknown> = next.designSystem as unknown as Record<string, unknown>
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]] as Record<string, unknown>
      }
      target[keys[keys.length - 1]] = value
      return next
    })
  }

  const updateSection = (pageIdx: number, sectionIdx: number, field: keyof SectionSpec, value: string) => {
    setEdited((prev) => {
      const next = structuredClone(prev)
      const section = next.pages[pageIdx].sections[sectionIdx]
      if (field === 'type') {
        section.type = value as SectionType
      } else if (field === 'headline' || field === 'subtext') {
        section[field] = value
      }
      return next
    })
  }

  const removeSection = (pageIdx: number, sectionIdx: number) => {
    setEdited((prev) => {
      const next = structuredClone(prev)
      next.pages[pageIdx].sections.splice(sectionIdx, 1)
      return next
    })
  }

  const addSection = (pageIdx: number) => {
    setEdited((prev) => {
      const next = structuredClone(prev)
      const newSection: SectionSpec = {
        id: `section-${Date.now()}`,
        type: 'features',
        headline: 'New Section',
        subtext: 'Add a description here',
      }
      next.pages[pageIdx].sections.push(newSection)
      return next
    })
  }

  const colorSwatches: Array<{ key: string; label: string }> = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Blueprint Editor</h3>
        <span className="text-xs text-neutral-400">Review &amp; edit before generating</span>
      </div>

      {/* Site Info */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">Site Name</span>
          <input
            type="text"
            value={edited.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">Description</span>
          <input
            type="text"
            value={edited.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">Mood</span>
          <input
            type="text"
            value={edited.designSystem.mood}
            onChange={(e) => updateDesignSystem('mood', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
          />
        </label>
      </div>

      {/* Color Swatches */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <Palette className="h-3.5 w-3.5" />
          Colors
        </div>
        <div className="flex flex-wrap gap-3">
          {colorSwatches.map(({ key, label }) => {
            const colorValue = edited.designSystem.colors[key as keyof typeof edited.designSystem.colors]
            const isEditing = editingColor === key
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingColor(isEditing ? null : key)}
                  className="h-8 w-8 rounded-full border-2 border-neutral-200 dark:border-neutral-700 transition-transform hover:scale-110"
                  style={{ backgroundColor: colorValue }}
                  title={`${label}: ${colorValue}`}
                />
                {isEditing ? (
                  <input
                    type="text"
                    value={colorValue}
                    onChange={(e) => updateDesignSystem(`colors.${key}`, e.target.value)}
                    onBlur={() => setEditingColor(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingColor(null)}
                    autoFocus
                    className="w-20 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-0.5 text-[10px] text-center font-mono outline-none focus:border-neutral-400"
                  />
                ) : (
                  <span className="text-[10px] text-neutral-400">{label}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <Type className="h-3.5 w-3.5" />
          Typography
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] text-neutral-400">Display Font</span>
            <input
              type="text"
              value={edited.designSystem.typography.displayFont}
              onChange={(e) => updateDesignSystem('typography.displayFont', e.target.value)}
              className="mt-0.5 block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-2.5 py-1 text-xs outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-neutral-400">Body Font</span>
            <input
              type="text"
              value={edited.designSystem.typography.bodyFont}
              onChange={(e) => updateDesignSystem('typography.bodyFont', e.target.value)}
              className="mt-0.5 block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-2.5 py-1 text-xs outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
            />
          </label>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <Layout className="h-3.5 w-3.5" />
          Sections
        </div>
        {edited.pages.map((page, pageIdx) => (
          <div key={pageIdx} className="space-y-2">
            {page.sections.map((section, sectionIdx) => (
              <div
                key={section.id}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={section.type}
                    onChange={(e) => updateSection(pageIdx, sectionIdx, 'type', e.target.value)}
                    className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 text-xs outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
                  >
                    {SECTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSection(pageIdx, sectionIdx)}
                    className="ml-auto rounded-md p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Remove section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={section.headline}
                  onChange={(e) => updateSection(pageIdx, sectionIdx, 'headline', e.target.value)}
                  placeholder="Headline"
                  className="block w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
                />
                <input
                  type="text"
                  value={section.subtext}
                  onChange={(e) => updateSection(pageIdx, sectionIdx, 'subtext', e.target.value)}
                  placeholder="Subtext"
                  className="block w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs text-neutral-500 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400/30"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSection(pageIdx)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 py-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => onApprove(edited)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 transition-colors"
        >
          <Check className="h-4 w-4" />
          Approve &amp; Generate
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-medium px-4 py-2 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </button>
      </div>
    </div>
  )
}
