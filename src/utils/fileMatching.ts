/**
 * Smart File Matching Algorithm
 * Intelligently matches generated files with existing project files
 */

import PathUtils from './pathUtils'

export interface FileMatchResult {
  existingFile: {
    id: string
    name: string
    path: string
    language: string
  }
  confidence: number // 0-1 scale
  reasons: string[]
}

export interface FileMatchAnalysis {
  bestMatch?: FileMatchResult
  allMatches: FileMatchResult[]
  shouldUpdate: boolean
  confidence: number
}

export class FileMatchingEngine {
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )  
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Calculate string similarity (0-1 scale)
   */
  private static stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) {
      return 1.0
    }
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Extract file extension from filename
   */
  private static getFileExtension(filename: string): string {
    return PathUtils.getExtension(filename)
  }

  /**
   * Extract base filename without extension
   */
  private static getBaseName(filename: string): string {
    return PathUtils.getBaseName(filename)
  }

  /**
   * Check if two files have compatible languages/extensions
   */
  private static areLanguagesCompatible(lang1: string, ext1: string, lang2: string, ext2: string): boolean {
    // Exact matches
    if (lang1 === lang2 || ext1 === ext2) {
      return true
    }

    // Compatible language groups
    const compatibilityGroups = [
      ['typescript', 'javascript', 'tsx', 'jsx', 'ts', 'js'],
      ['css', 'scss', 'sass', 'less'],
      ['html', 'htm'],
      ['json', 'jsonc'],
      ['markdown', 'md']
    ]

    for (const group of compatibilityGroups) {
      if ((group.includes(lang1) || group.includes(ext1)) && 
          (group.includes(lang2) || group.includes(ext2))) {
        return true
      }
    }

    return false
  }

  /**
   * Normalize path for comparison - ensures consistent format
   */
  private static normalizePath(path: string): string {
    return PathUtils.normalize(path, { preserveCase: false })
  }

  /**
   * Score filename similarity with various heuristics
   */
  private static scoreFileNameMatch(
    generatedName: string, 
    existingName: string, 
    generatedLang: string, 
    existingLang: string
  ): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    // Normalize paths for comparison
    const genNormalized = this.normalizePath(generatedName)
    const existNormalized = this.normalizePath(existingName)
    
    console.log(`Path matching: "${generatedName}" (normalized: "${genNormalized}") vs "${existingName}" (normalized: "${existNormalized}")`)

    // Extract components
    const genBaseName = this.getBaseName(generatedName).toLowerCase()
    const existBaseName = this.getBaseName(existingName).toLowerCase()
    const genExt = this.getFileExtension(generatedName)
    const existExt = this.getFileExtension(existingName)

    // Use PathUtils enhanced equivalence check
    if (PathUtils.areEquivalent(generatedName, existingName, {
      ignoreCase: true,
      ignoreLeadingSlash: true,
      ignoreTrailingSlash: true
    })) {
      score += 0.98
      reasons.push('Path equivalence (flexible normalization)')
      console.log(`PATH EQUIVALENCE: ${generatedName} ≡ ${existingName}`)
    }
    // Exact path match (very high score)
    else if (genNormalized === existNormalized) {
      score += 0.95
      reasons.push('Exact path match (normalized)')
      console.log(`EXACT PATH MATCH: ${generatedName} === ${existingName}`)
    }
    // Use PathUtils similarity calculation
    else {
      const pathSimilarity = PathUtils.calculateSimilarity(generatedName, existingName)
      if (pathSimilarity > 0.8) {
        score += pathSimilarity * 0.85
        reasons.push(`High path similarity (${(pathSimilarity * 100).toFixed(0)}%)`)
      } else if (pathSimilarity > 0.6) {
        score += pathSimilarity * 0.6
        reasons.push(`Moderate path similarity (${(pathSimilarity * 100).toFixed(0)}%)`)
      } else {
        // Fallback to basename comparison
        if (genBaseName === existBaseName) {
          score += 0.75
          reasons.push('Exact basename match (different directories)')
          console.log(`BASENAME MATCH: ${genBaseName} === ${existBaseName}`)
        } else {
          // Fuzzy name matching with improved scoring
          const nameSimilarity = this.stringSimilarity(genBaseName, existBaseName)
          if (nameSimilarity > 0.8) {
            score += nameSimilarity * 0.65
            reasons.push(`Very high basename similarity (${(nameSimilarity * 100).toFixed(0)}%)`)
          } else if (nameSimilarity > 0.6) {
            score += nameSimilarity * 0.45
            reasons.push(`Good basename similarity (${(nameSimilarity * 100).toFixed(0)}%)`)
          } else if (nameSimilarity > 0.4) {
            score += nameSimilarity * 0.25
            reasons.push(`Moderate basename similarity (${(nameSimilarity * 100).toFixed(0)}%)`)
          }
        }
      }
    }

    // Language/extension compatibility with improved scoring
    if (this.areLanguagesCompatible(generatedLang, genExt, existingLang, existExt)) {
      // Boost for exact language match
      if (generatedLang === existingLang || genExt === existExt) {
        score += 0.25
        reasons.push('Exact file type match')
      } else {
        score += 0.15
        reasons.push('Compatible file types')
      }
    } else {
      score -= 0.4 // Increased penalty for incompatible types
      reasons.push('Incompatible file types')
    }

    // Enhanced pattern matching
    const commonPatterns = [
      { pattern: /^(index|main|app)$/i, boost: 0.15, name: 'main file pattern' },
      { pattern: /^styles?$/i, boost: 0.12, name: 'styles file pattern' },
      { pattern: /component$/i, boost: 0.1, name: 'component pattern' },
      { pattern: /^(config|settings)$/i, boost: 0.1, name: 'config pattern' },
      { pattern: /^(utils?|helpers?)$/i, boost: 0.08, name: 'utility pattern' },
      { pattern: /^(hooks?|use[\w]+)$/i, boost: 0.08, name: 'hook pattern' }
    ]

    for (const { pattern, boost, name } of commonPatterns) {
      if (pattern.test(genBaseName) && pattern.test(existBaseName)) {
        score += boost
        reasons.push(`Both match ${name}`)
      }
    }

    // Directory structure analysis bonus
    const genDirParts = generatedName.split('/').filter(Boolean).slice(0, -1)
    const existDirParts = existingName.split('/').filter(Boolean).slice(0, -1)
    
    if (genDirParts.length > 0 && existDirParts.length > 0) {
      const commonDirs = genDirParts.filter(dir => existDirParts.includes(dir))
      const dirSimilarityRatio = commonDirs.length / Math.max(genDirParts.length, existDirParts.length)
      
      if (dirSimilarityRatio > 0.5) {
        score += dirSimilarityRatio * 0.1
        reasons.push(`Similar directory structure (${(dirSimilarityRatio * 100).toFixed(0)}% common dirs)`)
      }
    }

    return { score: Math.max(0, Math.min(1, score)), reasons }
  }

  /**
   * Find best matching existing file for a generated file
   */
  static findBestMatch(
    generatedFileName: string,
    generatedLanguage: string,
    existingFiles: Array<{
      id: string
      name: string
      path: string
      language: string
    }>,
    minConfidence: number = 0.4 // Lowered for better fallback detection
  ): FileMatchAnalysis {
    const allMatches: FileMatchResult[] = []

    // Score each existing file - use path for comparison, not just name
    for (const existingFile of existingFiles) {
      const { score, reasons } = this.scoreFileNameMatch(
        generatedFileName,
        existingFile.path, // Use path instead of name for better matching
        generatedLanguage,
        existingFile.language
      )

      if (score >= minConfidence) {
        allMatches.push({
          existingFile,
          confidence: score,
          reasons
        })
      }
    }

    // If no matches found, try fallback strategies
    if (allMatches.length === 0) {
      console.log(`[FileMatching] No matches found for "${generatedFileName}", trying fallback strategies`)
      
      // Fallback 1: Same basename different directory
      const genBaseName = this.getBaseName(generatedFileName).toLowerCase()
      for (const existingFile of existingFiles) {
        const existBaseName = this.getBaseName(existingFile.path).toLowerCase()
        if (genBaseName === existBaseName) {
          const nameSim = this.stringSimilarity(genBaseName, existBaseName)
          allMatches.push({
            existingFile,
            confidence: Math.max(0.6, nameSim), // Minimum confidence for exact basename match
            reasons: ['Fallback: exact basename match in different directory']
          })
        }
      }
      
      // Fallback 2: High basename similarity
      if (allMatches.length === 0) {
        for (const existingFile of existingFiles) {
          const existBaseName = this.getBaseName(existingFile.path).toLowerCase()
          const nameSim = this.stringSimilarity(genBaseName, existBaseName)
          
          if (nameSim > 0.75) {
            // Check if languages are at least compatible
            const genExt = this.getFileExtension(generatedFileName)
            const existExt = this.getFileExtension(existingFile.path)
            
            if (this.areLanguagesCompatible(generatedLanguage, genExt, existingFile.language, existExt)) {
              allMatches.push({
                existingFile,
                confidence: nameSim * 0.75, // Reduced confidence for fallback
                reasons: [`Fallback: high basename similarity (${(nameSim * 100).toFixed(0)}%) with compatible types`]
              })
            }
          }
        }
      }
      
      // Fallback 3: Pattern matching (e.g., App.tsx matching any App file)
      if (allMatches.length === 0) {
        const genPattern = genBaseName.replace(/[^a-z0-9]/gi, '').toLowerCase()
        if (genPattern.length >= 3) { // Only for meaningful names
          for (const existingFile of existingFiles) {
            const existBaseName = this.getBaseName(existingFile.path).toLowerCase()
            const existPattern = existBaseName.replace(/[^a-z0-9]/gi, '').toLowerCase()
            
            if (genPattern === existPattern) {
              allMatches.push({
                existingFile,
                confidence: 0.5, // Low confidence fallback
                reasons: ['Fallback: pattern match (alphanumeric characters only)']
              })
            }
          }
        }
      }
    }

    // Sort by confidence (highest first)
    allMatches.sort((a, b) => b.confidence - a.confidence)

    const bestMatch = allMatches[0]
    
    // Dynamic shouldUpdate threshold based on confidence and match quality
    let shouldUpdateThreshold = 0.65 // More aggressive than before
    
    // Lower threshold for high-confidence matches
    if (bestMatch && bestMatch.confidence > 0.85) {
      shouldUpdateThreshold = 0.6
    }
    // Higher threshold for fallback matches
    if (bestMatch && bestMatch.reasons.some(r => r.includes('Fallback'))) {
      shouldUpdateThreshold = 0.7
    }
    
    const shouldUpdate = bestMatch && bestMatch.confidence > shouldUpdateThreshold
    
    console.log(`Best match for "${generatedFileName}":`, {
      found: !!bestMatch,
      confidence: bestMatch?.confidence,
      shouldUpdate,
      threshold: shouldUpdateThreshold,
      matchedFile: bestMatch?.existingFile.path,
      totalMatches: allMatches.length,
      reasons: bestMatch?.reasons
    })

    return {
      bestMatch,
      allMatches,
      shouldUpdate,
      confidence: bestMatch?.confidence || 0
    }
  }

  /**
   * Find matches for multiple generated files
   */
  static findMatches(
    generatedFiles: Array<{
      name: string
      language: string
      content: string
    }>,
    existingFiles: Array<{
      id: string
      name: string
      path: string
      language: string
    }>
  ): Map<string, FileMatchAnalysis> {
    const results = new Map<string, FileMatchAnalysis>()

    for (const generatedFile of generatedFiles) {
      const analysis = this.findBestMatch(
        generatedFile.name,
        generatedFile.language,
        existingFiles
      )
      results.set(generatedFile.name, analysis)
    }

    return results
  }

  /**
   * Analyze path-based matching for more context
   */
  static analyzePathContext(
    generatedPath: string,
    existingFiles: Array<{
      id: string
      name: string
      path: string
      language: string
    }>
  ): FileMatchResult[] {
    const matches: FileMatchResult[] = []
    const normalizedGenPath = generatedPath.toLowerCase()

    for (const existingFile of existingFiles) {
      const normalizedExistPath = existingFile.path.toLowerCase()
      
      // Exact path match
      if (normalizedGenPath === normalizedExistPath) {
        matches.push({
          existingFile,
          confidence: 0.95,
          reasons: ['Exact path match']
        })
        continue
      }

      // Directory path similarity
      const genDir = generatedPath.substring(0, generatedPath.lastIndexOf('/'))
      const existDir = existingFile.path.substring(0, existingFile.path.lastIndexOf('/'))
      
      if (genDir && genDir === existDir) {
        const pathSim = this.stringSimilarity(normalizedGenPath, normalizedExistPath)
        if (pathSim > 0.5) {
          matches.push({
            existingFile,
            confidence: pathSim * 0.7,
            reasons: [`Same directory, path similarity: ${(pathSim * 100).toFixed(0)}%`]
          })
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence)
  }
}