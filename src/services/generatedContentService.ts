import { db } from '@/config/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'

export interface GeneratedContent {
  id?: string
  userId: string
  type: 'text' | 'image' | 'video'
  subType: string // e.g., 'homepage', 'hero', 'promo'
  title: string
  content: string | string[] // text string, image URLs array, or video URL
  prompt: {
    original?: string
    custom?: string
    businessInfo?: string
    additionalInfo?: string
    style?: string
    quality?: string
  }
  metadata: {
    credits: number
    generatedAt: Timestamp
    contentLength?: number
    fileSize?: number
    dimensions?: string
  }
  settings: {
    canEdit: boolean
    canDownload: boolean
    canShare: boolean
  }
}

class GeneratedContentService {
  private getCollectionRef(userId: string) {
    return collection(db, 'users', userId, 'generatedContent')
  }

  // Save generated content
  async saveContent(content: Omit<GeneratedContent, 'id' | 'metadata'> & { 
    metadata: Omit<GeneratedContent['metadata'], 'generatedAt'> 
  }): Promise<string> {
    try {
      const contentWithTimestamp = {
        ...content,
        metadata: {
          ...content.metadata,
          generatedAt: Timestamp.now()
        }
      }

      const docRef = await addDoc(
        this.getCollectionRef(content.userId), 
        contentWithTimestamp
      )
      
      console.log('💾 Content saved:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error saving content:', error)
      throw error
    }
  }

  // Get user's generated content history
  async getUserContent(
    userId: string, 
    options: {
      type?: 'text' | 'image' | 'video'
      limitCount?: number
    } = {}
  ): Promise<GeneratedContent[]> {
    try {
      let q = query(
        this.getCollectionRef(userId),
        orderBy('metadata.generatedAt', 'desc')
      )

      // Filter by type if specified
      if (options.type) {
        q = query(q, where('type', '==', options.type))
      }

      // Add limit if specified
      if (options.limitCount) {
        q = query(q, limit(options.limitCount))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GeneratedContent))
    } catch (error) {
      console.error('Error fetching content:', error)
      throw error
    }
  }

  // Delete generated content
  async deleteContent(userId: string, contentId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.getCollectionRef(userId), contentId))
      console.log('🗑️ Content deleted:', contentId)
    } catch (error) {
      console.error('Error deleting content:', error)
      throw error
    }
  }

  // Get content statistics
  async getContentStats(userId: string): Promise<{
    total: number
    byType: Record<'text' | 'image' | 'video', number>
    totalCreditsUsed: number
  }> {
    try {
      const snapshot = await getDocs(this.getCollectionRef(userId))
      const contents = snapshot.docs.map(doc => doc.data() as GeneratedContent)
      
      const stats = {
        total: contents.length,
        byType: {
          text: contents.filter(c => c.type === 'text').length,
          image: contents.filter(c => c.type === 'image').length,
          video: contents.filter(c => c.type === 'video').length
        },
        totalCreditsUsed: contents.reduce((sum, c) => sum + c.metadata.credits, 0)
      }

      return stats
    } catch (error) {
      console.error('Error fetching content stats:', error)
      throw error
    }
  }
}

export const generatedContentService = new GeneratedContentService()