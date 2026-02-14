export interface ContentAddon {
  plan: 'content_basic' | 'content_pro' | 'content_business'
  credits: number
  stripeSubscriptionItemId?: string
  active: boolean
}

export interface User {
  id: string
  uid: string // Firebase UID
  email: string
  name: string
  avatar?: string
  subscription?: {
    plan: 'free' | 'trial' | 'starter' | 'professional' | 'pro' | 'business' | 'unlimited' | 'enterprise'
    isLegacyPricing?: boolean
    tokens: number
    tokensUsed: number
    tokensLimit: number
    credits: number // Total credits (base plan + addon)
    contentAddon?: ContentAddon // Optional content addon
    expiresAt: string
    createdAt: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'trialing'
  }
}

export interface GitHubConnection {
  repositoryId: number
  repositoryName: string
  repositoryFullName: string
  repoOwner: string
  repoName: string
  lastSyncHash?: string
  lastSyncDate?: string
  autoSync?: boolean
}

export interface VercelConnection {
  projectId: string
  projectName: string
  productionUrl?: string
  framework?: string
  lastDeploymentId?: string
  lastDeploymentUrl?: string
  lastDeploymentState?: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'
  autoDeployOnPush?: boolean
  connected: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  ownerId: string
  userId?: string
  files: ProjectFile[]
  isPublic: boolean
  githubConnection?: GitHubConnection
  vercelConnection?: VercelConnection
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirectory: boolean
  children?: ProjectFile[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  hasThinking?: boolean
  timestamp: string
  structured?: StructuredResponse
  isStructured?: boolean
  isChat?: boolean // Flag for chat mode messages vs code generation
}

export interface ChatSession {
  id: string
  projectId: string
  messages: ChatMessage[]
  createdAt: string
}

export interface FileItem {
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileItem[]
}

// Structured AI Response Types
export interface StructuredResponse {
  type: 'code_generation' | 'explanation' | 'conversation'
  message: string
  description?: string
  files?: StructuredFile[]
  features?: string[]
  instructions?: string
  metadata?: {
    intent: 'create' | 'update' | 'explain' | 'fix'
    complexity: 'low' | 'medium' | 'high'
    [key: string]: any
  }
}

export interface StructuredFile {
  operation: 'create' | 'update' | 'delete'
  path: string
  language: string
  content: string
  description?: string
  existingFileId?: string
  matchConfidence?: number
  matchReasons?: string[]
}