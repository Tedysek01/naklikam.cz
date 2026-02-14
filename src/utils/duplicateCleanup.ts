/**
 * Cleanup utility for existing projects with duplicate files
 * Analyzes existing projects and removes/merges duplicate files safely
 */

import { ProjectFile } from '@/types'
import { DuplicateDetector } from './duplicateDetection'
import { DuplicateLogger } from './duplicateLogger'
import PathUtils from './pathUtils'

export interface CleanupAnalysis {
  projectId: string
  totalFiles: number
  duplicateGroups: DuplicateGroup[]
  recommendations: CleanupRecommendation[]
  safeDeletions: string[] // File IDs safe to delete
  conflictResolutions: ConflictResolution[]
  estimatedSpaceSaved: number
}

export interface DuplicateGroup {
  id: string
  files: ProjectFile[]
  duplicateType: 'exact' | 'content' | 'path' | 'name'
  confidence: number
  bestFile: ProjectFile // The file to keep
  reason: string
}

export interface CleanupRecommendation {
  type: 'delete' | 'merge' | 'rename' | 'review'
  fileId: string
  filePath: string
  reason: string
  confidence: number
  action: string
}

export interface ConflictResolution {
  conflictType: 'content_difference' | 'newer_version' | 'path_preference'
  files: ProjectFile[]
  recommendedAction: string
  manualReviewRequired: boolean
}

export class DuplicateCleanup {
  
  /**
   * Analyze existing project for duplicate files
   */
  static async analyzeProject(
    projectId: string,
    files: ProjectFile[]
  ): Promise<CleanupAnalysis> {
    console.log(`[DuplicateCleanup] Analyzing project ${projectId} with ${files.length} files`)
    
    const startTime = performance.now()
    const duplicateGroups: DuplicateGroup[] = []
    const recommendations: CleanupRecommendation[] = []
    const conflictResolutions: ConflictResolution[] = []
    const safeDeletions: string[] = []
    const processedFiles = new Set<string>()
    
    // Group files by potential duplicates
    for (let i = 0; i < files.length; i++) {
      const currentFile = files[i]
      
      if (processedFiles.has(currentFile.id) || currentFile.isDirectory) {
        continue
      }
      
      const potentialDuplicates: ProjectFile[] = []
      const remainingFiles = files.slice(i + 1)
      
      // Find all potential duplicates for current file
      for (const otherFile of remainingFiles) {
        if (processedFiles.has(otherFile.id) || otherFile.isDirectory) {
          continue
        }
        
        const analysis = DuplicateDetector.analyzeFile(
          {
            name: otherFile.name,
            path: otherFile.path,
            content: otherFile.content,
            language: otherFile.language,
            isDirectory: otherFile.isDirectory
          },
          [currentFile],
          projectId
        )
        
        if (analysis.isDuplicate && analysis.confidence > 0.7) {
          potentialDuplicates.push(otherFile)
          processedFiles.add(otherFile.id)
        }
      }
      
      if (potentialDuplicates.length > 0) {
        const allFiles = [currentFile, ...potentialDuplicates]
        const group = this.createDuplicateGroup(allFiles, projectId)
        duplicateGroups.push(group)
        
        // Mark all files in group as processed
        allFiles.forEach(file => processedFiles.add(file.id))
        
        // Generate recommendations for this group
        const groupRecs = this.generateGroupRecommendations(group)
        recommendations.push(...groupRecs)
        
        // Check for conflicts
        const conflicts = this.detectConflicts(group)
        if (conflicts) {
          conflictResolutions.push(conflicts)
        } else {
          // Safe to delete duplicates if no conflicts
          group.files
            .filter(f => f.id !== group.bestFile.id)
            .forEach(f => safeDeletions.push(f.id))
        }
      }
    }
    
    const estimatedSpaceSaved = this.calculateSpaceSaved(duplicateGroups)
    
    DuplicateLogger.logPerformance('project_cleanup_analysis', performance.now() - startTime, {
      projectId,
      totalFiles: files.length,
      duplicateGroups: duplicateGroups.length,
      safeDeletions: safeDeletions.length
    })
    
    console.log(`[DuplicateCleanup] Analysis complete: ${duplicateGroups.length} duplicate groups found`)
    
    return {
      projectId,
      totalFiles: files.length,
      duplicateGroups,
      recommendations,
      safeDeletions,
      conflictResolutions,
      estimatedSpaceSaved
    }
  }
  
