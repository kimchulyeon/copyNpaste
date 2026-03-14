import { useState, useEffect } from 'react'
import type { SavedProject } from '../types'

interface ProjectManagerProps {
  onSelectProject: (project: SavedProject) => void
  onNewProject: () => void
}

export default function ProjectManager({ onSelectProject, onNewProject }: ProjectManagerProps) {
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [pathStatus, setPathStatus] = useState<Record<string, { source: boolean; dest: boolean }>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    const saved = await window.electronAPI.getProjects()
    setProjects(saved)

    // 경로 존재 여부 확인
    const statuses: Record<string, { source: boolean; dest: boolean }> = {}
    await Promise.all(
      saved.map(async (p) => {
        const [sourceExists, destExists] = await Promise.all([
          window.electronAPI.checkPathExists(p.sourcePath),
          window.electronAPI.checkPathExists(p.destPath),
        ])
        statuses[p.id] = { source: sourceExists, dest: destExists }
      })
    )
    setPathStatus(statuses)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까?')) return
    await window.electronAPI.deleteProject(id)
    loadProjects()
  }

  const handleRename = async (project: SavedProject) => {
    if (!editName.trim()) return
    await window.electronAPI.saveProject({ ...project, name: editName.trim() })
    setEditingId(null)
    loadProjects()
  }

  const handleSelect = async (project: SavedProject) => {
    const status = pathStatus[project.id]
    if (status && (!status.source || !status.dest)) {
      const missing = []
      if (!status.source) missing.push(`출발지: ${project.sourcePath}`)
      if (!status.dest) missing.push(`목적지: ${project.destPath}`)
      alert(`다음 경로가 존재하지 않습니다:\n\n${missing.join('\n')}`)
      return
    }
    await window.electronAPI.updateProjectLastUsed(project.id)
    onSelectProject(project)
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return '방금 전'
      if (diffMins < 60) return `${diffMins}분 전`
      if (diffHours < 24) return `${diffHours}시간 전`
      if (diffDays < 7) return `${diffDays}일 전`
      return `${d.getMonth() + 1}/${d.getDate()}`
    } catch {
      return ''
    }
  }

  return (
    <div className="px-10 py-8 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[#e6edf3] font-semibold text-lg">프로젝트</h2>
          <p className="text-[#8b949e] text-xs mt-1">
            저장된 프로젝트를 선택하거나 새로 만드세요
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 bg-[#238636] border border-[#2ea043] text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#2ea043] transition-colors cursor-pointer"
        >
          <span className="text-sm">+</span>
          새 프로젝트
        </button>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="text-center py-16 text-[#484f58]">로딩 중...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[32px] mb-3">📂</div>
          <div className="text-[#484f58] mb-4">저장된 프로젝트가 없습니다</div>
          <button
            onClick={onNewProject}
            className="text-[#58a6ff] text-sm hover:underline cursor-pointer"
          >
            새 프로젝트 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects
            .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
            .map((project) => {
              const status = pathStatus[project.id]
              const sourceOk = status?.source ?? true
              const destOk = status?.dest ?? true
              const hasIssue = !sourceOk || !destOk

              return (
                <div
                  key={project.id}
                  className={`border rounded-lg transition-all ${
                    hasIssue
                      ? 'border-[#5c2a2a] bg-[#161b22]'
                      : 'border-[#30363d] bg-[#161b22] hover:border-[#484f58]'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleSelect(project)}
                  >
                    {/* Project name row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        {hasIssue && (
                          <span className="text-[#e84040]" title="경로가 존재하지 않습니다">
                            ●
                          </span>
                        )}
                        {editingId === project.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              handleRename(project)
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleRename(project)}
                              className="bg-[#0d1117] border border-[#58a6ff] rounded px-2 py-0.5 text-sm text-[#e6edf3] outline-none"
                              autoFocus
                            />
                          </form>
                        ) : (
                          <span className="text-[15px] font-semibold text-[#e6edf3]">
                            {project.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] text-[#484f58]">
                          {formatDate(project.lastUsedAt)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(project.id)
                            setEditName(project.name)
                          }}
                          className="text-[#8b949e] hover:text-[#c9d1d9] text-xs px-1.5 py-0.5 rounded hover:bg-[#21262d] transition-colors"
                          title="이름 변경"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-[#8b949e] hover:text-[#e84040] text-xs px-1.5 py-0.5 rounded hover:bg-[#21262d] transition-colors"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Paths */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={sourceOk ? 'text-[#3fb950]' : 'text-[#e84040]'}>
                          {sourceOk ? '●' : '●'}
                        </span>
                        <span className="text-[#8b949e]">출발</span>
                        <span className={`font-mono truncate ${sourceOk ? 'text-[#8b949e]' : 'text-[#e84040]'}`}>
                          {project.sourcePath}
                        </span>
                        {project.sourceBranch && (
                          <span className="text-[#58a6ff] bg-[#0d1117] px-1.5 py-0.5 rounded text-[10px]">
                            {project.sourceBranch}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={destOk ? 'text-[#f0883e]' : 'text-[#e84040]'}>
                          {destOk ? '●' : '●'}
                        </span>
                        <span className="text-[#8b949e]">목적</span>
                        <span className={`font-mono truncate ${destOk ? 'text-[#8b949e]' : 'text-[#e84040]'}`}>
                          {project.destPath}
                        </span>
                        {project.destBranch && (
                          <span className="text-[#58a6ff] bg-[#0d1117] px-1.5 py-0.5 rounded text-[10px]">
                            {project.destBranch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
