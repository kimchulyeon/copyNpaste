import { useState } from 'react'
import type { DiffFile, GitLogEntry } from '../types'
import StatusBadge from './StatusBadge'
import GitTimeline from './GitTimeline'
import DiffViewer from './DiffViewer'

interface FileDetailProps {
  file: DiffFile
  gitLog: GitLogEntry[]
  gitLogLoading: boolean
  sourcePath: string
  destPath: string
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return '-'
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '-'
  try {
    const d = new Date(isoDate)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return isoDate || '-'
  }
}

export default function FileDetail({ file, gitLog, gitLogLoading, sourcePath, destPath }: FileDetailProps) {
  const [activeTab, setActiveTab] = useState<'diff' | 'history'>('diff')

  return (
    <div className="flex flex-col h-full">
      {/* File Header */}
      <div className="p-4 px-5 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={file.status} />
          {file.isDanger && (
            <span
              title="인프라/배포 파일 — 덮어쓰기 주의!"
              className="text-[#e8b931] text-sm cursor-help"
            >
              ⚠
            </span>
          )}
          <span className="text-[15px] font-semibold text-[#e6edf3]">
            {file.path}
          </span>
        </div>
        <div className="flex gap-6 text-xs text-[#8b949e]">
          <span>
            출발:{' '}
            <span className="text-[#3fb950]">{formatSize(file.sourceSize)}</span>
            {' · '}
            {formatDate(file.sourceModified)}
          </span>
          <span>
            목적:{' '}
            <span className="text-[#f0883e]">{formatSize(file.destSize)}</span>
            {' · '}
            {formatDate(file.destModified)}
          </span>
        </div>
      </div>

      {/* Danger Warning */}
      {file.isDanger && (
        <div className="mx-5 my-3 p-3 px-4 bg-[#2d2a1e] border border-[#5c4d1a] rounded-md text-xs text-[#e8b931] leading-relaxed shrink-0">
          ⚠ <strong>인프라/배포 파일</strong>입니다. 회사와 고객사의 배포 환경이
          다를 수 있으므로 덮어쓰기 시 주의가 필요합니다.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#30363d] px-5 shrink-0">
        <button
          onClick={() => setActiveTab('diff')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'diff'
              ? 'border-[#58a6ff] text-[#e6edf3]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          변경 내용
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'history'
              ? 'border-[#58a6ff] text-[#e6edf3]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Git 이력
          {gitLog.length > 0 && (
            <span className="ml-1.5 bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded-full text-[10px]">
              {gitLog.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'diff' ? (
          <DiffViewer
            sourcePath={sourcePath}
            destPath={destPath}
            filePath={file.path}
            fileStatus={file.status}
          />
        ) : (
          <div className="p-4 px-5">
            <h3 className="text-xs text-[#8b949e] uppercase tracking-wider mb-4 font-medium">
              Git 이력 (출발지)
            </h3>
            <GitTimeline entries={gitLog} loading={gitLogLoading} />
          </div>
        )}
      </div>
    </div>
  )
}