  /**
   * Create a duplicate group from similar files
   */
  private static createDuplicateGroup(files: ProjectFile[], _projectId: string): DuplicateGroup {
    // Determine duplicate type and confidence
    let duplicateType: DuplicateGroup['duplicateType'] = 'name'
    let confidence = 0.5
    
    // Check for exact content matches
    const contentGroups = this.groupByContent(files)
    if (contentGroups.length < files.length) {
      duplicateType = 'content'
      confidence = 0.95
    }
    
    // Check for exact path matches (different content)
    const pathGroups = this.groupByNormalizedPath(files)
    if (pathGroups.length < files.length && duplicateType !== 'content') {
      duplicateType = 'path'
      confidence = 0.9
    }
    
    // Check for exact name matches
    const nameGroups = this.groupByName(files)
    if (nameGroups.length < files.length && duplicateType === 'name') {
      confidence = 0.8
    }
    
    // Select best file to keep
    const bestFile = this.selectBestFile(files)
    
    const reason = this.generateGroupReason(files, duplicateType, bestFile)
    
    return {
      id: `group_${files.map(f => f.id).sort().join('_')}`,
      files,
      duplicateType,
      confidence,
      bestFile,
      reason
    }
  }
  
  /**
   * Select the best file to keep from a group of duplicates
   */
  private static selectBestFile(files: ProjectFile[]): ProjectFile {
    // Scoring criteria (higher is better)
    const scoreFile = (file: ProjectFile): number => {
      let score = 0
      
      // Prefer files with more content
      score += (file.content?.length || 0) * 0.001
      
      // Prefer files in standard locations
      const standardPaths = ['/src/', '/components/', '/pages/', '/utils/', '/hooks/']
      if (standardPaths.some(path => file.path.includes(path))) {
        score += 10
      }
      
      // Prefer TypeScript over JavaScript
      if (file.language === 'typescript' || file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
        score += 5
      }
      
      // Prefer shorter, cleaner paths
      const pathDepth = file.path.split('/').length
      score += Math.max(0, 10 - pathDepth)
      
      // Prefer files with better naming conventions
      if (file.name.match(/^[A-Z][a-zA-Z0-9]*\.(tsx|ts|jsx|js)$/)) {
        score += 3 // PascalCase component names
      }
      
      // Penalize files with numbers or weird characters
      if (file.name.match(/[0-9_-]/)) {
        score -= 2
      }
      
      return score
    }
    
    return files.reduce((best, current) => 
      scoreFile(current) > scoreFile(best) ? current : best
    )
  }
  
  /**
   * Generate recommendations for a duplicate group
   */
  private static generateGroupRecommendations(group: DuplicateGroup): CleanupRecommendation[] {
    const recommendations: CleanupRecommendation[] = []
    
    for (const file of group.files) {
      if (file.id === group.bestFile.id) {
        // Keep the best file
        recommendations.push({
          type: 'review',
          fileId: file.id,
          filePath: file.path,
          reason: `Keep as primary file (${group.reason})`,
          confidence: group.confidence,
          action: 'Keep this file - it\'s the best version'
        })
      } else {
        // Recommend action for duplicates
        if (group.confidence > 0.9) {
          recommendations.push({
            type: 'delete',
            fileId: file.id,
            filePath: file.path,
            reason: `Safe to delete - ${group.duplicateType} duplicate`,
            confidence: group.confidence,
            action: `Delete (duplicate of ${group.bestFile.path})`
          })
        } else if (group.confidence > 0.8) {
          recommendations.push({
            type: 'merge',
            fileId: file.id,
            filePath: file.path,
            reason: `Consider merging with ${group.bestFile.path}`,
            confidence: group.confidence,
            action: `Review and merge content if needed`
          })
        } else {
          recommendations.push({
            type: 'review',
            fileId: file.id,
            filePath: file.path,
            reason: `Manual review needed - similar but may be different`,
            confidence: group.confidence,
            action: `Compare with ${group.bestFile.path} and decide manually`
          })
        }
      }
    }
    
    return recommendations
  }
  
  /**
   * Detect conflicts that need manual resolution
   */
  private static detectConflicts(group: DuplicateGroup): ConflictResolution | null {
    // Check for content differences in high-confidence duplicates
    if (group.duplicateType === 'path' || group.duplicateType === 'name') {
      const contentDifferences = group.files.some(file => 
        file.content !== group.bestFile.content
      )
      
      if (contentDifferences) {
        return {
          conflictType: 'content_difference',
          files: group.files,
          recommendedAction: 'Manual review required - same path/name but different content',
          manualReviewRequired: true
        }
      }
    }
    
    return null
  }
  
