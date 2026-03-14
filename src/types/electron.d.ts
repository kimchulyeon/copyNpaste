import type { DiffFile, GitLogEntry, SyncResult, SavedProject, FileDiffResult } from './index'

interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  scanDiff: (source: string, dest: string) => Promise<DiffFile[]>
  getGitLog: (repoPath: string, filePath: string) => Promise<GitLogEntry[]>
  syncFiles: (source: string, dest: string, files: { path: string; status: string }[]) => Promise<SyncResult>

  // 프로젝트 관리
  getProjects: () => Promise<SavedProject[]>
  saveProject: (project: SavedProject) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  updateProjectLastUsed: (id: string) => Promise<void>

  // 경로 검증
  checkPathExists: (path: string) => Promise<boolean>

  // 브랜치 관리
  getBranches: (repoPath: string) => Promise<{ current: string; branches: string[] }>
  checkoutBranch: (repoPath: string, branch: string) => Promise<boolean>
  gitPull: (repoPath: string) => Promise<{ success: boolean; summary: string }>

  // 파일 diff
  getFileDiff: (sourcePath: string, destPath: string, filePath: string) => Promise<FileDiffResult>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
