/**
 * Async lock utility to prevent race conditions
 * Prevents concurrent execution of critical sections
 */

interface LockEntry {
  promise: Promise<void>
  resolve: () => void
}

export class AsyncLock {
  private locks: Map<string, LockEntry> = new Map()
  private queue: Map<string, Array<{ resolve: () => void; reject: (error: Error) => void }>> = new Map()

  /**
   * Acquire a lock for a given key
   * If lock is already held, wait until it's released
   */
  async acquire(key: string, timeout: number = 30000): Promise<void> {
    const startTime = Date.now()
    
    console.log(`[AsyncLock] Attempting to acquire lock: ${key}`)
    
    // Check if lock already exists
    const existingLock = this.locks.get(key)
    if (existingLock) {
      console.log(`[AsyncLock] Lock ${key} already held, queuing...`)
      
      return new Promise<void>((resolve, reject) => {
        // Add to queue
        const queueList = this.queue.get(key) || []
        queueList.push({ resolve, reject })
        this.queue.set(key, queueList)
        
        // Set timeout
        const timeoutId = setTimeout(() => {
          // Remove from queue
          const currentQueue = this.queue.get(key) || []
          const index = currentQueue.findIndex(item => item.resolve === resolve)
          if (index >= 0) {
            currentQueue.splice(index, 1)
            if (currentQueue.length === 0) {
              this.queue.delete(key)
            } else {
              this.queue.set(key, currentQueue)
            }
          }
          reject(new Error(`AsyncLock timeout for key: ${key} after ${timeout}ms`))
        }, timeout)
        
        // Wait for existing lock to be released
        existingLock.promise.finally(() => {
          clearTimeout(timeoutId)
          
          // Check if still in queue (not timed out)
          const currentQueue = this.queue.get(key) || []
          const queueIndex = currentQueue.findIndex(item => item.resolve === resolve)
          if (queueIndex >= 0) {
            currentQueue.splice(queueIndex, 1)
            if (currentQueue.length === 0) {
              this.queue.delete(key)
            } else {
              this.queue.set(key, currentQueue)
            }
            
            console.log(`[AsyncLock] Lock ${key} acquired from queue after ${Date.now() - startTime}ms`)
            resolve()
          }
        })
      }).then(() => {
        // Create new lock
        this.createLock(key)
      })
    } else {
      // No existing lock, create immediately
      this.createLock(key)
      console.log(`[AsyncLock] Lock ${key} acquired immediately`)
    }
  }

  /**
   * Release a lock for a given key
   */
  release(key: string): void {
    const lock = this.locks.get(key)
    if (lock) {
      console.log(`[AsyncLock] Releasing lock: ${key}`)
      this.locks.delete(key)
      lock.resolve()
      
      // Process next in queue if any
      const queueList = this.queue.get(key)
      if (queueList && queueList.length > 0) {
        const next = queueList.shift()!
        if (queueList.length === 0) {
          this.queue.delete(key)
        } else {
          this.queue.set(key, queueList)
        }
        
        // Process next item asynchronously
        setTimeout(() => {
          next.resolve()
        }, 0)
      }
    } else {
      console.warn(`[AsyncLock] Attempted to release non-existent lock: ${key}`)
    }
  }

  /**
   * Execute a function with a lock
   */
  async withLock<T>(
    key: string, 
    fn: () => Promise<T> | T, 
    timeout: number = 30000
  ): Promise<T> {
    await this.acquire(key, timeout)
    try {
      return await fn()
    } finally {
      this.release(key)
    }
  }

  /**
   * Check if a lock is currently held
   */
  isLocked(key: string): boolean {
    return this.locks.has(key)
  }

  /**
   * Get all currently held lock keys
   */
  getHeldLocks(): string[] {
    return Array.from(this.locks.keys())
  }

  /**
   * Clear all locks (emergency use only)
   */
  clearAll(): void {
    console.warn('[AsyncLock] Clearing all locks - emergency operation')
    
    // Resolve all pending locks
    for (const [, lock] of this.locks) {
      lock.resolve()
    }
    
    // Reject all queued promises
    for (const [key, queueList] of this.queue) {
      for (const item of queueList) {
        item.reject(new Error(`Lock cleared: ${key}`))
      }
    }
    
    this.locks.clear()
    this.queue.clear()
  }

  private createLock(key: string): void {
    let resolveFunc: () => void = () => {}
    
    const promise = new Promise<void>((resolve) => {
      resolveFunc = resolve
    })
    
    this.locks.set(key, {
      promise,
      resolve: resolveFunc
    })
  }

  /**
   * Get debug information about current locks
   */
  getDebugInfo(): { locks: string[]; queues: Record<string, number> } {
    const queues: Record<string, number> = {}
    for (const [key, queueList] of this.queue) {
      queues[key] = queueList.length
    }
    
    return {
      locks: Array.from(this.locks.keys()),
      queues
    }
  }
}

// Global instance for project operations
export const projectLock = new AsyncLock()

// Global instance for file operations
export const fileLock = new AsyncLock()

// Utility function for creating operation-specific locks
export function createOperationLock(projectId: string, operation: string): string {
  return `${projectId}:${operation}`
}

export default AsyncLock