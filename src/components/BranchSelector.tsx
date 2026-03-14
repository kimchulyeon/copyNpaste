import { useState, useEffect, useRef } from 'react'

interface BranchSelectorProps {
  repoPath: string
  currentBranch: string
  onBranchChange: (branch: string) => void
  disabled?: boolean
}

export default function BranchSelector({
  repoPath,
  currentBranch,
  onBranchChange,
  disabled,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!repoPath) return
    setLoading(true)
    window.electronAPI.getBranches(repoPath).then((result) => {
      setBranches(result.branches)
      if (result.current && !currentBranch) {
        onBranchChange(result.current)
      }
      setLoading(false)
    })
  }, [repoPath])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBranches = branches.filter((b) =>
    b.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (branch: string) => {
    setOpen(false)
    setSearch('')
    if (branch === currentBranch) return
    const success = await window.electronAPI.checkoutBranch(repoPath, branch)
    if (success) {
      onBranchChange(branch)
    }
  }

  if (!repoPath || branches.length === 0) {
    return (
      <span className="text-[11px] text-[#484f58] italic">
        {loading ? '브랜치 로딩...' : 'Git 저장소 없음'}
      </span>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-colors ${
          disabled
            ? 'border-[#21262d] text-[#484f58] cursor-not-allowed'
            : 'border-[#30363d] text-[#c9d1d9] hover:border-[#484f58] cursor-pointer bg-[#21262d]'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-[#8b949e]">
          <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
        </svg>
        <span className="max-w-[120px] truncate">{currentBranch || '선택...'}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-[#484f58]">
          <path d="M4 6L1 2h6L4 6z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-[220px] bg-[#161b22] border border-[#30363d] rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-[#30363d]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="브랜치 검색..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-[#c9d1d9] outline-none focus:border-[#58a6ff]"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-auto">
            {filteredBranches.map((branch) => (
              <button
                key={branch}
                onClick={() => handleSelect(branch)}
                className={`w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-[#21262d] transition-colors flex items-center gap-2 ${
                  branch === currentBranch ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'
                }`}
              >
                {branch === currentBranch && (
                  <span className="text-[#58a6ff]">✓</span>
                )}
                <span className={branch === currentBranch ? '' : 'ml-4'}>{branch}</span>
              </button>
            ))}
            {filteredBranches.length === 0 && (
              <div className="px-3 py-2 text-xs text-[#484f58]">결과 없음</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
