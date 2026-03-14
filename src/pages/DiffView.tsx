import { useState, useEffect, useCallback, useRef } from 'react'
import type { DiffFile, GitLogEntry, SyncResult, FileDiffResult } from '../types'
import FileList from '../components/FileList'
import FileDetail from '../components/FileDetail'

interface DiffViewProps {
  sourcePath: string
  destPath: string
  files: DiffFile[]
  sourceBranch: string
  destBranch: string
  onGoHome: () => void
  onRescan: () => void
}

export default function DiffView({ sourcePath, destPath, files, sourceBranch, destBranch, onGoHome, onRescan }: DiffViewProps) {
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [gitLog, setGitLog] = useState<GitLogEntry[]>([])
  const [gitLogLoading, setGitLogLoading] = useState(false)
  const [fileDiff, setFileDiff] = useState<FileDiffResult | null>(null)
  const [fileDiffLoading, setFileDiffLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Cache for git logs and file diffs
  const gitLogCache = useRef<Record<string, GitLogEntry[]>>({})
  const diffCache = useRef<Record<string, FileDiffResult>>({})

  const activeFile = files.find((f) => f.path === selectedFile) || null

  const hasDangerChecked = [...checkedFiles].some((path) =>
    files.find((f) => f.path === path)?.isDanger
  )

  // Fetch git log with caching
  const fetchGitLog = useCallback(
    async (filePath: string) => {
      if (gitLogCache.current[filePath]) {
        setGitLog(gitLogCache.current[filePath])
        return
      }
      setGitLogLoading(true)
      try {
        const log = await window.electronAPI.getGitLog(sourcePath, filePath)
        gitLogCache.current[filePath] = log
        setGitLog(log)
      } catch {
        setGitLog([])
      }
      setGitLogLoading(false)
    },
    [sourcePath]
  )

  // Fetch file diff with caching
  const fetchFileDiff = useCallback(
    async (filePath: string) => {
      if (diffCache.current[filePath]) {
        setFileDiff(diffCache.current[filePath])
        return
      }
      setFileDiffLoading(true)
      try {
        const diff = await window.electronAPI.getFileDiff(sourcePath, destPath, filePath)
        diffCache.current[filePath] = diff
        setFileDiff(diff)
      } catch {
        setFileDiff(null)
      }
      setFileDiffLoading(false)
    },
    [sourcePath, destPath]
  )

  useEffect(() => {
    if (selectedFile) {
      fetchGitLog(selectedFile)
      fetchFileDiff(selectedFile)
    }
  }, [selectedFile, fetchGitLog, fetchFileDiff])

  const toggleCheck = useCallback((path: string) => {
    setCheckedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setCheckedFiles((prev) => {
      if (prev.size === files.length) return new Set()
      return new Set(files.map((f) => f.path))
    })
  }, [files])

  const selectFile = useCallback((path: string) => {
    setSelectedFile(path)
  }, [])

  const handleSync = async () => {
    if (checkedFiles.size === 0) return

    const dangerSelected = [...checkedFiles].filter((path) =>
      files.find((f) => f.path === path)?.isDanger
    )

    if (dangerSelected.length > 0) {
      const confirmed = await window.electronAPI.showConfirm(
        '주의 파일 포함',
        `⚠ 인프라/배포 파일 ${dangerSelected.length}개가 포함되어 있습니다.\n정말 덮어쓰시겠습니까?`,
        dangerSelected.join('\n')
      )
      if (!confirmed) return
    }

    setSyncing(true)
    try {
      const syncItems = [...checkedFiles].map((p) => {
        const file = files.find((f) => f.path === p)
        return { path: p, status: file?.status || 'modified' }
      })
      const result = await window.electronAPI.syncFiles(
        sourcePath,
        destPath,
        syncItems
      )
      setSyncResult(result)
    } catch (err) {
      setSyncResult({
        success: false,
        syncedFiles: [],
        failedFiles: [
          {
            path: 'unknown',
            error: err instanceof Error ? err.message : String(err),
          },
        ],
      })
    }
    setSyncing(false)
  }

  // 동기화 완료 결과 화면
  if (syncResult) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-45px)]">
        <div className="max-w-[480px] w-full px-8">
          {/* Result icon */}
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                syncResult.success
                  ? 'bg-[#0d2818] border-2 border-[#2a5c2a]'
                  : 'bg-[#2d1117] border-2 border-[#5c2a2a]'
              }`}
            >
              <span className="text-[28px]">
                {syncResult.success ? '✓' : '✗'}
              </span>
            </div>
            <h2
              className={`text-xl font-bold mb-1 ${
                syncResult.success ? 'text-[#3fb950]' : 'text-[#e84040]'
              }`}
            >
              {syncResult.success ? '동기화 완료' : '동기화 실패'}
            </h2>
            <p className="text-[#8b949e] text-sm">
              {syncResult.success
                ? `${syncResult.syncedFiles.length}개 파일이 목적지에 반영되었습니다`
                : `${syncResult.failedFiles.length}개 파일에서 오류가 발생했습니다`}
            </p>
          </div>

          {/* File list */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg mb-6 max-h-[280px] overflow-auto">
            {syncResult.syncedFiles.length > 0 && (
              <div>
                <div className="px-4 py-2 text-[11px] text-[#8b949e] uppercase tracking-wider border-b border-[#21262d] bg-[#0d1117] sticky top-0">
                  성공 ({syncResult.syncedFiles.length})
                </div>
                {syncResult.syncedFiles.map((file) => (
                  <div key={file} className="px-4 py-1.5 text-xs flex items-center gap-2 border-b border-[#21262d] last:border-b-0">
                    <span className="text-[#3fb950]">✓</span>
                    <span className="text-[#c9d1d9] font-mono truncate">{file}</span>
                  </div>
                ))}
              </div>
            )}
            {syncResult.failedFiles.length > 0 && (
              <div>
                <div className="px-4 py-2 text-[11px] text-[#e84040] uppercase tracking-wider border-b border-[#21262d] bg-[#0d1117] sticky top-0">
                  실패 ({syncResult.failedFiles.length})
                </div>
                {syncResult.failedFiles.map((file) => (
                  <div key={file.path} className="px-4 py-1.5 text-xs border-b border-[#21262d] last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#e84040]">✗</span>
                      <span className="text-[#c9d1d9] font-mono truncate">{file.path}</span>
                    </div>
                    <div className="text-[#e84040] text-[11px] ml-5 mt-0.5">{file.error}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={onRescan}
              className="w-full py-3 rounded-md text-sm font-semibold font-mono bg-[#238636] border border-[#2ea043] text-white hover:bg-[#2ea043] transition-colors cursor-pointer"
            >
              다시 스캔하기
            </button>
            <button
              onClick={onGoHome}
              className="w-full py-2.5 rounded-md text-xs text-[#8b949e] border border-[#30363d] hover:border-[#484f58] hover:text-[#c9d1d9] transition-colors cursor-pointer"
            >
              프로젝트 목록으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-45px)]">
      {/* Left Panel - File List */}
      <div className="w-[420px] border-r border-[#30363d] flex flex-col shrink-0">
        {/* Path Info */}
        <div className="px-3.5 py-2.5 border-b border-[#30363d] bg-[#161b22]">
          <div className="text-[11px] text-[#8b949e] mb-1 flex items-center gap-2">
            <span className="text-[#3fb950]">출발</span>
            <span className="truncate">{sourcePath}</span>
            {sourceBranch && (
              <span className="text-[#58a6ff] bg-[#0d1117] px-1.5 py-0.5 rounded text-[10px] shrink-0">
                {sourceBranch}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#8b949e] flex items-center gap-2">
            <span className="text-[#f0883e]">목적</span>
            <span className="truncate">{destPath}</span>
            {destBranch && (
              <span className="text-[#58a6ff] bg-[#0d1117] px-1.5 py-0.5 rounded text-[10px] shrink-0">
                {destBranch}
              </span>
            )}
          </div>
        </div>

        {/* File List */}
        <FileList
          files={files}
          checkedFiles={checkedFiles}
          selectedFile={selectedFile}
          onToggleCheck={toggleCheck}
          onToggleAll={toggleAll}
          onSelectFile={selectFile}
        />

        {/* Sync Button */}
        <div className="p-3.5 border-t border-[#30363d] bg-[#161b22]">
          <button
            onClick={handleSync}
            disabled={checkedFiles.size === 0 || syncing}
            className={`w-full py-3 rounded-md text-sm font-semibold font-mono transition-all ${
              checkedFiles.size > 0
                ? hasDangerChecked
                  ? 'bg-[#9e6a03] border border-[#bb8009] text-white hover:bg-[#bb8009] cursor-pointer'
                  : 'bg-[#238636] border border-[#2ea043] text-white hover:bg-[#2ea043] cursor-pointer'
                : 'bg-[#21262d] border border-[#30363d] text-[#484f58] cursor-not-allowed'
            }`}
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                동기화 중...
              </span>
            ) : hasDangerChecked
              ? `⚠ ${checkedFiles.size}개 파일 덮어쓰기 (주의 필요)`
              : `${checkedFiles.size}개 파일 덮어쓰기`}
          </button>
        </div>
      </div>

      {/* Right Panel - Detail */}
      <div className="flex-1 bg-[#0d1117] overflow-hidden flex flex-col">
        {activeFile ? (
          <FileDetail
            file={activeFile}
            gitLog={gitLog}
            gitLogLoading={gitLogLoading}
            fileDiff={fileDiff}
            fileDiffLoading={fileDiffLoading}
            sourcePath={sourcePath}
            destPath={destPath}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#484f58]">
            <div className="text-center">
              <div className="text-[32px] mb-3">📄</div>
              <div>파일을 선택하면 상세 정보가 표시됩니다</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
