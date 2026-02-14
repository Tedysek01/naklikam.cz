/**
 * Robust batch processing utility for handling multiple file operations
 * Prevents duplicates and handles errors gracefully
 */

import { ProjectFile } from '@/types'
import { DuplicateDetector } from './duplicateDetection'
import { projectLock, createOperationLock } from './asyncLock'

export interface BatchOperation {
  type: 'create' | 'update'
  file: Omit<ProjectFile, 'id'>
  existingFileId?: string
  priority?: number
}

export interface BatchResult {
  successful: number
  skipped: number
  errors: number
  operations: Array<{
    operation: BatchOperation
    result: 'success' | 'skipped' | 'error'
    reason: string
    fileId?: string
    error?: Error
  }>
}

export interface BatchProcessorOptions {
  projectId: string
  validateDuplicates?: boolean
  maxConcurrency?: number
  retryCount?: number
  onProgress?: (completed: number, total: number) => void
}

export class BatchProcessor {
  
  /**
   * Process batch of file operations with comprehensive duplicate detection
   */
  static async processBatch(
    operations: BatchOperation[],
    existingFiles: ProjectFile[],
    executeOperation: (op: BatchOperation) => Promise<{ success: boolean; fileId?: string; error?: Error }>,
    options: BatchProcessorOptions
  ): Promise<BatchResult> {
    const {
      projectId,
      validateDuplicates = true,
      onProgress,
      retryCount = 1
    } = options

    console.log(`[BatchProcessor] Starting batch processing: ${operations.length} operations for project ${projectId}`)

    const result: BatchResult = {
      successful: 0,
      skipped: 0,
      errors: 0,
      operations: []
    }

    if (operations.length === 0) {
      console.log(`[BatchProcessor] No operations to process`)
      return result
    }

    // Use project-wide lock for batch operations
    const lockKey = createOperationLock(projectId, `batch-${Date.now()}`)

    return await projectLock.withLock(lockKey, async () => {
      console.log(`[BatchProcessor] Acquired lock: ${lockKey}`)

      // Step 1: Analyze all operations for duplicates if enabled
      let filteredOperations = operations
      if (validateDuplicates) {
        console.log(`[BatchProcessor] Analyzing duplicates for ${operations.length} operations`)
        filteredOperations = await this.analyzeBatchDuplicates(operations, existingFiles)
        console.log(`[BatchProcessor] After duplicate analysis: ${filteredOperations.length}/${operations.length} operations`)
      }

      // Step 2: Sort operations by priority (higher priority first)
      filteredOperations.sort((a, b) => (b.priority || 0) - (a.priority || 0))

      // Step 3: Group operations by type for optimal processing
      const updateOps = filteredOperations.filter(op => op.type === 'update')
      const createOps = filteredOperations.filter(op => op.type === 'create')

      console.log(`[BatchProcessor] Processing ${updateOps.length} updates and ${createOps.length} creates`)

      // Step 4: Process updates first (to avoid conflicts with creates)
      let processedCount = 0
      
      for (const operation of updateOps) {
        const opResult = await this.executeWithRetry(operation, executeOperation, retryCount)
        result.operations.push(opResult)
        
        if (opResult.result === 'success') {
          result.successful++
        } else if (opResult.result === 'skipped') {
          result.skipped++
        } else {
          result.errors++
        }

        processedCount++
        onProgress?.(processedCount, filteredOperations.length)
      }

      // Step 5: Process creates
      for (const operation of createOps) {
        const opResult = await this.executeWithRetry(operation, executeOperation, retryCount)
        result.operations.push(opResult)
        
        if (opResult.result === 'success') {
          result.successful++
        } else if (opResult.result === 'skipped') {
          result.skipped++
        } else {
          result.errors++
        }

        processedCount++
        onProgress?.(processedCount, filteredOperations.length)
      }

      console.log(`[BatchProcessor] Batch processing completed:`, {
        total: filteredOperations.length,
        successful: result.successful,
        skipped: result.skipped,
        errors: result.errors,
        lockKey
      })

      return result
    })
  }

