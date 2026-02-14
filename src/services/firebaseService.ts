import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit as limitToMax,
  serverTimestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import { Project, ProjectFile, ChatSession, ChatMessage, GitHubConnection, VercelConnection } from '@/types'

// Project operations
export const projectService = {
  async createProject(userId: string, name: string, description: string, isPublic: boolean = false): Promise<Project> {
    const projectData = {
      name,
      description,
      ownerId: userId,
      isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'projects'), projectData)
    
    return {
      id: docRef.id,
      ...projectData,
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  async getProjects(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, 'projects'), 
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const projects: Project[] = []
    
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const filesSnapshot = await getDocs(collection(db, 'projects', doc.id, 'files'))
      const files = filesSnapshot.docs.map(fileDoc => ({
        id: fileDoc.id,
        ...fileDoc.data()
      })) as ProjectFile[]
      
      projects.push({
        id: doc.id,
        ...data,
        files,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Project)
    }
    
    return projects
  },

  async getProject(projectId: string): Promise<Project | null> {
    const docRef = doc(db, 'projects', projectId)
    const snapshot = await getDoc(docRef)
    
    if (!snapshot.exists()) return null
    
    const data = snapshot.data()
    const filesSnapshot = await getDocs(collection(db, 'projects', projectId, 'files'))
    const files = filesSnapshot.docs.map(fileDoc => ({
      id: fileDoc.id,
      ...fileDoc.data()
    })) as ProjectFile[]
    
    return {
      id: snapshot.id,
      ...data,
      files,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Project
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  },

  async getPublicProjects(limit = 8): Promise<Project[]> {
    const q = query(
      collection(db, 'projects'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc'),
      limitToMax(limit)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as Project[]
  },

  async deleteProject(projectId: string): Promise<void> {
    // Delete all files first
    const filesSnapshot = await getDocs(collection(db, 'projects', projectId, 'files'))
    for (const fileDoc of filesSnapshot.docs) {
      await deleteDoc(fileDoc.ref)
    }
    
    // Delete the project
    await deleteDoc(doc(db, 'projects', projectId))
  },

  // File operations
  async addFile(projectId: string, file: Omit<ProjectFile, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'projects', projectId, 'files'), file)
    await this.updateProject(projectId, {})
    return docRef.id
  },

  async updateFile(projectId: string, fileId: string, content: string): Promise<void> {
    const docRef = doc(db, 'projects', projectId, 'files', fileId)
    await updateDoc(docRef, { content })
    await this.updateProject(projectId, {})
  },

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    await deleteDoc(doc(db, 'projects', projectId, 'files', fileId))
    await this.updateProject(projectId, {})
  },

  // GitHub connection operations
  async connectGitHubRepository(projectId: string, connection: GitHubConnection): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      githubConnection: connection,
      updatedAt: serverTimestamp()
    })
  },

  async disconnectGitHub(projectId: string): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      githubConnection: null,
      updatedAt: serverTimestamp()
    })
  },

  async updateLastSync(projectId: string, syncHash: string): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      'githubConnection.lastSyncHash': syncHash,
      'githubConnection.lastSyncDate': new Date().toISOString(),
      updatedAt: serverTimestamp()
    })
  },

  // Vercel connection operations
  async connectVercelProject(projectId: string, connection: VercelConnection): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      vercelConnection: connection,
      updatedAt: serverTimestamp()
    })
  },

  async disconnectVercel(projectId: string): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      vercelConnection: null,
      updatedAt: serverTimestamp()
    })
  },

  async updateVercelDeployment(
    projectId: string, 
    deploymentId: string, 
    deploymentUrl: string, 
    state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'
  ): Promise<void> {
    const docRef = doc(db, 'projects', projectId)
    await updateDoc(docRef, {
      'vercelConnection.lastDeploymentId': deploymentId,
      'vercelConnection.lastDeploymentUrl': deploymentUrl,
      'vercelConnection.lastDeploymentState': state,
      updatedAt: serverTimestamp()
    })
  },

  // Admin operations
  async getAllProjects(limit?: number): Promise<Project[]> {
    let q = query(
      collection(db, 'projects'),
      orderBy('updatedAt', 'desc')
    )
    
    if (limit) {
      q = query(
        collection(db, 'projects'),
        orderBy('updatedAt', 'desc'),
        limitToMax(limit)
      )
    }
    
    const snapshot = await getDocs(q)
    const projects: Project[] = []
    
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const filesSnapshot = await getDocs(collection(db, 'projects', doc.id, 'files'))
      const files = filesSnapshot.docs.map(fileDoc => ({
        id: fileDoc.id,
        ...fileDoc.data()
      })) as ProjectFile[]
      
      projects.push({
        id: doc.id,
        ...data,
        files,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Project)
    }
    
    return projects
  },

  async searchProjects(searchTerm: string, searchType: 'email' | 'projectId' | 'userId' | 'name'): Promise<Project[]> {
    let projects: Project[] = []
    
    if (searchType === 'projectId') {
      const project = await this.getProject(searchTerm)
      if (project) projects = [project]
    } else if (searchType === 'userId') {
      const q = query(
        collection(db, 'projects'),
        where('ownerId', '==', searchTerm),
        orderBy('updatedAt', 'desc')
      )
      const snapshot = await getDocs(q)
      
      for (const doc of snapshot.docs) {
        const data = doc.data()
        const filesSnapshot = await getDocs(collection(db, 'projects', doc.id, 'files'))
        const files = filesSnapshot.docs.map(fileDoc => ({
          id: fileDoc.id,
          ...fileDoc.data()
        })) as ProjectFile[]
        
        projects.push({
          id: doc.id,
          ...data,
          files,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as Project)
      }
    } else if (searchType === 'email') {
      // First find user by email
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      let userId: string | null = null
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        if (userData.email === searchTerm) {
          userId = userDoc.id
          break
        }
      }
      
      if (userId) {
        projects = await this.searchProjects(userId, 'userId')
      }
    } else if (searchType === 'name') {
      // Get all projects and filter by name
      const allProjects = await this.getAllProjects()
      projects = allProjects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return projects
  },

  async getUserInfo(userId: string): Promise<any> {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  }
}