  /**
   * Execute cleanup based on analysis
   */
  static async executeCleanup(
    analysis: CleanupAnalysis,
    deleteFiles: (fileIds: string[]) => Promise<void>,
    _updateFile: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>,
    options: {
      autoDelete?: boolean
      confirmBeforeDelete?: boolean
      backupBeforeDelete?: boolean
    } = {}
  ): Promise<{
    deleted: number
    updated: number
    errors: string[]
    summary: string
  }> {
    const { autoDelete = false, confirmBeforeDelete = true } = options
    let deleted = 0
    let updated = 0
    const errors: string[] = []
    
    console.log(`[DuplicateCleanup] Starting cleanup for project ${analysis.projectId}`)
    
    try {
      // Process safe deletions
      if (autoDelete && analysis.safeDeletions.length > 0) {
        if (!confirmBeforeDelete) {
          await deleteFiles(analysis.safeDeletions)
          deleted = analysis.safeDeletions.length
          console.log(`[DuplicateCleanup] Deleted ${deleted} duplicate files`)
        } else {
          console.log(`[DuplicateCleanup] Found ${analysis.safeDeletions.length} files safe to delete (confirmation required)`)
        }
      }
      
      // Log conflicts for manual resolution
      if (analysis.conflictResolutions.length > 0) {
        console.log(`[DuplicateCleanup] Found ${analysis.conflictResolutions.length} conflicts requiring manual review`)
        analysis.conflictResolutions.forEach(conflict => {
          DuplicateLogger.logError('CLEANUP_CONFLICT', 
            `Manual review required: ${conflict.conflictType}`, 
            new Error(conflict.recommendedAction), {
              projectId: analysis.projectId,
              files: conflict.files.map(f => ({ id: f.id, path: f.path }))
            })
        })
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push(errorMsg)
      DuplicateLogger.logError('CLEANUP_EXECUTION', 'Cleanup execution failed', 
        error instanceof Error ? error : new Error(errorMsg), {
          projectId: analysis.projectId
        })
    }
    
    const summary = this.generateCleanupSummary(analysis, deleted, updated, errors)
    
    return { deleted, updated, errors, summary }
  }
  
  /**
   * Generate cleanup summary report
   */
  private static generateCleanupSummary(
    analysis: CleanupAnalysis,
    deleted: number,
    updated: number,
    errors: string[]
  ): string {
    const lines = [
      `📊 Cleanup Summary for Project ${analysis.projectId}`,
      `   📁 Total files analyzed: ${analysis.totalFiles}`,
      `   🔍 Duplicate groups found: ${analysis.duplicateGroups.length}`,
      `   ✅ Files deleted: ${deleted}`,
      `   📝 Files updated: ${updated}`,
      `   ⚠️ Errors: ${errors.length}`,
      `   🗑️ Safe deletions available: ${analysis.safeDeletions.length}`,
      `   ⚡ Conflicts requiring review: ${analysis.conflictResolutions.length}`,
      `   💾 Estimated space saved: ${this.formatBytes(analysis.estimatedSpaceSaved)}`
    ]
    
    if (analysis.conflictResolutions.length > 0) {
      lines.push(``)
      lines.push(`🔍 Manual Review Required:`)
      analysis.conflictResolutions.forEach(conflict => {
        lines.push(`   • ${conflict.conflictType}: ${conflict.files.length} files`)
      })
    }
    
    if (errors.length > 0) {
      lines.push(``)
      lines.push(`❌ Errors:`)
      errors.forEach(error => {
        lines.push(`   • ${error}`)
      })
    }
    
    return lines.join('\n')
  }
  
  // Helper methods
  private static groupByContent(files: ProjectFile[]): ProjectFile[][] {
    const groups = new Map<string, ProjectFile[]>()
    files.forEach(file => {
      const content = file.content || ''
      const existing = groups.get(content) || []
      existing.push(file)
      groups.set(content, existing)
    })
    return Array.from(groups.values())
  }
  
  private static groupByNormalizedPath(files: ProjectFile[]): ProjectFile[][] {
    const groups = new Map<string, ProjectFile[]>()
    files.forEach(file => {
      const path = PathUtils.normalize(file.path)
      const existing = groups.get(path) || []
      existing.push(file)
      groups.set(path, existing)
    })
    return Array.from(groups.values())
  }
  
  private static groupByName(files: ProjectFile[]): ProjectFile[][] {
    const groups = new Map<string, ProjectFile[]>()
    files.forEach(file => {
      const name = file.name.toLowerCase()
      const existing = groups.get(name) || []
      existing.push(file)
      groups.set(name, existing)
    })
    return Array.from(groups.values())
  }
  
  private static generateGroupReason(files: ProjectFile[], type: string, bestFile: ProjectFile): string {
    const reasons = {
      exact: `Identical files - keeping ${bestFile.path}`,
      content: `Same content in ${files.length} files - keeping best location`,
      path: `Same path with different content - keeping most recent`,
      name: `Same filename in different locations - keeping ${bestFile.path}`
    }
    return reasons[type as keyof typeof reasons] || 'Similar files detected'
  }
  
  private static calculateSpaceSaved(groups: DuplicateGroup[]): number {
    return groups.reduce((total, group) => {
      const duplicateFiles = group.files.filter(f => f.id !== group.bestFile.id)
      const spacePerGroup = duplicateFiles.reduce((sum, file) => 
        sum + (file.content?.length || 0), 0)
      return total + spacePerGroup
    }, 0)
  }
  
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export default DuplicateCleanup