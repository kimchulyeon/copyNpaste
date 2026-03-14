import { useState } from 'react'
import ProjectManager from './pages/ProjectManager'
import FolderSelect from './pages/FolderSelect'
import DiffView from './pages/DiffView'
import WarnPatternManager from './components/WarnPatternManager'
import type { DiffFile, SavedProject } from './types'

type Step = 'projects' | 'select' | 'diff'

export default function App() {
  const [step, setStep] = useState<Step>('projects')
  const [sourcePath, setSourcePath] = useState('')
  const [destPath, setDestPath] = useState('')
  const [sourceBranch, setSourceBranch] = useState('')
  const [destBranch, setDestBranch] = useState('')
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([])
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null)
  const [warnModalOpen, setWarnModalOpen] = useState(false)

  const handleScanComplete = (files: DiffFile[]) => {
    setDiffFiles(files)
    setStep('diff')
  }

  const handleBack = () => {
    if (step === 'diff') {
      setStep('select')
      setDiffFiles([])
    } else if (step === 'select') {
      setStep('projects')
      setCurrentProject(null)
    }
  }

  const handleGoHome = () => {
    setStep('projects')
    setDiffFiles([])
    setCurrentProject(null)
  }

  const handleRescan = async () => {
    setDiffFiles([])
    setStep('select')
  }

  const handleSelectProject = (project: SavedProject) => {
    setCurrentProject(project)
    setSourcePath(project.sourcePath)
    setDestPath(project.destPath)
    setSourceBranch(project.sourceBranch || '')
    setDestBranch(project.destBranch || '')
    setStep('select')
  }

  const handleNewProject = () => {
    setCurrentProject(null)
    setSourcePath('')
    setDestPath('')
    setSourceBranch('')
    setDestBranch('')
    setStep('select')
  }

  const handleSaveProject = async (name: string) => {
    const project: SavedProject = {
      id: currentProject?.id || crypto.randomUUID(),
      name,
      sourcePath,
      destPath,
      sourceBranch: sourceBranch || undefined,
      destBranch: destBranch || undefined,
      createdAt: currentProject?.createdAt || new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    }
    await window.electronAPI.saveProject(project)
    setCurrentProject(project)
  }

  const getBackLabel = () => {
    if (step === 'diff') return '← 폴더 설정'
    if (step === 'select') return '← 프로젝트 목록'
    return ''
  }

  return (
    <div className="font-mono bg-[#0d1117] text-[#c9d1d9] min-h-screen text-[13px]">
      {/* Title Bar */}
      <div
        className="bg-[#161b22] border-b border-[#30363d] pl-20 pr-4 py-2.5 flex items-center justify-between"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">📂</span>
          <span className="font-bold text-sm text-[#e6edf3]">copyNpaste</span>
          <span className="text-[11px] text-[#8b949e] ml-1">v1.1</span>
          {currentProject && step !== 'projects' && (
            <>
              <span className="text-[#30363d] mx-1">/</span>
              <span className="text-xs text-[#8b949e]">{currentProject.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* 경고 패턴 설정 버튼 */}
          <button
            onClick={() => setWarnModalOpen(true)}
            className="flex items-center gap-1 border border-[#30363d] text-[#8b949e] px-2 py-1 rounded text-xs font-mono hover:text-[#e8b931] hover:border-[#5c4d1a] transition-colors cursor-pointer"
            title="주의 파일 패턴 관리"
          >
            <span className="text-[11px]">⚠</span>
            주의 파일
          </button>
          {step !== 'projects' && (
            <button
              onClick={handleBack}
              className="border border-[#30363d] text-[#8b949e] px-3 py-1 rounded text-xs font-mono hover:text-[#c9d1d9] hover:border-[#484f58] transition-colors cursor-pointer"
            >
              {getBackLabel()}
            </button>
          )}
        </div>
      </div>

      {step === 'projects' && (
        <ProjectManager
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
        />
      )}

      {step === 'select' && (
        <FolderSelect
          sourcePath={sourcePath}
          destPath={destPath}
          sourceBranch={sourceBranch}
          destBranch={destBranch}
          onSourceChange={setSourcePath}
          onDestChange={setDestPath}
          onSourceBranchChange={setSourceBranch}
          onDestBranchChange={setDestBranch}
          onScanComplete={handleScanComplete}
          onSaveProject={handleSaveProject}
          editingProject={currentProject}
        />
      )}

      {step === 'diff' && (
        <DiffView
          sourcePath={sourcePath}
          destPath={destPath}
          files={diffFiles}
          sourceBranch={sourceBranch}
          destBranch={destBranch}
          onGoHome={handleGoHome}
          onRescan={handleRescan}
        />
      )}

      {/* 주의 파일 패턴 관리 모달 */}
      <WarnPatternManager
        open={warnModalOpen}
        onClose={() => setWarnModalOpen(false)}
      />
    </div>
  )
}
