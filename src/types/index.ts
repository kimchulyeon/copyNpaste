export interface DiffFile {
  path: string
  status: 'modified' | 'new' | 'deleted'
  sourceSize: number
  destSize: number | null
  sourceModified: string
  destModified: string | null
  isDanger: boolean
}

export interface GitLogEntry {
  hash: string
  author: string
  date: string
  message: string
}

export interface SyncRequest {
  sourcePath: string
  destPath: string
  files: string[]
}

export interface SyncResult {
  success: boolean
  syncedFiles: string[]
  failedFiles: { path: string; error: string }[]
}

// 저장된 프로젝트 설정
export interface SavedProject {
  id: string
  name: string
  sourcePath: string
  destPath: string
  sourceBranch?: string
  destBranch?: string
  createdAt: string
  lastUsedAt: string
}

// 파일 diff 결과 (line-by-line)
export interface FileDiffResult {
  sourceContent: string
  destContent: string
  hunks: DiffHunk[]
}

export interface DiffHunk {
  sourceStart: number
  sourceLines: number
  destStart: number
  destLines: number
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  sourceLineNo?: number
  destLineNo?: number
}
