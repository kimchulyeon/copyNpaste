import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

interface DiffFile {
  path: string
  status: 'modified' | 'new' | 'deleted'
  sourceSize: number
  destSize: number | null
  sourceModified: string
  destModified: string | null
  isDanger: boolean
}

const DEFAULT_EXCLUDES = ['node_modules', '.git', 'dist', 'build', '.DS_Store', '.next', '__pycache__']

function isDangerFile(filePath: string, dangerPatterns: string[]): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  return dangerPatterns.some((p) => {
    if (p.endsWith('/')) {
      return normalized.includes(p)
    }
    const fileName = path.basename(normalized)
    if (p.endsWith('.')) {
      return fileName.startsWith(p)
    }
    return fileName === p || normalized.includes('/' + p)
  })
}

function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(content).digest('hex')
}

function loadSyncIgnore(basePath: string): string[] {
  const ignorePath = path.join(basePath, '.syncignore')
  try {
    const content = fs.readFileSync(ignorePath, 'utf-8')
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  } catch {
    return []
  }
}

function shouldExclude(relativePath: string, excludes: string[], customIgnores: string[]): boolean {
  const parts = relativePath.split(path.sep)
  for (const part of parts) {
    if (excludes.includes(part)) return true
  }
  for (const pattern of customIgnores) {
    if (relativePath.includes(pattern) || path.basename(relativePath) === pattern) {
      return true
    }
  }
  return false
}

function walkDir(dir: string, base: string, excludes: string[], customIgnores: string[]): string[] {
  let results: string[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (excludes.includes(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(base, fullPath)

    if (shouldExclude(relativePath, excludes, customIgnores)) continue

    if (entry.isDirectory()) {
      results = results.concat(walkDir(fullPath, base, excludes, customIgnores))
    } else if (entry.isFile()) {
      results.push(relativePath)
    }
  }
  return results
}

export async function scanDiff(sourcePath: string, destPath: string, dangerPatterns: string[]): Promise<DiffFile[]> {
  const customIgnores = [
    ...loadSyncIgnore(sourcePath),
    ...loadSyncIgnore(destPath),
  ]

  const sourceFiles = new Set(walkDir(sourcePath, sourcePath, DEFAULT_EXCLUDES, customIgnores))
  const destFiles = new Set(walkDir(destPath, destPath, DEFAULT_EXCLUDES, customIgnores))
  const allFiles = new Set([...sourceFiles, ...destFiles])
  const diffs: DiffFile[] = []

  for (const file of allFiles) {
    const srcFull = path.join(sourcePath, file)
    const dstFull = path.join(destPath, file)
    const inSource = sourceFiles.has(file)
    const inDest = destFiles.has(file)

    if (inSource && inDest) {
      const srcHash = getFileHash(srcFull)
      const dstHash = getFileHash(dstFull)
      if (srcHash !== dstHash) {
        const srcStat = fs.statSync(srcFull)
        const dstStat = fs.statSync(dstFull)
        diffs.push({
          path: file,
          status: 'modified',
          sourceSize: srcStat.size,
          destSize: dstStat.size,
          sourceModified: srcStat.mtime.toISOString(),
          destModified: dstStat.mtime.toISOString(),
          isDanger: isDangerFile(file, dangerPatterns),
        })
      }
    } else if (inSource && !inDest) {
      const srcStat = fs.statSync(srcFull)
      diffs.push({
        path: file,
        status: 'new',
        sourceSize: srcStat.size,
        destSize: null,
        sourceModified: srcStat.mtime.toISOString(),
        destModified: null,
        isDanger: isDangerFile(file, dangerPatterns),
      })
    } else if (!inSource && inDest) {
      const dstStat = fs.statSync(dstFull)
      diffs.push({
        path: file,
        status: 'deleted',
        sourceSize: 0,
        destSize: dstStat.size,
        sourceModified: '',
        destModified: dstStat.mtime.toISOString(),
        isDanger: isDangerFile(file, dangerPatterns),
      })
    }
  }

  return diffs.sort((a, b) => {
    // Danger files go to the bottom
    if (a.isDanger !== b.isDanger) return a.isDanger ? 1 : -1
    // Then sort by directory, then filename
    return a.path.localeCompare(b.path)
  })
}
