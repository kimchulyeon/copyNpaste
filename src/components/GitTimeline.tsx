import { memo } from 'react'
import type { GitLogEntry } from '../types'

interface GitTimelineProps {
  entries: GitLogEntry[]
  loading?: boolean
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return isoDate
  }
}

export default memo(function GitTimeline({ entries, loading }: GitTimelineProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-[#484f58] text-sm">
        Git 이력 로딩 중...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-[#484f58] text-sm">
        Git 이력이 없습니다
      </div>
    )
  }

  return (
    <div>
      {entries.map((log, i) => (
        <div
          key={log.hash}
          className="flex gap-3 relative"
          style={{ paddingBottom: i < entries.length - 1 ? 20 : 0 }}
        >
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center w-5 shrink-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 border-2 ${
                i === 0
                  ? 'bg-[#58a6ff] border-[#58a6ff]'
                  : 'bg-[#30363d] border-[#484f58]'
              }`}
            />
            {i < entries.length - 1 && (
              <div className="w-0.5 flex-1 bg-[#21262d] mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-1">
            <div className="text-[13px] text-[#e6edf3] mb-1 leading-snug">
              {log.message}
            </div>
            <div className="flex gap-3 text-[11px] text-[#8b949e]">
              <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-[#58a6ff] font-mono">
                {log.hash}
              </span>
              <span>{log.author}</span>
              <span>{formatDate(log.date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
