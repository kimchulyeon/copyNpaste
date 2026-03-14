import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { scanDiff } from './services/diffService'
import { getGitLog, getBranches, checkoutBranch, gitPull } from './services/gitService'
import { syncFiles } from './services/syncService'
import { getProjects, saveProject, deleteProject, updateProjectLastUsed, getWarnPatterns, setWarnPatterns, removeWarnPattern, resetWarnPatterns, getWarnPatternsFlat } from './services/storeService'
import { getFileDiff } from './services/diffViewService'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../build/icon.png'),
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    show: false,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC Handlers — 기본
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('scan-diff', async (_event, source: string, dest: string) => {
  const warnPatterns = getWarnPatternsFlat()
  return scanDiff(source, dest, warnPatterns)
})

ipcMain.handle('get-git-log', async (_event, repoPath: string, filePath: string) => {
  return getGitLog(repoPath, filePath)
})

ipcMain.handle('sync-files', async (_event, source: string, dest: string, files: string[]) => {
  return syncFiles(source, dest, files)
})

// IPC Handlers — 프로젝트 관리
ipcMain.handle('get-projects', async () => {
  return getProjects()
})

ipcMain.handle('save-project', async (_event, project) => {
  saveProject(project)
})

ipcMain.handle('delete-project', async (_event, id: string) => {
  deleteProject(id)
})

ipcMain.handle('update-project-last-used', async (_event, id: string) => {
  updateProjectLastUsed(id)
})

// IPC Handlers — 경로 검증
ipcMain.handle('check-path-exists', async (_event, targetPath: string) => {
  try {
    return fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()
  } catch {
    return false
  }
})

// IPC Handlers — 브랜치 관리
ipcMain.handle('get-branches', async (_event, repoPath: string) => {
  return getBranches(repoPath)
})

ipcMain.handle('checkout-branch', async (_event, repoPath: string, branch: string) => {
  return checkoutBranch(repoPath, branch)
})

ipcMain.handle('git-pull', async (_event, repoPath: string, branch?: string) => {
  return gitPull(repoPath, branch)
})

// IPC Handlers — 확인 다이얼로그
ipcMain.handle('show-confirm', async (_event, title: string, message: string, detail?: string) => {
  if (!mainWindow) return false
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['취소', '덮어쓰기'],
    defaultId: 0,
    cancelId: 0,
    title,
    message,
    detail: detail || '',
  })
  return result.response === 1
})

// IPC Handlers — 경고 패턴 관리
ipcMain.handle('get-warn-patterns', async () => {
  return getWarnPatterns()
})

ipcMain.handle('set-warn-patterns', async (_event, patterns: string[]) => {
  setWarnPatterns(patterns)
})

ipcMain.handle('remove-warn-pattern', async (_event, pattern: string) => {
  return removeWarnPattern(pattern)
})

ipcMain.handle('reset-warn-patterns', async () => {
  resetWarnPatterns()
  return getWarnPatterns()
})

// IPC Handlers — 파일 diff
ipcMain.handle('get-file-diff', async (_event, sourcePath: string, destPath: string, filePath: string) => {
  return getFileDiff(sourcePath, destPath, filePath)
})
