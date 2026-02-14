import { create } from 'zustand'
import { Project, ProjectFile } from '@/types'
import { projectService, storageService } from '@/services/firebaseService'
import { useAuthStore } from './authStore'
import PathUtils from '@/utils/pathUtils'
import { trackProjectCreated } from '@/utils/analytics'
import { projectLock, createOperationLock } from '@/utils/asyncLock'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  loadProjects: () => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  createProject: (projectData: { name: string; description: string; isPublic?: boolean }) => Promise<Project | null>
  updateProject: (projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'isPublic' | 'vercelConnection' | 'githubConnection'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project) => void
  updateProjectFile: (fileId: string, content: string) => Promise<void>
  addProjectFile: (file: Omit<ProjectFile, 'id'>) => Promise<void>
  deleteProjectFile: (fileId: string) => Promise<void>
  uploadProjectImage: (file: File, blob: Blob, fileName: string) => Promise<void>
  clearError: () => void
  _updateProjectFileInternal: (fileId: string, content: string, setLoading?: boolean) => Promise<void>
  _addProjectFileInternal: (file: Omit<ProjectFile, 'id'>) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  
  loadProjects: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    
    set({ isLoading: true, error: null })
    try {
      const projects = await projectService.getProjects(userId)
      set({ projects, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      const project = await projectService.getProject(projectId)
      if (project) {
        set({ currentProject: project, isLoading: false })
      } else {
        set({ error: 'Project not found', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  createProject: async (projectData: { name: string; description: string; isPublic?: boolean }) => {
    const authState = useAuthStore.getState()
    const userId = authState.user?.id
    
    if (!userId) {
      set({ error: 'User not authenticated' })
      return null
    }
    
    // Check if user has active subscription
    if (!authState.user?.subscription) {
      set({ error: 'Pro vytváření projektů je potřeba aktivní předplatné. Přejděte prosím na stránku s cenami.' })
      return null
    }
    
    set({ isLoading: true, error: null })
    try {
      const newProject = await projectService.createProject(
        userId, 
        projectData.name, 
        projectData.description,
        projectData.isPublic
      )
      set(state => ({ 
        projects: [...state.projects, newProject],
        currentProject: newProject,
        isLoading: false 
      }))
      
      // Track project creation
      trackProjectCreated('web_app')
      
      return newProject
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      return null
    }
  },

  updateProject: async (projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'isPublic' | 'vercelConnection' | 'githubConnection'>>) => {
    set({ isLoading: true, error: null })
    try {
      await projectService.updateProject(projectId, updates)
      
      set(state => {
        const updatedProject = state.currentProject?.id === projectId 
          ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
          : state.currentProject

        return {
          currentProject: updatedProject,
          projects: state.projects.map(p =>
            p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
          isLoading: false
        }
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await projectService.deleteProject(id)
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  setCurrentProject: (project: Project) => {
    set({ currentProject: project })
  },
  
  updateProjectFile: async (fileId: string, content: string) => {
    const { currentProject } = get()
    if (!currentProject) {
      console.error('[ProjectStore] No current project when updating file')
      return
    }
    
    // Use async lock to prevent race conditions
    const lockKey = createOperationLock(currentProject.id, `update-file-${fileId}`)
    
    return await projectLock.withLock(lockKey, async () => {
      return await get()._updateProjectFileInternal(fileId, content, true)
    })
  },

  // Internal method without locking (for use within locks or when lock is not needed)
  _updateProjectFileInternal: async (fileId: string, content: string, setLoading: boolean = true) => {
    const { currentProject } = get()
    if (!currentProject) {
      console.error('[ProjectStore] No current project when updating file')
      return
    }
    
    console.log(`[ProjectStore] ===== UPDATE PROJECT FILE =====`)
    console.log(`[ProjectStore] FileID: ${fileId}`)
    console.log(`[ProjectStore] Content length: ${content.length}`)
    console.log(`[ProjectStore] Content preview: ${content.substring(0, 100)}...`)
    console.log(`[ProjectStore] Current project has ${currentProject.files.length} files`)
    
    // Find the target file BEFORE updating
    const targetFile = currentProject.files.find(f => f.id === fileId)
    if (!targetFile) {
      console.error(`[ProjectStore] File with ID ${fileId} not found in current project`)
      console.error(`[ProjectStore] Available file IDs:`, currentProject.files.map(f => ({ id: f.id, name: f.name, path: f.path })))
      return
    }
    
    console.log(`[ProjectStore] Target file found: ${targetFile.name} at ${targetFile.path}`)
    console.log(`[ProjectStore] Previous content length: ${targetFile.content.length}`)
    console.log(`[ProjectStore] Previous content preview: ${targetFile.content.substring(0, 100)}...`)
    
    if (setLoading) {
      set({ isLoading: true, error: null })
    }
    
    try {
      await projectService.updateFile(currentProject.id, fileId, content)
      console.log('[ProjectStore] File updated in Firebase')
      
      // Update local state
      set(state => {
        if (!state.currentProject) return state
        
        const updatedProject = {
          ...state.currentProject,
          files: state.currentProject.files.map(file =>
            file.id === fileId ? { ...file, content } : file
          ),
          updatedAt: new Date().toISOString()
        }
        
        // Note: WebContainer file sync is now handled by PreviewPanel
        
        console.log(`[ProjectStore] State update complete for ${targetFile.name}`)
        
        return {
          currentProject: updatedProject,
          projects: state.projects.map(p =>
            p.id === updatedProject.id ? updatedProject : p
          ),
          isLoading: setLoading ? false : state.isLoading
        }
      })
    } catch (error: any) {
      console.error(`[ProjectStore] Error updating file:`, error)
      set({ error: error.message, isLoading: setLoading ? false : get().isLoading })
    }
  },
  
  addProjectFile: async (file: Omit<ProjectFile, 'id'>) => {
    const { currentProject } = get()
    if (!currentProject) return
    
    // Use async lock to prevent race conditions
    const lockKey = createOperationLock(currentProject.id, `add-file-${file.path}`)
    
    return await projectLock.withLock(lockKey, async () => {
      // Re-get current project in case it changed during lock wait
      const { currentProject: freshProject } = get()
      if (!freshProject || freshProject.id !== currentProject.id) {
        console.warn(`[ProjectStore] Project changed during lock wait, aborting file add`)
        return
      }
      
      console.log(`[ProjectStore] Adding file: ${file.name} at path: ${file.path}`)
      console.log(`[ProjectStore] Current project files:`, freshProject.files.map(f => ({ name: f.name, path: f.path, isDir: f.isDirectory })))
      
      // Enhanced duplicate detection with fresh project data
      const { DuplicateDetector } = await import('@/utils/duplicateDetection')
      const duplicateAnalysis = DuplicateDetector.analyzeFile(file, freshProject.files)
      
      console.log(`[ProjectStore] Duplicate analysis result:`, {
        isDuplicate: duplicateAnalysis.isDuplicate,
        action: duplicateAnalysis.recommendedAction,
        reason: duplicateAnalysis.reason,
        matchingFile: duplicateAnalysis.matchingFile?.id,
        lockKey
      })
      
      // Handle based on analysis recommendation
      if (duplicateAnalysis.recommendedAction === 'skip') {
        console.log(`[ProjectStore] SKIPPING DUPLICATE - ${duplicateAnalysis.reason}`)
        return // Skip adding duplicate
      } else if (duplicateAnalysis.recommendedAction === 'update' && duplicateAnalysis.matchingFile) {
        console.log(`[ProjectStore] UPDATING EXISTING FILE - ${duplicateAnalysis.reason}`)
        // Update existing file instead of creating duplicate (without lock since we're already locked)
        return await get()._updateProjectFileInternal(duplicateAnalysis.matchingFile.id, file.content || '', false)
      }
      
      // Continue with create_new action
      return await get()._addProjectFileInternal(file)
    })
  },

  // Internal method without locking (for use within locks)
  _addProjectFileInternal: async (file: Omit<ProjectFile, 'id'>) => {
    const { currentProject } = get()
    if (!currentProject) return
    
    set({ isLoading: true, error: null })
    try {
      // Normalize file path first
      const normalizedPath = PathUtils.normalize(file.path)
      
      // Create necessary directories first
      const filesToAdd: ProjectFile[] = []
      const pathParts = PathUtils.getSegments(normalizedPath)
      
      if (pathParts.length > 1) {
        // Create directory structure
        const directoriesToCreate: Array<{name: string, path: string}> = []
        
        // First, collect all needed directories
        for (let i = 0; i < pathParts.length - 1; i++) {
          const dirSegments = pathParts.slice(0, i + 1)
          const currentPath = PathUtils.join('/', ...dirSegments)
          const dirName = pathParts[i]
          
          // Check if directory already exists in project, filesToAdd, or directoriesToCreate
          const existingDir = currentProject.files.find(f => 
            f.path === currentPath && f.isDirectory
          )
          const alreadyQueued = filesToAdd.find(f => 
            f.path === currentPath && f.isDirectory
          )
          const alreadyPlanned = directoriesToCreate.find(d => d.path === currentPath)
          
          if (!existingDir && !alreadyQueued && !alreadyPlanned) {
            console.log(`[ProjectStore] Planning directory creation: ${currentPath}`)
            directoriesToCreate.push({ name: dirName, path: currentPath })
          } else {
            console.log(`[ProjectStore] Directory already exists or planned: ${currentPath}`)
          }
        }
        
        // Now create all planned directories
        for (const dir of directoriesToCreate) {
          console.log(`[ProjectStore] Creating directory: ${dir.path}`)
          const dirId = await projectService.addFile(currentProject.id, {
            name: dir.name,
            path: dir.path,
            content: '',
            language: 'plaintext',
            isDirectory: true
          })
          
          filesToAdd.push({
            id: dirId,
            name: dir.name,
            path: dir.path,
            content: '',
            language: 'plaintext',
            isDirectory: true
          })
        }
      }
      
      // Add the actual file with normalized path
      const normalizedFile = { ...file, path: normalizedPath }
      const fileId = await projectService.addFile(currentProject.id, normalizedFile)
      const newFile: ProjectFile = { ...normalizedFile, id: fileId }
      filesToAdd.push(newFile)
      
      console.log(`[ProjectStore] Adding ${filesToAdd.length} files to project:`, filesToAdd.map(f => ({ name: f.name, path: f.path, isDir: f.isDirectory })))
      
      set(state => {
        if (!state.currentProject) return state
        
        // Final duplicate check before adding to state
        const newFiles = filesToAdd.filter(newFile => {
          const exists = state.currentProject!.files.some(existing => 
            existing.path === newFile.path && existing.name === newFile.name
          )
          if (exists) {
            console.log(`[ProjectStore] BLOCKING DUPLICATE: ${newFile.path}`)
          }
          return !exists
        })
        
        console.log(`[ProjectStore] Final files to add: ${newFiles.length}/${filesToAdd.length}`)
        
        const updatedProject = {
          ...state.currentProject,
          files: [...state.currentProject.files, ...newFiles],
          updatedAt: new Date().toISOString()
        }
        
        return {
          currentProject: updatedProject,
          projects: state.projects.map(p =>
            p.id === updatedProject.id ? updatedProject : p
          ),
          isLoading: false
        }
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  deleteProjectFile: async (fileId: string) => {
    const { currentProject } = get()
    if (!currentProject) return
    
    set({ isLoading: true, error: null })
    try {
      await projectService.deleteFile(currentProject.id, fileId)
      
      set(state => {
        if (!state.currentProject) return state
        
        const updatedProject = {
          ...state.currentProject,
          files: state.currentProject.files.filter(f => f.id !== fileId),
          updatedAt: new Date().toISOString()
        }
        
        return {
          currentProject: updatedProject,
          projects: state.projects.map(p =>
            p.id === updatedProject.id ? updatedProject : p
          ),
          isLoading: false
        }
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  uploadProjectImage: async (_file: File, blob: Blob, fileName: string) => {
    const { currentProject } = get()
    if (!currentProject) return
    
    set({ isLoading: true, error: null })
    try {
      // Upload to Firebase Storage
      const { url, path: storagePath } = await storageService.uploadImage(
        currentProject.id, 
        blob, 
        fileName
      )
      
      console.log(`[ProjectStore] Uploaded image: ${fileName} to ${storagePath}`)
      
      // Create directory structure for images if needed
      const publicImagesPath = '/public/images'
      const existingImagesDir = currentProject.files.find(f => 
        f.path === publicImagesPath && f.isDirectory
      )
      
      if (!existingImagesDir) {
        // Create public directory first
        const publicDir = currentProject.files.find(f => 
          f.path === '/public' && f.isDirectory
        )
        
        if (!publicDir) {
          await get().addProjectFile({
            name: 'public',
            path: '/public',
            content: '',
            language: 'folder',
            isDirectory: true
          })
        }
        
        // Then create images directory
        await get().addProjectFile({
          name: 'images',
          path: publicImagesPath,
          content: '',
          language: 'folder',
          isDirectory: true
        })
      }
      
      // Add image file to project
      await get().addProjectFile({
        name: fileName,
        path: `/public/images/${fileName}`,
        content: url, // Store the Firebase URL as content
        language: 'image',
        isDirectory: false
      })
      
      set({ isLoading: false })
    } catch (error: any) {
      console.error('[ProjectStore] Image upload error:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  clearError: () => {
    set({ error: null })
  }
}))