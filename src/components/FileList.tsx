import type { DiffFile } from '../types'
import StatusBadge from './StatusBadge'

interface FileListProps {
  files: DiffFile[]
  checkedFiles: Set<string>
  selectedFile: string | null
  onToggleCheck: (path: string) => void
  onToggleAll: () => void
  onSelectFile: (path: string) => void
}

export default function FileList({
  files,
  checkedFiles,
  selectedFile,
  onToggleCheck,
  onToggleAll,
  onSelectFile,
}: FileListProps) {
  // Group files by directory
  const grouped = files.reduce<Record<string, DiffFile[]>>((acc, file) => {
    const dir = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/') + 1) : ''
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(file)
    return acc
  }, {})

  return (
    <div className="flex-1 overflow-auto">
      {/* Toolbar */}
      <div className="px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117] sticky top-0 z-10">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={checkedFiles.size === files.length && files.length > 0}
            onChange={onToggleAll}
            className="accent-[#238636]"
          />
          전체 선택
        </label>
        <span className="text-[11px] text-[#8b949e]">
          {files.length}개 변경 · {checkedFiles.size}개 선택
        </span>
      </div>

      {/* File entries */}
      {Object.entries(grouped).map(([dir, dirFiles]) => (
        <div key={dir}>
          {dir && (
            <div className="px-3.5 py-1.5 text-[11px] text-[#8b949e] bg-[#161b22] border-b border-[#21262d] font-mono">
              {dir}
            </div>
          )}
          {dirFiles.map((file) => {
            const isActive = selectedFile === file.path
            const fileName = file.path.includes('/')
              ? file.path.substring(file.path.lastIndexOf('/') + 1)
              : file.path

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`px-3.5 py-2.5 border-b border-[#21262d] cursor-pointer transition-all duration-100 ${
                  isActive
                    ? 'bg-[#161b22] border-l-2 border-l-[#58a6ff]'
                    : 'border-l-2 border-l-transparent hover:bg-[#161b2288]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkedFiles.has(file.path)}
                    onChange={(e) => {
                      e.stopPropagation()
                      onToggleCheck(file.path)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-[#238636] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {file.isDanger && (
                        <span
                          title="인프라/배포 파일 — 덮어쓰기 주의!"
                          className="text-[#e8b931] text-sm cursor-help"
                        >
                          ⚠
                        </span>
                      )}
                      <span
                        className={`text-[13px] truncate ${
                          file.isDanger ? 'text-[#e8b931]' : 'text-[#e6edf3]'
                        }`}
                      >
                        {fileName}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={file.status} />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
