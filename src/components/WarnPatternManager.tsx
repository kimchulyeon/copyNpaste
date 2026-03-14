import { useState, useEffect } from 'react'

interface WarnPatternManagerProps {
  open: boolean
  onClose: () => void
}

export default function WarnPatternManager({ open, onClose }: WarnPatternManagerProps) {
  const [patterns, setPatterns] = useState<string[]>([])
  const [defaults, setDefaults] = useState<string[]>([])
  const [newPattern, setNewPattern] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      setLoading(true)
      window.electronAPI.getWarnPatterns().then((result) => {
        setPatterns(result.patterns)
        setDefaults(result.defaults)
        setLoading(false)
      })
    }
  }, [open])

  const isDefault = (pattern: string) => defaults.includes(pattern)

  const handleAdd = async () => {
    const trimmed = newPattern.trim()
    if (!trimmed || patterns.includes(trimmed)) return
    const updated = [...patterns, trimmed]
    setPatterns(updated)
    await window.electronAPI.setWarnPatterns(updated)
    setNewPattern('')
  }

  const handleRemove = async (pattern: string) => {
    if (isDefault(pattern)) return
    const success = await window.electronAPI.removeWarnPattern(pattern)
    if (success) {
      setPatterns((prev) => prev.filter((p) => p !== pattern))
    }
  }

  const handleReset = async () => {
    const result = await window.electronAPI.resetWarnPatterns()
    setPatterns(result.patterns)
    setDefaults(result.defaults)
  }

  if (!open) return null

  const customPatterns = patterns.filter((p) => !isDefault(p))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-[460px] max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d]">
          <div>
            <h3 className="text-[15px] font-semibold text-[#e6edf3]">주의 파일 패턴 관리</h3>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              해당 파일은 경고만 표시하며, 덮어쓰기를 막지는 않습니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] text-lg px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Add new pattern */}
        <div className="px-5 py-3 border-b border-[#30363d]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="예: Dockerfile, .env, k8s/"
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#c9d1d9] font-mono outline-none focus:border-[#58a6ff] transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!newPattern.trim()}
              className="bg-[#238636] border border-[#2ea043] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#2ea043] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>
          <div className="mt-2 text-[10px] text-[#484f58] leading-relaxed">
            파일명 (<code className="text-[#8b949e]">Dockerfile</code>), 접두사 (<code className="text-[#8b949e]">docker-compose.</code>), 경로 (<code className="text-[#8b949e]">.github/workflows/</code>)
          </div>
        </div>

        {/* Pattern list */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {loading ? (
            <div className="text-center text-[#484f58] text-xs py-8">로딩 중...</div>
          ) : (
            <div className="space-y-3">
              {/* 기본 패턴 */}
              <div>
                <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  기본 패턴
                  <span className="text-[10px] text-[#484f58] normal-case tracking-normal">삭제 불가</span>
                </div>
                <div className="space-y-1">
                  {defaults.map((pattern) => (
                    <div
                      key={pattern}
                      className="flex items-center justify-between px-3 py-1.5 rounded bg-[#0d1117] border border-[#21262d]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#e8b931] text-xs">⚠</span>
                        <code className="text-xs text-[#8b949e] font-mono">{pattern}</code>
                        {pattern.endsWith('/') && (
                          <span className="text-[10px] text-[#484f58] bg-[#161b22] px-1.5 py-0.5 rounded">폴더</span>
                        )}
                        {pattern.endsWith('.') && !pattern.endsWith('/') && (
                          <span className="text-[10px] text-[#484f58] bg-[#161b22] px-1.5 py-0.5 rounded">접두사</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#30363d]">기본</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 사용자 추가 패턴 */}
              {customPatterns.length > 0 && (
                <div>
                  <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mb-1.5">
                    사용자 추가 패턴
                  </div>
                  <div className="space-y-1">
                    {customPatterns.map((pattern) => (
                      <div
                        key={pattern}
                        className="flex items-center justify-between px-3 py-1.5 rounded bg-[#0d1117] border border-[#21262d] group hover:border-[#30363d] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#e8b931] text-xs">⚠</span>
                          <code className="text-xs text-[#c9d1d9] font-mono">{pattern}</code>
                          {pattern.endsWith('/') && (
                            <span className="text-[10px] text-[#484f58] bg-[#161b22] px-1.5 py-0.5 rounded">폴더</span>
                          )}
                          {pattern.endsWith('.') && !pattern.endsWith('/') && (
                            <span className="text-[10px] text-[#484f58] bg-[#161b22] px-1.5 py-0.5 rounded">접두사</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(pattern)}
                          className="text-[#484f58] hover:text-[#e84040] text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer px-1"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#30363d]">
          <button
            onClick={handleReset}
            className="text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors cursor-pointer"
            title="사용자 추가 패턴을 모두 삭제하고 기본값으로 복원합니다"
          >
            기본값으로 초기화
          </button>
          <span className="text-[11px] text-[#484f58]">
            기본 {defaults.length}개 + 사용자 {customPatterns.length}개
          </span>
        </div>
      </div>
    </div>
  )
}
