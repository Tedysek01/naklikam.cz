import { storage } from '@/config/firebase'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  getMetadata
} from 'firebase/storage'

export interface UploadProgress {
  progress: number
  bytesTransferred: number
  totalBytes: number
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error'
}

class StorageService {
  // Upload file to generated content storage
  async uploadGeneratedFile(
    userId: string,
    contentId: string,
    file: Blob,
    filename: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const storageRef = ref(storage, `generatedContent/${userId}/${contentId}/${filename}`)
    
    if (onProgress) {
      // Use resumable upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state as any
            })
          },
          (error) => {
            console.error('Upload error:', error)
            reject(error)
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            } catch (error) {
              reject(error)
            }
          }
        )
      })
    } else {
      // Simple upload without progress
      const snapshot = await uploadBytes(storageRef, file)
      return await getDownloadURL(snapshot.ref)
    }
  }

  // Upload image from URL (download and re-upload to Firebase)
  async uploadImageFromUrl(
    userId: string,
    contentId: string,
    imageUrl: string,
    filename: string
  ): Promise<string> {
    try {
      // Download the image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Upload to Firebase Storage
      return await this.uploadGeneratedFile(userId, contentId, blob, filename)
    } catch (error) {
      console.error('Error uploading image from URL:', error)
      throw error
    }
  }

  // Upload video from URL  
  async uploadVideoFromUrl(
    userId: string,
    contentId: string,
    videoUrl: string,
    filename: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Download the video
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Upload to Firebase Storage with progress tracking
      return await this.uploadGeneratedFile(userId, contentId, blob, filename, onProgress)
    } catch (error) {
      console.error('Error uploading video from URL:', error)
      throw error
    }
  }

  // Upload multiple images from URLs
  async uploadImagesFromUrls(
    userId: string,
    contentId: string,
    imageUrls: string[]
  ): Promise<string[]> {
    const uploadPromises = imageUrls.map((url, index) => {
      const filename = `image_${index + 1}.png`
      return this.uploadImageFromUrl(userId, contentId, url, filename)
    })
    
    try {
      const downloadUrls = await Promise.all(uploadPromises)
      console.log(`✅ Uploaded ${downloadUrls.length} images to Firebase Storage`)
      return downloadUrls
    } catch (error) {
      console.error('Error uploading multiple images:', error)
      throw error
    }
  }

  // Delete file from storage
  async deleteGeneratedFile(userId: string, contentId: string, filename: string): Promise<void> {
    try {
      const storageRef = ref(storage, `generatedContent/${userId}/${contentId}/${filename}`)
      await deleteObject(storageRef)
      console.log(`🗑️ Deleted file: ${filename}`)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Delete all files for a content item
  async deleteContentFiles(_userId: string, contentId: string): Promise<void> {
    // Note: Firebase doesn't have a direct way to delete folders
    // This would need to be implemented by tracking filenames in Firestore
    // or using Firebase Functions for server-side batch deletion
    console.log(`Would delete all files for content: ${contentId}`)
  }

  // Get file metadata
  async getFileMetadata(userId: string, contentId: string, filename: string) {
    try {
      const storageRef = ref(storage, `generatedContent/${userId}/${contentId}/${filename}`)
      return await getMetadata(storageRef)
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  }

  // Helper to generate unique filename
  generateFilename(originalName: string, index?: number): string {
    const timestamp = Date.now()
    const extension = originalName.split('.').pop() || 'bin'
    const baseName = originalName.replace(/\.[^/.]+$/, '')
    const indexSuffix = index !== undefined ? `_${index + 1}` : ''
    return `${baseName}_${timestamp}${indexSuffix}.${extension}`
  }

  // Helper to get file extension from URL
  getFileExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const extension = pathname.split('.').pop()
      return extension || 'bin'
    } catch {
      return 'bin'
    }
  }

  // Convert blob to appropriate format if needed
  async convertBlobIfNeeded(blob: Blob, _targetType: string): Promise<Blob> {
    // For now, return as-is. Could add conversion logic later
    // e.g., convert WebP to PNG, or compress large files
    return blob
  }
}

export const storageService = new StorageService()