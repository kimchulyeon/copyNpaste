import { useState, useEffect } from 'react'
import type { DiffFile, SavedProject } from '../types'
import BranchSelector from '../components/BranchSelector'

interface FolderSelectProps {
  sourcePath: string
  destPath: string
  sourceBranch: string
  destBranch: string
  onSourceChange: (path: string) => void
  onDestChange: (path: string) => void
  onSourceBranchChange: (branch: string) => void
  onDestBranchChange: (branch: string) => void
  onScanComplete: (files: DiffFile[]) => void
  onSaveProject: (name: string) => void
  editingProject?: SavedProject | null
}

export default function FolderSelect({
  sourcePath,
  destPath,
  sourceBranch,
  destBranch,
  onSourceChange,
  onDestChange,
  onSourceBranchChange,
  onDestBranchChange,
  onScanComplete,
  onSaveProject,
  editingProject,
}: FolderSelectProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceExists, setSourceExists] = useState<boolean | null>(null)
  const [destExists, setDestExists] = useState<boolean | null>(null)
  const [projectName, setProjectName] = useState(editingProject?.name || '')
  const [showSave, setShowSave] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [pullResult, setPullResult] = useState<{ success: boolean; summary: string } | null>(null)

  // 경로 존재 여부 검증
  useEffect(() => {
    if (!sourcePath) { setSourceExists(null); return }
    const t = setTimeout(() => {
      window.electronAPI.checkPathExists(sourcePath).then(setSourceExists)
    }, 300)
    return () => clearTimeout(t)
  }, [sourcePath])

  useEffect(() => {
    if (!destPath) { setDestExists(null); return }
    const t = setTimeout(() => {
      window.electronAPI.checkPathExists(destPath).then(setDestExists)
    }, 300)
    return () => clearTimeout(t)
  }, [destPath])

  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name)
    }
  }, [editingProject])

  const handleBrowse = async (setter: (path: string) => void) => {
    const result = await window.electronAPI.selectFolder()
    if (result) setter(result)
  }

  const handleScan = async () => {
    if (!sourcePath || !destPath) return
    setScanning(true)
    setError(null)
    try {
      const files = await window.electronAPI.scanDiff(sourcePath, destPath)
      if (files.length === 0) {
        setError('두 폴더 간 차이가 없습니다.')
        setScanning(false)
        return
      }
      onScanComplete(files)
    } catch (err) {
      setError(err instanceof Error ? err.message : '스캔 중 오류가 발생했습니다.')
    }
    setScanning(false)
  }

  const handlePull = async () => {
    if (!sourcePath || !sourceExists) return
    setPulling(true)
    setPullResult(null)
    const result = await window.electronAPI.gitPull(sourcePath)
    setPullResult(result)
    setPulling(false)
    setTimeout(() => setPullResult(null), 4000)
  }

  const handleSave = () => {
    if (!projectName.trim()) return
    onSaveProject(projectName.trim())
    setShowSave(false)
  }

  const canScan = sourcePath && destPath && !scanning && sourceExists !== false && destExists !== false

  const PathIndicator = ({ exists }: { exists: boolean | null }) => {
    if (exists === null) return null
    return (
      <span className={`text-xs ml-2 ${exists ? 'text-[#3fb950]' : 'text-[#e84040]'}`} title={exists ? '경로 존재' : '경로가 존재하지 않습니다'}>
        {exists ? '✓' : '✗ 경로 없음'}
      </span>
    )
  }

  return (
    <div className="px-10 py-8 max-w-[560px] mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[32px] mb-3">📂 → 📂</div>
        <h2 className="text-[#e6edf3] font-semibold text-lg m-0">
          {editingProject ? editingProject.name : '프로젝트 폴더 동기화'}
        </h2>
        <p className="text-[#8b949e] text-xs mt-2">
          출발지(회사)와 목적지(고객사) 폴더를 선택하세요
        </p>
      </div>

      {/* Source Path */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[#8b949e] text-[11px] uppercase tracking-widest flex items-center">
            출발지 (회사 프로젝트)
            <PathIndicator exists={sourceExists} />
          </label>
          {sourcePath && sourceExists && (
            <div className="flex items-center gap-1.5">
              <BranchSelector
                repoPath={sourcePath}
                currentBranch={sourceBranch}
                onBranchChange={onSourceBranchChange}
              />
              {sourceBranch && (
                <button
                  onClick={handlePull}
                  disabled={pulling}
                  className="flex items-center gap-1 px-2 py-1 rounded border border-[#30363d] text-xs text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] bg-[#21262d] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="원격 저장소에서 최신 코드 가져오기 (git pull)"
                >
                  {pulling ? (
                    <span className="inline-block w-3 h-3 border border-[#8b949e]/30 border-t-[#8b949e] rounded-full animate-spin" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 4a.5.5 0 01.5.5v5.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L7.5 10.293V4.5A.5.5 0 018 4z" />
                      <path d="M3.5 1.5A1.5 1.5 0 015 0h6a1.5 1.5 0 011.5 1.5v3a.5.5 0 01-1 0v-3A.5.5 0 0011 1H5a.5.5 0 00-.5.5v3a.5.5 0 01-1 0v-3z" />
                      <path d="M2 7.5A1.5 1.5 0 013.5 6h9A1.5 1.5 0 0114 7.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 14.5v-7zm1.5-.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-9z" />
                    </svg>
                  )}
                  최신화
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={sourcePath}
            onChange={(e) => onSourceChange(e.target.value)}
            placeholder="/Users/dev/company/project"
            className={`flex-1 bg-[#0d1117] border rounded text-[#c9d1d9] px-3 py-2.5 text-[13px] font-mono outline-none transition-colors ${
              sourceExists === false
                ? 'border-[#e84040] focus:border-[#e84040]'
                : 'border-[#30363d] focus:border-[#58a6ff]'
            }`}
          />
          <button
            onClick={() => handleBrowse(onSourceChange)}
            className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] px-3.5 rounded text-xs font-mono whitespace-nowrap hover:bg-[#30363d] transition-colors cursor-pointer"
          >
            찾아보기
          </button>
        </div>
      </div>

      {/* Arrow */}
      <div className="text-center text-[#30363d] my-3 text-lg">↓</div>

      {/* Dest Path */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[#8b949e] text-[11px] uppercase tracking-widest flex items-center">
            목적지 (고객사 프로젝트)
            <PathIndicator exists={destExists} />
          </label>
          {destPath && destExists && (
            <BranchSelector
              repoPath={destPath}
              currentBranch={destBranch}
              onBranchChange={onDestBranchChange}
            />
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={destPath}
            onChange={(e) => onDestChange(e.target.value)}
            placeholder="/Users/dev/client/project"
            className={`flex-1 bg-[#0d1117] border rounded text-[#c9d1d9] px-3 py-2.5 text-[13px] font-mono outline-none transition-colors ${
              destExists === false
                ? 'border-[#e84040] focus:border-[#e84040]'
                : 'border-[#30363d] focus:border-[#58a6ff]'
            }`}
          />
          <button
            onClick={() => handleBrowse(onDestChange)}
            className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] px-3.5 rounded text-xs font-mono whitespace-nowrap hover:bg-[#30363d] transition-colors cursor-pointer"
          >
            찾아보기
          </button>
        </div>
      </div>

      {/* Pull Result */}
      {pullResult && (
        <div
          className={`mb-4 p-3 rounded-md text-xs ${
            pullResult.success
              ? 'bg-[#0d2818] border border-[#2a5c2a] text-[#3fb950]'
              : 'bg-[#2e1a1a] border border-[#5c2a2a] text-[#e84040]'
          }`}
        >
          {pullResult.success ? '✓' : '✗'} {pullResult.summary}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-[#2e1a1a] border border-[#5c2a2a] rounded-md text-xs text-[#e84040]">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleScan}
          disabled={!canScan}
          className={`w-full py-3 rounded-md text-sm font-semibold font-mono transition-all ${
            canScan
              ? 'bg-[#238636] border border-[#2ea043] text-white hover:bg-[#2ea043] cursor-pointer'
              : 'bg-[#21262d] border border-[#30363d] text-[#484f58] cursor-not-allowed'
          }`}
        >
          {scanning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              스캔 중...
            </span>
          ) : (
            '차이점 스캔'
          )}
        </button>

        {/* Save Project */}
        {sourcePath && destPath && (
          <>
            {showSave ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="프로젝트 이름"
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] px-3 py-2 text-xs font-mono outline-none focus:border-[#58a6ff]"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button
                  onClick={handleSave}
                  disabled={!projectName.trim()}
                  className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] px-3 rounded text-xs hover:bg-[#30363d] transition-colors cursor-pointer disabled:text-[#484f58] disabled:cursor-not-allowed"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowSave(false)}
                  className="border border-[#30363d] text-[#8b949e] px-3 rounded text-xs hover:text-[#c9d1d9] transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSave(true)}
                className="w-full py-2 rounded-md text-xs text-[#8b949e] border border-[#30363d] hover:border-[#484f58] hover:text-[#c9d1d9] transition-colors cursor-pointer"
              >
                {editingProject ? '프로젝트 설정 업데이트' : '이 설정을 프로젝트로 저장'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