  /**
   * Analyze batch operations for duplicates and conflicts
   */
  private static async analyzeBatchDuplicates(
    operations: BatchOperation[],
    existingFiles: ProjectFile[]
  ): Promise<BatchOperation[]> {
    const filteredOps: BatchOperation[] = []
    const seenOperations = new Set<string>()
    
    // Track files that will be created during this batch
    const pendingCreations = new Map<string, BatchOperation>()
    
    for (const operation of operations) {
      // Create unique key for operation deduplication
      const opKey = `${operation.type}:${operation.file.path}:${operation.existingFileId || 'new'}`
      
      if (seenOperations.has(opKey)) {
        console.log(`[BatchProcessor] DUPLICATE OPERATION DETECTED: ${opKey}`)
        continue
      }
      
      seenOperations.add(opKey)

      if (operation.type === 'create') {
        // Check against existing files and pending creates
        const analysis = DuplicateDetector.analyzeFile(operation.file, existingFiles)
        const pathKey = operation.file.path.toLowerCase()
        
        // Check against pending creates
        const pendingConflict = pendingCreations.get(pathKey)
        if (pendingConflict) {
          console.log(`[BatchProcessor] BATCH CONFLICT: ${operation.file.path} conflicts with pending create`)
          continue
        }
        
        if (analysis.recommendedAction === 'skip') {
          console.log(`[BatchProcessor] SKIPPING CREATE: ${analysis.reason}`)
          continue
        } else if (analysis.recommendedAction === 'update' && analysis.matchingFile) {
          console.log(`[BatchProcessor] CONVERTING CREATE TO UPDATE: ${analysis.reason}`)
          // Convert create to update operation
          filteredOps.push({
            type: 'update',
            file: operation.file,
            existingFileId: analysis.matchingFile.id,
            priority: operation.priority
          })
          continue
        }
        
        // Add to pending creates
        pendingCreations.set(pathKey, operation)
        filteredOps.push(operation)
        
      } else if (operation.type === 'update') {
        if (!operation.existingFileId) {
          console.warn(`[BatchProcessor] UPDATE OPERATION MISSING FILE ID: ${operation.file.path}`)
          continue
        }
        
        // Verify the file still exists
        const existingFile = existingFiles.find(f => f.id === operation.existingFileId)
        if (!existingFile) {
          console.warn(`[BatchProcessor] UPDATE TARGET NOT FOUND: ${operation.existingFileId}`)
          continue
        }
        
        filteredOps.push(operation)
      }
    }

    console.log(`[BatchProcessor] Duplicate analysis complete: ${filteredOps.length}/${operations.length} operations kept`)
    
    return filteredOps
  }

  /**
   * Execute operation with retry logic
   */
  private static async executeWithRetry(
    operation: BatchOperation,
    executeOperation: (op: BatchOperation) => Promise<{ success: boolean; fileId?: string; error?: Error }>,
    retryCount: number
  ): Promise<{
    operation: BatchOperation
    result: 'success' | 'skipped' | 'error'
    reason: string
    fileId?: string
    error?: Error
  }> {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        console.log(`[BatchProcessor] Executing ${operation.type} for ${operation.file.path} (attempt ${attempt + 1}/${retryCount + 1})`)
        
        const execResult = await executeOperation(operation)
        
        if (execResult.success) {
          return {
            operation,
            result: 'success',
            reason: `${operation.type} completed successfully`,
            fileId: execResult.fileId
          }
        } else {
          lastError = execResult.error || new Error('Operation failed without error details')
          console.warn(`[BatchProcessor] Operation failed (attempt ${attempt + 1}):`, lastError.message)
          
          // Don't retry certain types of errors
          if (lastError.message.includes('duplicate') || lastError.message.includes('not found')) {
            break
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[BatchProcessor] Operation threw error (attempt ${attempt + 1}):`, lastError.message)
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return {
      operation,
      result: 'error',
      reason: `Failed after ${retryCount + 1} attempts: ${lastError?.message}`,
      error: lastError
    }
  }

  /**
   * Create batch operations from generated files
   */
  static createBatchFromGeneratedFiles(
    generatedFiles: Array<{
      name: string
      path: string
      content: string
      language: string
      operation?: 'create' | 'update'
      existingFileId?: string
      matchConfidence?: number
    }>
  ): BatchOperation[] {
    return generatedFiles.map((file, index) => ({
      type: file.operation || 'create',
      file: {
        name: file.name,
        path: file.path,
        content: file.content,
        language: file.language,
        isDirectory: false
      },
      existingFileId: file.existingFileId,
      priority: file.operation === 'update' ? 100 : 50 + index // Updates get higher priority
    }))
  }

  /**
   * Get debug information about batch processing
   */
  static getBatchAnalytics(result: BatchResult): {
    successRate: number
    errorRate: number
    skipRate: number
    totalOperations: number
    mostCommonErrors: string[]
  } {
    const total = result.operations.length
    if (total === 0) {
      return {
        successRate: 0,
        errorRate: 0,
        skipRate: 0,
        totalOperations: 0,
        mostCommonErrors: []
      }
    }

    const errorReasons = result.operations
      .filter(op => op.result === 'error')
      .map(op => op.reason)
      .reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const mostCommonErrors = Object.entries(errorReasons)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason)

    return {
      successRate: (result.successful / total) * 100,
      errorRate: (result.errors / total) * 100,
      skipRate: (result.skipped / total) * 100,
      totalOperations: total,
      mostCommonErrors
    }
  }
}

export default BatchProcessor