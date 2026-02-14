import { ProjectFile } from '@/types'
import PathUtils from './pathUtils'
import { DuplicateLogger } from './duplicateLogger'

export interface DuplicateAnalysis {
  isDuplicate: boolean
  exactMatch: boolean
  contentSimilarity: number
  pathSimilarity: number
  confidence: number
  recommendedAction: 'skip' | 'update' | 'create_new'
  matchingFile?: ProjectFile
  reason: string
}

export class DuplicateDetector {
  private static readonly CONTENT_SIMILARITY_THRESHOLD = 0.95
  private static readonly PATH_SIMILARITY_THRESHOLD = 0.85
  private static readonly MIN_CONTENT_LENGTH = 50

  /**
   * Comprehensive duplicate detection for project files
   */
  static analyzeFile(
    newFile: Omit<ProjectFile, 'id'>,
    existingFiles: ProjectFile[],
    projectId?: string
  ): DuplicateAnalysis {
    const startTime = performance.now()
    console.log(`[DuplicateDetector] Analyzing file: ${newFile.name} at ${newFile.path}`)
    
    // 1. Exact match check (path + name + directory flag)
    const exactMatch = this.findExactMatch(newFile, existingFiles)
    if (exactMatch) {
      console.log(`[DuplicateDetector] EXACT MATCH found: ${exactMatch.id}`)
      
      const analysis: DuplicateAnalysis = {
        isDuplicate: true,
        exactMatch: true,
        contentSimilarity: 1.0,
        pathSimilarity: 1.0,
        confidence: 1.0,
        recommendedAction: newFile.content !== exactMatch.content ? 'update' : 'skip',
        matchingFile: exactMatch,
        reason: 'Exact path and name match'
      }
      
      // Log the detection
      if (projectId) {
        DuplicateLogger.logDuplicateDetection(projectId, newFile.path, {
          isDuplicate: analysis.isDuplicate,
          action: analysis.recommendedAction,
          reason: analysis.reason,
          confidence: 1.0,
          matchingFile: { id: exactMatch.id, path: exactMatch.path }
        })
      }
      
      DuplicateLogger.logPerformance('duplicate_detection_exact', performance.now() - startTime, {
        filePath: newFile.path,
        existingFilesCount: existingFiles.length
      })
      
      return analysis
    }

    // 2. Fuzzy path matching (handles normalization issues)
    const fuzzyPathMatch = this.findFuzzyPathMatch(newFile, existingFiles)
    if (fuzzyPathMatch.match && fuzzyPathMatch.similarity > this.PATH_SIMILARITY_THRESHOLD) {
      console.log(`[DuplicateDetector] FUZZY PATH MATCH: ${fuzzyPathMatch.match.id} (similarity: ${fuzzyPathMatch.similarity})`)
      
      const contentSim = this.calculateContentSimilarity(
        newFile.content || '', 
        fuzzyPathMatch.match.content || ''
      )
      
      return {
        isDuplicate: true,
        exactMatch: false,
        contentSimilarity: contentSim,
        pathSimilarity: fuzzyPathMatch.similarity,
        confidence: fuzzyPathMatch.similarity,
        recommendedAction: contentSim < this.CONTENT_SIMILARITY_THRESHOLD ? 'update' : 'skip',
        matchingFile: fuzzyPathMatch.match,
        reason: `Similar path detected (${Math.round(fuzzyPathMatch.similarity * 100)}% similarity)`
      }
    }

    // 3. Content-based duplicate detection (for renamed/moved files)
    if (!newFile.isDirectory && newFile.content && newFile.content.length >= this.MIN_CONTENT_LENGTH) {
      const contentMatch = this.findContentMatch(newFile, existingFiles)
      if (contentMatch.match && contentMatch.similarity > this.CONTENT_SIMILARITY_THRESHOLD) {
        console.log(`[DuplicateDetector] CONTENT MATCH: ${contentMatch.match.id} (similarity: ${contentMatch.similarity})`)
        
        return {
          isDuplicate: true,
          exactMatch: false,
          contentSimilarity: contentMatch.similarity,
          pathSimilarity: 0,
          confidence: contentMatch.similarity,
          recommendedAction: 'update',
          matchingFile: contentMatch.match,
          reason: `Identical content detected (${Math.round(contentMatch.similarity * 100)}% similarity)`
        }
      }
    }

    // 4. No duplicate detected
    console.log(`[DuplicateDetector] No duplicates found for: ${newFile.name}`)
    
    const analysis: DuplicateAnalysis = {
      isDuplicate: false,
      exactMatch: false,
      contentSimilarity: 0,
      pathSimilarity: 0,
      confidence: 0,
      recommendedAction: 'create_new',
      reason: 'No duplicates detected'
    }
    
    // Log the detection
    if (projectId) {
      DuplicateLogger.logDuplicateDetection(projectId, newFile.path, {
        isDuplicate: analysis.isDuplicate,
        action: analysis.recommendedAction,
        reason: analysis.reason,
        confidence: 0
      })
    }
    
    DuplicateLogger.logPerformance('duplicate_detection_none', performance.now() - startTime, {
      filePath: newFile.path,
      existingFilesCount: existingFiles.length
    })
    
    return analysis
  }

  /**
   * Find exact path and name matches with normalized comparison
   */
  private static findExactMatch(
    newFile: Omit<ProjectFile, 'id'>,
    existingFiles: ProjectFile[]
  ): ProjectFile | null {
    const normalizedNewPath = PathUtils.normalize(newFile.path)
    const normalizedNewName = newFile.name.toLowerCase().trim()

    return existingFiles.find(existing => {
      const normalizedExistingPath = PathUtils.normalize(existing.path)
      const normalizedExistingName = existing.name.toLowerCase().trim()

      return normalizedExistingPath === normalizedNewPath &&
             normalizedExistingName === normalizedNewName &&
             existing.isDirectory === newFile.isDirectory
    }) || null
  }

