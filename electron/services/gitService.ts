import simpleGit from 'simple-git'

interface GitLogEntry {
  hash: string
  author: string
  date: string
  message: string
}

export async function getGitLog(repoPath: string, filePath: string): Promise<GitLogEntry[]> {
  const git = simpleGit(repoPath)

  try {
    const log = await git.log({
      file: filePath,
      maxCount: 10,
    })

    return log.all.map((entry) => ({
      hash: entry.hash.slice(0, 7),
      author: entry.author_name,
      date: entry.date,
      message: entry.message,
    }))
  } catch {
    return []
  }
}

export async function getBranches(repoPath: string): Promise<{ current: string; branches: string[] }> {
  const git = simpleGit(repoPath)

  try {
    const branchSummary = await git.branchLocal()
    return {
      current: branchSummary.current,
      branches: branchSummary.all,
    }
  } catch {
    return { current: '', branches: [] }
  }
}

export async function checkoutBranch(repoPath: string, branch: string): Promise<boolean> {
  const git = simpleGit(repoPath)

  try {
    await git.checkout(branch)
    return true
  } catch {
    return false
  }
}

export async function gitPull(repoPath: string): Promise<{ success: boolean; summary: string }> {
  const git = simpleGit(repoPath)

  try {
    const result = await git.pull()
    if (result.summary.changes === 0 && result.summary.insertions === 0 && result.summary.deletions === 0) {
      return { success: true, summary: '이미 최신 상태입니다.' }
    }
    return {
      success: true,
      summary: `${result.summary.changes}개 파일 변경, +${result.summary.insertions} -${result.summary.deletions}`,
    }
  } catch (err) {
    return {
      success: false,
      summary: err instanceof Error ? err.message : String(err),
    }
  }
}
