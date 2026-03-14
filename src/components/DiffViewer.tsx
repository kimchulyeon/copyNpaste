import { useState, useEffect } from 'react'
import type { FileDiffResult, DiffHunk } from '../types'

interface DiffViewerProps {
  sourcePath: string
  destPath: string
  filePath: string
  fileStatus: 'modified' | 'new' | 'deleted'
}

export default function DiffViewer({ sourcePath, destPath, filePath, fileStatus }: DiffViewerProps) {
  const [diff, setDiff] = useState<FileDiffResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')

  useEffect(() => {
    setLoading(true)
    window.electronAPI.getFileDiff(sourcePath, destPath, filePath).then((result) => {
      setDiff(result)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [sourcePath, destPath, filePath])

  if (loading) {
    return (
      <div className="p-5 text-center text-[#484f58] text-sm">
        diff 로딩 중...
      </div>
    )
  }

  if (!diff || diff.hunks.length === 0) {
    return (
      <div className="p-5 text-center text-[#484f58] text-sm">
        {fileStatus === 'new'
          ? '새 파일 (출발지에만 존재)'
          : fileStatus === 'deleted'
            ? '삭제된 파일 (목적지에만 존재)'
            : '바이너리 파일이거나 diff를 생성할 수 없습니다'}
      </div>
    )
  }

  const addCount = diff.hunks.reduce((sum, h) => sum + h.lines.filter(l => l.type === 'add').length, 0)
  const removeCount = diff.hunks.reduce((sum, h) => sum + h.lines.filter(l => l.type === 'remove').length, 0)

  return (
    <div>
      {/* Diff Header */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#3fb950]">+{addCount}</span>
          <span className="text-[#e84040]">-{removeCount}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#21262d] rounded p-0.5">
          <button
            onClick={() => setViewMode('unified')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              viewMode === 'unified'
                ? 'bg-[#30363d] text-[#e6edf3]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              viewMode === 'split'
                ? 'bg-[#30363d] text-[#e6edf3]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-auto font-mono text-xs">
        {viewMode === 'unified'
          ? <UnifiedDiff hunks={diff.hunks} />
          : <SplitDiff hunks={diff.hunks} />
        }
      </div>
    </div>
  )
}

function UnifiedDiff({ hunks }: { hunks: DiffHunk[] }) {
  return (
    <div>
      {hunks.map((hunk, hi) => (
        <div key={hi}>
          {/* Hunk header */}
          <div className="px-4 py-1 bg-[#161b22] text-[#8b949e] border-y border-[#21262d] text-[11px]">
            @@ -{hunk.sourceStart},{hunk.sourceLines} +{hunk.destStart},{hunk.destLines} @@
          </div>
          {/* Lines */}
          {hunk.lines.map((line, li) => (
            <div
              key={li}
              className={`flex ${
                line.type === 'add'
                  ? 'bg-[#0d2818]'
                  : line.type === 'remove'
                    ? 'bg-[#2d1117]'
                    : ''
              }`}
            >
              {/* Line numbers */}
              <span className="w-[50px] shrink-0 text-right pr-2 text-[#484f58] select-none border-r border-[#21262d] py-px">
                {line.sourceLineNo ?? ''}
              </span>
              <span className="w-[50px] shrink-0 text-right pr-2 text-[#484f58] select-none border-r border-[#21262d] py-px">
                {line.destLineNo ?? ''}
              </span>
              {/* Indicator */}
              <span
                className={`w-[20px] shrink-0 text-center select-none py-px ${
                  line.type === 'add'
                    ? 'text-[#3fb950]'
                    : line.type === 'remove'
                      ? 'text-[#e84040]'
                      : 'text-transparent'
                }`}
              >
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              {/* Content */}
              <pre className="flex-1 py-px pl-1 whitespace-pre-wrap break-all">
                <code
                  className={
                    line.type === 'add'
                      ? 'text-[#aff5b4]'
                      : line.type === 'remove'
                        ? 'text-[#ffa198]'
                        : 'text-[#c9d1d9]'
                  }
                >
                  {line.content}
                </code>
              </pre>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function SplitDiff({ hunks }: { hunks: DiffHunk[] }) {
  return (
    <div>
      {hunks.map((hunk, hi) => (
        <div key={hi}>
          {/* Hunk header */}
          <div className="px-4 py-1 bg-[#161b22] text-[#8b949e] border-y border-[#21262d] text-[11px]">
            @@ -{hunk.sourceStart},{hunk.sourceLines} +{hunk.destStart},{hunk.destLines} @@
          </div>
          <div className="flex">
            {/* Source side */}
            <div className="flex-1 border-r border-[#30363d]">
              {hunk.lines
                .filter((l) => l.type !== 'add')
                .map((line, li) => (
                  <div
                    key={li}
                    className={`flex ${line.type === 'remove' ? 'bg-[#2d1117]' : ''}`}
                  >
                    <span className="w-[45px] shrink-0 text-right pr-2 text-[#484f58] select-none border-r border-[#21262d] py-px">
                      {line.sourceLineNo ?? ''}
                    </span>
                    <span
                      className={`w-[16px] shrink-0 text-center select-none py-px ${
                        line.type === 'remove' ? 'text-[#e84040]' : 'text-transparent'
                      }`}
                    >
                      {line.type === 'remove' ? '-' : ' '}
                    </span>
                    <pre className="flex-1 py-px pl-1 whitespace-pre-wrap break-all">
                      <code className={line.type === 'remove' ? 'text-[#ffa198]' : 'text-[#c9d1d9]'}>
                        {line.content}
                      </code>
                    </pre>
                  </div>
                ))}
            </div>
            {/* Dest side */}
            <div className="flex-1">
              {hunk.lines
                .filter((l) => l.type !== 'remove')
                .map((line, li) => (
                  <div
                    key={li}
                    className={`flex ${line.type === 'add' ? 'bg-[#0d2818]' : ''}`}
                  >
                    <span className="w-[45px] shrink-0 text-right pr-2 text-[#484f58] select-none border-r border-[#21262d] py-px">
                      {line.destLineNo ?? ''}
                    </span>
                    <span
                      className={`w-[16px] shrink-0 text-center select-none py-px ${
                        line.type === 'add' ? 'text-[#3fb950]' : 'text-transparent'
                      }`}
                    >
                      {line.type === 'add' ? '+' : ' '}
                    </span>
                    <pre className="flex-1 py-px pl-1 whitespace-pre-wrap break-all">
                      <code className={line.type === 'add' ? 'text-[#aff5b4]' : 'text-[#c9d1d9]'}>
                        {line.content}
                      </code>
                    </pre>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
