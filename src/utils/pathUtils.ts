/**
 * Path Utilities - Centralized path handling for consistent behavior
 */

export class PathUtils {
  /**
   * Normalize path to standard format: /path/file.ext
   * Removes duplicate slashes, ensures leading slash, preserves case for file extensions
   */
  static normalize(path: string, options: { preserveCase?: boolean } = {}): string {
    if (!path) return '/'
    
    // Remove leading/trailing whitespace
    let normalized = path.trim()
    
    // Handle empty string after trim
    if (!normalized) return '/'
    
    // Convert Windows-style backslashes to forward slashes
    normalized = normalized.replace(/\\/g, '/')
    
    // Remove multiple consecutive slashes
    normalized = normalized.replace(/\/+/g, '/')
    
    // Ensure leading slash for absolute paths
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }
    
    // Remove trailing slash unless it's root
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }
    
    // Case handling - preserve case for file extensions but normalize directory names
    if (!options.preserveCase) {
      const segments = normalized.split('/')
      const processedSegments = segments.map((segment, index) => {
        // Keep root empty segment as is
        if (index === 0 && segment === '') return segment
        
        // For file extensions, preserve case of extension but lowercase name
        const dotIndex = segment.lastIndexOf('.')
        if (dotIndex > 0 && index === segments.length - 1) {
          // Last segment with extension - preserve extension case
          const name = segment.substring(0, dotIndex).toLowerCase()
          const extension = segment.substring(dotIndex) // Keep original case
          return name + extension
        } else {
          // Directory names to lowercase
          return segment.toLowerCase()
        }
      })
      normalized = processedSegments.join('/')
    }
    
    return normalized
  }

  /**
   * Get parent directory path
   */
  static getParentPath(path: string): string {
    const normalized = this.normalize(path)
    const lastSlash = normalized.lastIndexOf('/')
    
    if (lastSlash <= 0) return '/'
    return normalized.substring(0, lastSlash)
  }

  /**
   * Get filename from path (last segment)
   */
  static getFileName(path: string): string {
    const normalized = this.normalize(path)
    const segments = normalized.split('/').filter(Boolean)
    return segments[segments.length - 1] || ''
  }

  /**
   * Get file extension
   */
  static getExtension(path: string): string {
    const fileName = this.getFileName(path)
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(lastDot + 1) : ''
  }

  /**
   * Get base name without extension
   */
  static getBaseName(path: string): string {
    const fileName = this.getFileName(path)
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName
  }

  /**
   * Join path segments
   */
  static join(...segments: string[]): string {
    const joined = segments
      .filter(segment => segment && segment.length > 0)
      .join('/')
    
    return this.normalize(joined)
  }

  /**
   * Check if path is a directory path (ends with / or is a known directory)
   */
  static isDirectory(path: string, hasExtension?: boolean): boolean {
    const normalized = this.normalize(path)
    
    // If explicitly told it has no extension, it's likely a directory
    if (hasExtension === false) return true
    
    // Common directory patterns
    const directoryPatterns = [
      'components', 'pages', 'hooks', 'utils', 'types', 
      'services', 'store', 'assets', 'styles', 'public',
      'src', 'lib', 'api', 'data'
    ]
    
    const fileName = this.getFileName(normalized)
    return directoryPatterns.includes(fileName) || !fileName.includes('.')
  }

  /**
   * Get all path segments
   */
  static getSegments(path: string): string[] {
    const normalized = this.normalize(path)
    return normalized.split('/').filter(Boolean)
  }

  /**
   * Check if one path is ancestor of another
   */
  static isAncestor(ancestorPath: string, descendantPath: string): boolean {
    const ancestor = this.normalize(ancestorPath)
    const descendant = this.normalize(descendantPath)
    
    return descendant.startsWith(ancestor + '/') || 
           (ancestor === '/' && descendant !== '/')
  }

  /**
   * Get relative path from base to target
   */
  static getRelativePath(basePath: string, targetPath: string): string {
    const base = this.normalize(basePath)
    const target = this.normalize(targetPath)
    
    if (target.startsWith(base)) {
      const relative = target.substring(base.length)
      return relative.startsWith('/') ? relative.substring(1) : relative
    }
    
    return target
  }

  /**
   * Validate path format
   */
  static isValid(path: string): boolean {
    if (!path || typeof path !== 'string') return false
    
    // Check for invalid characters (only basic validation)
    const invalidChars = /[<>:"|?*\x00-\x1f]/
    return !invalidChars.test(path)
  }

  /**
   * Convert Windows-style path to Unix-style
   */
  static toUnixStyle(path: string): string {
    if (!path) return ''
    return path.replace(/\\/g, '/')
  }

  /**
   * Generate unique path by adding suffix if path exists
   */
  static makeUnique(path: string, existingPaths: string[]): string {
    const normalized = this.normalize(path)
    const existing = existingPaths.map(p => this.normalize(p))
    
    if (!existing.includes(normalized)) {
      return normalized
    }
    
    const baseName = this.getBaseName(normalized)
    const extension = this.getExtension(normalized)
    const parentPath = this.getParentPath(normalized)
    
    let counter = 1
    let uniquePath: string
    
    do {
      const newName = extension ? 
        `${baseName}_${counter}.${extension}` : 
        `${baseName}_${counter}`
      
      uniquePath = this.join(parentPath, newName)
      counter++
    } while (existing.includes(uniquePath) && counter < 1000)
    
    return uniquePath
  }

  /**
   * Compare two paths for equivalence with various normalization strategies
   */
  static areEquivalent(path1: string, path2: string, options: {
    ignoreCase?: boolean
    ignoreLeadingSlash?: boolean
    ignoreTrailingSlash?: boolean
  } = {}): boolean {
    if (!path1 || !path2) return path1 === path2

    let p1 = path1.trim()
    let p2 = path2.trim()

    // Apply normalization options
    if (options.ignoreLeadingSlash) {
      p1 = p1.replace(/^\/+/, '')
      p2 = p2.replace(/^\/+/, '')
    }

    if (options.ignoreTrailingSlash) {
      p1 = p1.replace(/\/+$/, '')
      p2 = p2.replace(/\/+$/, '')
    }

    if (options.ignoreCase) {
      p1 = p1.toLowerCase()
      p2 = p2.toLowerCase()
    }

    // Normalize slashes
    p1 = p1.replace(/\\/g, '/').replace(/\/+/g, '/')
    p2 = p2.replace(/\\/g, '/').replace(/\/+/g, '/')

    return p1 === p2
  }

  /**
   * Calculate path similarity score (0-1)
   */
  static calculateSimilarity(path1: string, path2: string): number {
    if (!path1 || !path2) return 0
    if (path1 === path2) return 1

    const norm1 = this.normalize(path1)
    const norm2 = this.normalize(path2)

    if (norm1 === norm2) return 1

    // Segment-based comparison
    const segments1 = this.getSegments(norm1)
    const segments2 = this.getSegments(norm2)

    const maxSegments = Math.max(segments1.length, segments2.length)
    const minSegments = Math.min(segments1.length, segments2.length)

    if (maxSegments === 0) return 1

    // Count matching segments from end (filename is most important)
    let matchingSegments = 0
    for (let i = 0; i < minSegments; i++) {
      const seg1 = segments1[segments1.length - 1 - i]
      const seg2 = segments2[segments2.length - 1 - i]
      
      if (seg1 === seg2) {
        matchingSegments++
      } else {
        // Allow partial filename matches
        if (i === 0) { // Last segment (filename)
          const similarity = this.calculateStringSimilarity(seg1, seg2)
          matchingSegments += similarity
        }
        break
      }
    }

    return matchingSegments / maxSegments
  }

  /**
   * Calculate string similarity using character-based comparison
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1

    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1

    // Calculate edit distance approximation
    let matches = 0
    for (let i = 0; i < shorter.length; i++) {
      if (longer[i] === shorter[i]) {
        matches++
      }
    }

    return matches / longer.length
  }
}

export default PathUtils