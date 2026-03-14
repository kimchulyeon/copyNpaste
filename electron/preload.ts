import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanDiff: (source: string, dest: string) => ipcRenderer.invoke('scan-diff', source, dest),
  getGitLog: (repoPath: string, filePath: string) => ipcRenderer.invoke('get-git-log', repoPath, filePath),
  syncFiles: (source: string, dest: string, files: string[]) => ipcRenderer.invoke('sync-files', source, dest, files),

  // 프로젝트 관리
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (project: any) => ipcRenderer.invoke('save-project', project),
  deleteProject: (id: string) => ipcRenderer.invoke('delete-project', id),
  updateProjectLastUsed: (id: string) => ipcRenderer.invoke('update-project-last-used', id),

  // 경로 검증
  checkPathExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),

  // 브랜치 관리
  getBranches: (repoPath: string) => ipcRenderer.invoke('get-branches', repoPath),
  checkoutBranch: (repoPath: string, branch: string) => ipcRenderer.invoke('checkout-branch', repoPath, branch),
  gitPull: (repoPath: string, branch?: string) => ipcRenderer.invoke('git-pull', repoPath, branch),

  // 경고 패턴 관리
  getWarnPatterns: () => ipcRenderer.invoke('get-warn-patterns'),
  setWarnPatterns: (patterns: string[]) => ipcRenderer.invoke('set-warn-patterns', patterns),
  removeWarnPattern: (pattern: string) => ipcRenderer.invoke('remove-warn-pattern', pattern),
  resetWarnPatterns: () => ipcRenderer.invoke('reset-warn-patterns'),

  // 확인 다이얼로그
  showConfirm: (title: string, message: string, detail?: string) =>
    ipcRenderer.invoke('show-confirm', title, message, detail),

  // 파일 diff
  getFileDiff: (sourcePath: string, destPath: string, filePath: string) =>
    ipcRenderer.invoke('get-file-diff', sourcePath, destPath, filePath),
})
