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

interface StoreSchema {
  projects: SavedProject[]
}

const store = new Store<StoreSchema>({
  defaults: {
    projects: [],
  },
})

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