// Chat operations
// Storage operations for images
export const storageService = {
  async uploadImage(
    projectId: string, 
    blob: Blob, 
    fileName: string
  ): Promise<{ url: string; path: string }> {
    const imagePath = `projects/${projectId}/images/${fileName}`;
    const storageRef = ref(storage, imagePath);
    
    // Upload the blob
    const uploadResult = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/webp'
    });
    
    // Get the download URL
    const url = await getDownloadURL(uploadResult.ref);
    
    return { url, path: imagePath };
  },

  async deleteImage(imagePath: string): Promise<void> {
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  },

  async listProjectImages(projectId: string): Promise<Array<{ name: string; url: string; path: string }>> {
    const imagesRef = ref(storage, `projects/${projectId}/images`);
    const result = await listAll(imagesRef);
    
    const images = await Promise.all(
      result.items.map(async (item) => ({
        name: item.name,
        url: await getDownloadURL(item),
        path: item.fullPath
      }))
    );
    
    return images;
  }
}

export const chatService = {
  async createSession(projectId: string): Promise<ChatSession> {
    const sessionData = {
      projectId,
      createdAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'chatSessions'), sessionData)
    
    // Add initial message
    const initialMessage = {
      role: 'assistant',
      content: "Ahoj! Jsem tvůj AI asistent pro programování. Pomůžu ti vytvořit jakýkoliv web nebo aplikaci. 💡 Zkus napsat např.: 'Vytvoř web pro kavárnu v Praze, použij hnědé a béžové barvy' nebo 'Udělej e-shop na prodej knih'. Na čem chceš pracovat?",
      timestamp: serverTimestamp()
    }
    
    await addDoc(collection(db, 'chatSessions', docRef.id, 'messages'), initialMessage)
    
    return {
      id: docRef.id,
      projectId,
      messages: [{
        id: '1',
        role: 'assistant' as const,
        content: initialMessage.content,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    }
  },

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const docRef = doc(db, 'chatSessions', sessionId)
    const snapshot = await getDoc(docRef)
    
    if (!snapshot.exists()) return null
    
    const data = snapshot.data()
    const messagesSnapshot = await getDocs(
      query(collection(db, 'chatSessions', sessionId, 'messages'), orderBy('timestamp'))
    )
    
    const messages = messagesSnapshot.docs.map(msgDoc => ({
      id: msgDoc.id,
      ...msgDoc.data(),
      timestamp: msgDoc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as ChatMessage[]
    
    return {
      id: snapshot.id,
      ...data,
      messages,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as ChatSession
  },

  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    const messageData = {
      ...message,
      timestamp: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), messageData)
    return docRef.id
  },

  async getSessionsByProject(projectId: string): Promise<ChatSession[]> {
    const q = query(
      collection(db, 'chatSessions'), 
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const sessions: ChatSession[] = []
    
    for (const doc of snapshot.docs) {
      const data = doc.data()
      sessions.push({
        id: doc.id,
        projectId: data.projectId,
        messages: [], // Messages will be loaded separately
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })
    }
    
    return sessions
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const messagesSnapshot = await getDocs(
      query(collection(db, 'chatSessions', sessionId, 'messages'), orderBy('timestamp'))
    )
    
    return messagesSnapshot.docs.map(msgDoc => ({
      id: msgDoc.id,
      ...msgDoc.data(),
      timestamp: msgDoc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as ChatMessage[]
  },

  subscribeToMessages(sessionId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, 'chatSessions', sessionId, 'messages'), 
      orderBy('timestamp')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as ChatMessage[]
      
      callback(messages)
    })
    
    return unsubscribe
  }
}