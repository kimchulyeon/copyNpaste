import Store from 'electron-store'

interface SavedProject {
  id: string
  name: string
  sourcePath: string
  destPath: string
  sourceBranch?: string
  destBranch?: string
  createdAt: string
  lastUsedAt: string
}

const DEFAULT_WARN_PATTERNS = [
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.',
  '.github/workflows/',
  'deploy.yml',
  'deploy.',
  'k8s/',
  '.env',
  '.env.',
  'Jenkinsfile',
  'nginx.conf',
]

interface StoreSchema {
  projects: SavedProject[]
  warnPatterns: string[]
}

const store = new Store<StoreSchema>({
  defaults: {
    projects: [],
    warnPatterns: DEFAULT_WARN_PATTERNS,
  },
})

// 프로젝트 관리
export function getProjects(): SavedProject[] {
  return store.get('projects')
}

export function saveProject(project: SavedProject): void {
  const projects = store.get('projects')
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    projects[idx] = project
  } else {
    projects.push(project)
  }
  store.set('projects', projects)
}

export function deleteProject(id: string): void {
  const projects = store.get('projects')
  store.set(
    'projects',
    projects.filter((p) => p.id !== id)
  )
}

export function updateProjectLastUsed(id: string): void {
  const projects = store.get('projects')
  const idx = projects.findIndex((p) => p.id === id)
  if (idx >= 0) {
    projects[idx].lastUsedAt = new Date().toISOString()
    store.set('projects', projects)
  }
}

// 경고 패턴 관리
export function getWarnPatterns(): { patterns: string[]; defaults: string[] } {
  let patterns = store.get('warnPatterns')
  if (!Array.isArray(patterns) || patterns.length === 0) {
    store.set('warnPatterns', DEFAULT_WARN_PATTERNS)
    patterns = [...DEFAULT_WARN_PATTERNS]
  }
  return {
    patterns,
    defaults: [...DEFAULT_WARN_PATTERNS],
  }
}

export function setWarnPatterns(patterns: string[]): void {
  store.set('warnPatterns', patterns)
}

export function removeWarnPattern(pattern: string): boolean {
  if (DEFAULT_WARN_PATTERNS.includes(pattern)) return false
  const current = store.get('warnPatterns')
  store.set('warnPatterns', current.filter((p) => p !== pattern))
  return true
}

export function resetWarnPatterns(): void {
  store.set('warnPatterns', DEFAULT_WARN_PATTERNS)
}

export function getWarnPatternsFlat(): string[] {
  const patterns = store.get('warnPatterns')
  if (!Array.isArray(patterns) || patterns.length === 0) {
    store.set('warnPatterns', DEFAULT_WARN_PATTERNS)
    return [...DEFAULT_WARN_PATTERNS]
  }
  return patterns
}

export { DEFAULT_WARN_PATTERNS }
