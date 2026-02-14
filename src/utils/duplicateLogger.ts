/**
 * Comprehensive logging and debugging utility for duplicate file issues
 * Provides structured logging, error tracking, and debugging information
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface DuplicateLogEntry {
  timestamp: number
  level: LogLevel
  category: string
  message: string
  data?: Record<string, any>
  stackTrace?: string
  sessionId?: string
  projectId?: string
}

export interface DuplicateMetrics {
  totalDetections: number
  skipActions: number
  updateActions: number
  createActions: number
  duplicatesBlocked: number
  pathNormalizationIssues: number
  raceConditionsDetected: number
  batchProcessingErrors: number
  lastUpdated: number
}

class DuplicateLoggerClass {
  private logs: DuplicateLogEntry[] = []
  private metrics: DuplicateMetrics = {
    totalDetections: 0,
    skipActions: 0,
    updateActions: 0,
    createActions: 0,
    duplicatesBlocked: 0,
    pathNormalizationIssues: 0,
    raceConditionsDetected: 0,
    batchProcessingErrors: 0,
    lastUpdated: Date.now()
  }
  private maxLogEntries = 1000
  private sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  /**
   * Log duplicate detection event
   */
  logDuplicateDetection(
    projectId: string,
    filePath: string,
    analysis: {
      isDuplicate: boolean
      action: string
      reason: string
      confidence?: number
      matchingFile?: { id: string; path: string }
    }
  ): void {
    this.metrics.totalDetections++
    
    if (analysis.action === 'skip') this.metrics.skipActions++
    else if (analysis.action === 'update') this.metrics.updateActions++
    else if (analysis.action === 'create_new') this.metrics.createActions++

    if (analysis.isDuplicate) {
      this.metrics.duplicatesBlocked++
    }

    this.addLog('INFO', 'DUPLICATE_DETECTION', 
      `File analysis: ${filePath} -> ${analysis.action}`, {
        projectId,
        filePath,
        isDuplicate: analysis.isDuplicate,
        action: analysis.action,
        reason: analysis.reason,
        confidence: analysis.confidence,
        matchingFileId: analysis.matchingFile?.id,
        matchingFilePath: analysis.matchingFile?.path
      })

    this.updateMetricsTimestamp()
  }

  /**
   * Log path normalization issues
   */
  logPathNormalization(
    originalPath: string,
    normalizedPath: string,
    issues?: string[]
  ): void {
    if (originalPath !== normalizedPath) {
      this.metrics.pathNormalizationIssues++
    }

    this.addLog('DEBUG', 'PATH_NORMALIZATION',
      `Path normalized: "${originalPath}" -> "${normalizedPath}"`, {
        originalPath,
        normalizedPath,
        issues,
        changed: originalPath !== normalizedPath
      })

    this.updateMetricsTimestamp()
  }

  /**
   * Log race condition detection
   */
  logRaceCondition(
    projectId: string,
    operation: string,
    lockKey: string,
    waitTime?: number
  ): void {
    this.metrics.raceConditionsDetected++

    this.addLog('WARN', 'RACE_CONDITION',
      `Race condition detected for ${operation}`, {
        projectId,
        operation,
        lockKey,
        waitTime
      })

    this.updateMetricsTimestamp()
  }

  /**
   * Log batch processing events
   */
  logBatchProcessing(
    projectId: string,
    batchSize: number,
    result: {
      successful: number
      skipped: number
      errors: number
      processingTime?: number
    }
  ): void {
    if (result.errors > 0) {
      this.metrics.batchProcessingErrors += result.errors
    }

    const level: LogLevel = result.errors > 0 ? 'ERROR' : 
                            result.skipped > 0 ? 'WARN' : 'INFO'

    this.addLog(level, 'BATCH_PROCESSING',
      `Batch processed: ${result.successful}/${batchSize} successful`, {
        projectId,
        batchSize,
        successful: result.successful,
        skipped: result.skipped,
        errors: result.errors,
        processingTime: result.processingTime
      })

    this.updateMetricsTimestamp()
  }

  /**
   * Log file matching algorithm performance
   */
  logFileMatching(
    generatedFile: string,
    existingFiles: number,
    bestMatch?: {
      confidence: number
      filePath: string
      reasons: string[]
    },
    fallbackUsed: boolean = false
  ): void {
    this.addLog('DEBUG', 'FILE_MATCHING',
      `File matching for ${generatedFile}`, {
        generatedFile,
        existingFilesCount: existingFiles,
        bestMatchConfidence: bestMatch?.confidence,
        bestMatchPath: bestMatch?.filePath,
        bestMatchReasons: bestMatch?.reasons,
        fallbackUsed
      })
  }

  /**
   * Log errors with full context
   */
  logError(
    category: string,
    message: string,
    error: Error,
    context?: Record<string, any>
  ): void {
    this.addLog('ERROR', category, message, {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    }, error.stack)
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.addLog('DEBUG', 'PERFORMANCE', 
      `${operation} took ${duration}ms`, {
        operation,
        duration,
        ...metadata
      })
  }

  /**
   * Get current metrics
   */
  getMetrics(): DuplicateMetrics {
    return { ...this.metrics }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100, level?: LogLevel): DuplicateLogEntry[] {
    let filteredLogs = [...this.logs]
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    return filteredLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string, limit: number = 50): DuplicateLogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Generate debugging report
   */
  generateDebugReport(projectId?: string): {
    summary: Record<string, any>
    metrics: DuplicateMetrics
    recentErrors: DuplicateLogEntry[]
    topIssues: Array<{ category: string; count: number; sample: string }>
    recommendations: string[]
  } {
    const filteredLogs = projectId 
      ? this.logs.filter(log => log.projectId === projectId)
      : this.logs

    const errors = filteredLogs.filter(log => log.level === 'ERROR')
    const warnings = filteredLogs.filter(log => log.level === 'WARN')

    // Group issues by category
    const issueGroups = filteredLogs.reduce((acc, log) => {
      if (log.level === 'ERROR' || log.level === 'WARN') {
        acc[log.category] = (acc[log.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topIssues = Object.entries(issueGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        sample: filteredLogs.find(log => log.category === category)?.message || ''
      }))

    // Generate recommendations
    const recommendations: string[] = []
    
    if (this.metrics.duplicatesBlocked > 10) {
      recommendations.push('High number of duplicate files detected. Consider improving AI file generation logic.')
    }
    
    if (this.metrics.pathNormalizationIssues > 5) {
      recommendations.push('Multiple path normalization issues detected. Check path format consistency.')
    }
    
    if (this.metrics.raceConditionsDetected > 0) {
      recommendations.push('Race conditions detected. Async lock implementation may need adjustment.')
    }
    
    if (this.metrics.batchProcessingErrors > 0) {
      recommendations.push('Batch processing errors occurred. Check network connectivity and error handling.')
    }

    if (recommendations.length === 0) {
      recommendations.push('No major issues detected. System is operating normally.')
    }

    return {
      summary: {
        projectId,
        sessionId: this.sessionId,
        totalLogs: filteredLogs.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        timeRange: {
          start: Math.min(...filteredLogs.map(l => l.timestamp)),
          end: Math.max(...filteredLogs.map(l => l.timestamp))
        }
      },
      metrics: this.metrics,
      recentErrors: errors.slice(-10),
      topIssues,
      recommendations
    }
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json', projectId?: string): string {
    const filteredLogs = projectId 
      ? this.logs.filter(log => log.projectId === projectId)
      : this.logs

    if (format === 'json') {
      return JSON.stringify(filteredLogs, null, 2)
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'category', 'message', 'projectId', 'data']
      const rows = filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.level,
        log.category,
        log.message.replace(/"/g, '""'), // Escape quotes
        log.projectId || '',
        JSON.stringify(log.data || {}).replace(/"/g, '""')
      ])

      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
    }
  }

  /**
   * Clear old logs to prevent memory issues
   */
  clearOldLogs(olderThanHours: number = 24): number {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    const initialLength = this.logs.length
    
    this.logs = this.logs.filter(log => log.timestamp > cutoffTime)
    
    const removed = initialLength - this.logs.length
    if (removed > 0) {
      this.addLog('INFO', 'LOG_MAINTENANCE', `Cleared ${removed} old log entries`)
    }
    
    return removed
  }

  /**
   * Reset all metrics (for testing or fresh start)
   */
  resetMetrics(): void {
    this.metrics = {
      totalDetections: 0,
      skipActions: 0,
      updateActions: 0,
      createActions: 0,
      duplicatesBlocked: 0,
      pathNormalizationIssues: 0,
      raceConditionsDetected: 0,
      batchProcessingErrors: 0,
      lastUpdated: Date.now()
    }

    this.addLog('INFO', 'SYSTEM', 'Metrics reset')
  }

  private addLog(
    level: LogLevel,
    category: string,
    message: string,
    data?: Record<string, any>,
    stackTrace?: string
  ): void {
    const entry: DuplicateLogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stackTrace,
      sessionId: this.sessionId,
      projectId: data?.projectId
    }

    this.logs.push(entry)

    // Trim logs if exceeding max limit
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries)
    }

    // Console output for immediate debugging
    const consoleMethod = level === 'ERROR' ? 'error' : 
                         level === 'WARN' ? 'warn' :
                         level === 'DEBUG' ? 'debug' : 'info'
    
    console[consoleMethod](`[DuplicateLogger:${category}] ${message}`, data || '')
  }

  private updateMetricsTimestamp(): void {
    this.metrics.lastUpdated = Date.now()
  }
}

// Export singleton instance
export const DuplicateLogger = new DuplicateLoggerClass()

// Export for testing
export { DuplicateLoggerClass }

export default DuplicateLogger