  /**
   * Find files with similar paths (handles leading slash inconsistencies)
   */
  private static findFuzzyPathMatch(
    newFile: Omit<ProjectFile, 'id'>,
    existingFiles: ProjectFile[]
  ): { match: ProjectFile | null; similarity: number } {
    let bestMatch: ProjectFile | null = null
    let bestSimilarity = 0

    const normalizedNewPath = PathUtils.normalize(newFile.path)
    const normalizedNewName = newFile.name.toLowerCase().trim()

    for (const existing of existingFiles) {
      if (existing.isDirectory !== newFile.isDirectory) continue

      const normalizedExistingPath = PathUtils.normalize(existing.path)
      const normalizedExistingName = existing.name.toLowerCase().trim()

      // Use improved PathUtils similarity calculation
      const pathSim = PathUtils.calculateSimilarity(normalizedNewPath, normalizedExistingPath)
      const nameSim = this.calculateStringSimilarity(normalizedNewName, normalizedExistingName)
      
      // Also check path equivalence with flexible options
      const isEquivalent = PathUtils.areEquivalent(newFile.path, existing.path, {
        ignoreCase: true,
        ignoreLeadingSlash: true,
        ignoreTrailingSlash: true
      })

      // If paths are equivalent, boost similarity score
      const equivalenceBoost = isEquivalent ? 0.3 : 0
      
      // Combined similarity (weighted toward name similarity for same-directory files)
      const combinedSim = (pathSim * 0.4) + (nameSim * 0.6) + equivalenceBoost

      if (combinedSim > bestSimilarity) {
        bestSimilarity = combinedSim
        bestMatch = existing
      }
    }

    return { match: bestMatch, similarity: bestSimilarity }
  }

  /**
   * Find files with identical or very similar content
   */
  private static findContentMatch(
    newFile: Omit<ProjectFile, 'id'>,
    existingFiles: ProjectFile[]
  ): { match: ProjectFile | null; similarity: number } {
    let bestMatch: ProjectFile | null = null
    let bestSimilarity = 0

    const newContent = (newFile.content || '').trim()
    if (newContent.length < this.MIN_CONTENT_LENGTH) {
      return { match: null, similarity: 0 }
    }

    for (const existing of existingFiles) {
      if (existing.isDirectory || !existing.content) continue
      
      const existingContent = existing.content.trim()
      if (existingContent.length < this.MIN_CONTENT_LENGTH) continue

      const similarity = this.calculateContentSimilarity(newContent, existingContent)
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity
        bestMatch = existing
      }
    }

    return { match: bestMatch, similarity: bestSimilarity }
  }

  /**
   * Calculate content similarity using multiple heuristics
   */
  private static calculateContentSimilarity(content1: string, content2: string): number {
    if (content1 === content2) return 1.0
    if (!content1 || !content2) return 0

    const c1 = content1.trim()
    const c2 = content2.trim()

    // Quick length-based filter
    const lengthRatio = Math.min(c1.length, c2.length) / Math.max(c1.length, c2.length)
    if (lengthRatio < 0.5) return 0

    // Line-based similarity (good for code)
    const lines1 = c1.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const lines2 = c2.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    
    const commonLines = lines1.filter(line1 => 
      lines2.some(line2 => line1 === line2)
    ).length
    
    const lineSimilarity = commonLines / Math.max(lines1.length, lines2.length)

    // Character-based similarity for short content
    const charSimilarity = this.calculateStringSimilarity(c1, c2)

    // Weighted combination
    return (lineSimilarity * 0.7) + (charSimilarity * 0.3)
  }

  /**
   * Calculate string similarity using Jaro-Winkler algorithm approximation
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (!str1 || !str2) return 0

    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    // Simple character-based similarity for performance
    const maxLen = Math.max(s1.length, s2.length)
    const minLen = Math.min(s1.length, s2.length)
    
    let matches = 0
    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) {
        matches++
      }
    }

    return (matches / maxLen) * (minLen / maxLen)
  }

  /**
   * Batch duplicate analysis for multiple files
   */
  static batchAnalyze(
    newFiles: Array<Omit<ProjectFile, 'id'>>,
    existingFiles: ProjectFile[]
  ): Map<string, DuplicateAnalysis> {
    const results = new Map<string, DuplicateAnalysis>()
    const processedFiles = [...existingFiles] // Copy to track additions during batch

    console.log(`[DuplicateDetector] Batch analyzing ${newFiles.length} files`)

    for (const newFile of newFiles) {
      const fileKey = `${newFile.path}:${newFile.name}`
      const analysis = this.analyzeFile(newFile, processedFiles)
      
      results.set(fileKey, analysis)

      // If file would be created, add it to processed files for next iteration
      if (analysis.recommendedAction === 'create_new') {
        processedFiles.push({
          id: `temp_${Date.now()}_${Math.random()}`,
          ...newFile
        })
      }
    }

    console.log(`[DuplicateDetector] Batch analysis complete:`, {
      total: newFiles.length,
      duplicates: Array.from(results.values()).filter(a => a.isDuplicate).length,
      skips: Array.from(results.values()).filter(a => a.recommendedAction === 'skip').length,
      updates: Array.from(results.values()).filter(a => a.recommendedAction === 'update').length
    })

    return results
  }
}