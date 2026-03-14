import fs from 'fs'
import path from 'path'

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  sourceLineNo?: number
  destLineNo?: number
}

interface DiffHunk {
  sourceStart: number
  sourceLines: number
  destStart: number
  destLines: number
  lines: DiffLine[]
}

interface FileDiffResult {
  sourceContent: string
  destContent: string
  hunks: DiffHunk[]
}

// Simple LCS-based diff algorithm
function computeDiff(sourceLines: string[], destLines: string[]): DiffHunk[] {
  // Build LCS table
  const m = sourceLines.length
  const n = destLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (sourceLines[i - 1] === destLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to get diff operations
  const ops: Array<{ type: 'context' | 'remove' | 'add'; srcIdx?: number; dstIdx?: number }> = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && sourceLines[i - 1] === destLines[j - 1]) {
      ops.unshift({ type: 'context', srcIdx: i - 1, dstIdx: j - 1 })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'add', dstIdx: j - 1 })
      j--
    } else {
      ops.unshift({ type: 'remove', srcIdx: i - 1 })
      i--
    }
  }

  // Group into hunks with context lines
  const CONTEXT = 3
  const hunks: DiffHunk[] = []
  let changeIndices: number[] = []

  ops.forEach((op, idx) => {
    if (op.type !== 'context') changeIndices.push(idx)
  })

  if (changeIndices.length === 0) return []

  // Merge nearby changes into hunks
  let hunkRanges: Array<[number, number]> = []
  let start = Math.max(0, changeIndices[0] - CONTEXT)
  let end = Math.min(ops.length - 1, changeIndices[0] + CONTEXT)

  for (let ci = 1; ci < changeIndices.length; ci++) {
    const newStart = Math.max(0, changeIndices[ci] - CONTEXT)
    const newEnd = Math.min(ops.length - 1, changeIndices[ci] + CONTEXT)

    if (newStart <= end + 1) {
      end = newEnd
    } else {
      hunkRanges.push([start, end])
      start = newStart
      end = newEnd
    }
  }
  hunkRanges.push([start, end])

  for (const [hStart, hEnd] of hunkRanges) {
    const lines: DiffLine[] = []
    let srcLine = ops[hStart]?.srcIdx ?? ops[hStart]?.srcIdx
    let dstLine = ops[hStart]?.dstIdx ?? ops[hStart]?.dstIdx

    // Find the starting line numbers
    let firstSrcLine = 1
    let firstDstLine = 1
    for (let idx = 0; idx < hStart; idx++) {
      const op = ops[idx]
      if (op.type === 'context' || op.type === 'remove') firstSrcLine++
      if (op.type === 'context' || op.type === 'add') firstDstLine++
    }

    let srcCount = 0
    let dstCount = 0
    let currentSrc = firstSrcLine
    let currentDst = firstDstLine

    for (let idx = hStart; idx <= hEnd; idx++) {
      const op = ops[idx]
      if (op.type === 'context') {
        lines.push({
          type: 'context',
          content: sourceLines[op.srcIdx!],
          sourceLineNo: currentSrc,
          destLineNo: currentDst,
        })
        currentSrc++
        currentDst++
        srcCount++
        dstCount++
      } else if (op.type === 'remove') {
        lines.push({
          type: 'remove',
          content: sourceLines[op.srcIdx!],
          sourceLineNo: currentSrc,
        })
        currentSrc++
        srcCount++
      } else {
        lines.push({
          type: 'add',
          content: destLines[op.dstIdx!],
          destLineNo: currentDst,
        })
        currentDst++
        dstCount++
      }
    }

    hunks.push({
      sourceStart: firstSrcLine,
      sourceLines: srcCount,
      destStart: firstDstLine,
      destLines: dstCount,
      lines,
    })
  }

  return hunks
}

export async function getFileDiff(
  sourcePath: string,
  destPath: string,
  filePath: string
): Promise<FileDiffResult> {
  const srcFull = path.join(sourcePath, filePath)
  const dstFull = path.join(destPath, filePath)

  let sourceContent = ''
  let destContent = ''

  try {
    sourceContent = fs.readFileSync(srcFull, 'utf-8')
  } catch {
    // File doesn't exist in source (deleted)
  }

  try {
    destContent = fs.readFileSync(dstFull, 'utf-8')
  } catch {
    // File doesn't exist in dest (new)
  }

  const sourceLines = sourceContent ? sourceContent.split('\n') : []
  const destLines = destContent ? destContent.split('\n') : []

  const hunks = computeDiff(sourceLines, destLines)

  return { sourceContent, destContent, hunks }
}
