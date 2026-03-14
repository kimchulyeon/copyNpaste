import fs from 'fs'
import path from 'path'

interface SyncFileItem {
  path: string
  status: 'modified' | 'new' | 'deleted'
}

interface SyncResult {
  success: boolean
  syncedFiles: string[]
  failedFiles: { path: string; error: string }[]
}

export async function syncFiles(
  sourcePath: string,
  destPath: string,
  files: SyncFileItem[]
): Promise<SyncResult> {
  const syncedFiles: string[] = []
  const failedFiles: { path: string; error: string }[] = []

  for (const file of files) {
    try {
      const srcFull = path.join(sourcePath, file.path)
      const dstFull = path.join(destPath, file.path)

      if (file.status === 'deleted') {
        // 출발지에서 삭제된 파일 → 목적지에서도 삭제
        if (fs.existsSync(dstFull)) {
          fs.unlinkSync(dstFull)
        }
      } else {
        // modified / new → 출발지에서 목적지로 복사
        fs.mkdirSync(path.dirname(dstFull), { recursive: true })
        fs.copyFileSync(srcFull, dstFull)
      }
      syncedFiles.push(file.path)
    } catch (err) {
      failedFiles.push({
        path: file.path,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    success: failedFiles.length === 0,
    syncedFiles,
    failedFiles,
  }
}
