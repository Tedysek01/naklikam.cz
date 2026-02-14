/**
 * Comprehensive tests for duplicate file detection and prevention
 * Tests all implemented solutions for eliminating duplicate files
 */

import { DuplicateDetector } from '../duplicateDetection'
import PathUtils from '../pathUtils'
import { ProjectFile } from '@/types'
import { DuplicateLogger } from '../duplicateLogger'

// Mock project files for testing
const mockExistingFiles: ProjectFile[] = [
  {
    id: '1',
    name: 'App.tsx',
    path: '/src/App.tsx',
    content: 'import React from "react";\nexport default function App() { return <div>Hello</div> }',
    language: 'typescript',
    isDirectory: false
  },
  {
    id: '2',
    name: 'index.tsx',
    path: '/src/index.tsx',
    content: 'import React from "react";\nimport ReactDOM from "react-dom";',
    language: 'typescript',
    isDirectory: false
  },
  {
    id: '3',
    name: 'utils.ts',
    path: '/src/utils/utils.ts',
    content: 'export const formatDate = (date: Date) => date.toISOString()',
    language: 'typescript',
    isDirectory: false
  },
  {
    id: '4',
    name: 'Button.tsx',
    path: '/src/components/Button.tsx',
    content: 'import React from "react";\nexport const Button = () => <button>Click me</button>',
    language: 'typescript',
    isDirectory: false
  }
]

describe('DuplicateDetector', () => {
  beforeEach(() => {
    DuplicateLogger.resetMetrics()
  })

  describe('Exact Match Detection', () => {
    test('should detect exact path and name match', () => {
      const newFile = {
        name: 'App.tsx',
        path: '/src/App.tsx',
        content: 'Different content',
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')

      expect(result.isDuplicate).toBe(true)
      expect(result.exactMatch).toBe(true)
      expect(result.recommendedAction).toBe('update')
      expect(result.matchingFile?.id).toBe('1')
      expect(result.reason).toContain('Exact path and name match')
    })

    test('should recommend skip for identical content', () => {
      const newFile = {
        name: 'App.tsx',
        path: '/src/App.tsx',
        content: 'import React from "react";\nexport default function App() { return <div>Hello</div> }',
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')

      expect(result.isDuplicate).toBe(true)
      expect(result.recommendedAction).toBe('skip')
    })
  })

  describe('Path Normalization', () => {
    test('should handle leading slash inconsistencies', () => {
      const newFile1 = {
        name: 'App.tsx',
        path: 'src/App.tsx', // No leading slash
        content: 'New content',
        language: 'typescript',
        isDirectory: false
      }

      const result1 = DuplicateDetector.analyzeFile(newFile1, mockExistingFiles, 'test-project')
      expect(result1.isDuplicate).toBe(true)
      expect(result1.recommendedAction).toBe('update')

      const newFile2 = {
        name: 'App.tsx',
        path: '//src//App.tsx', // Multiple slashes
        content: 'New content',
        language: 'typescript',
        isDirectory: false
      }

      const result2 = DuplicateDetector.analyzeFile(newFile2, mockExistingFiles, 'test-project')
      expect(result2.isDuplicate).toBe(true)
      expect(result2.recommendedAction).toBe('update')
    })

    test('should handle case sensitivity correctly', () => {
      const newFile = {
        name: 'APP.TSX', // Different case
        path: '/SRC/APP.TSX',
        content: 'New content',
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')
      expect(result.isDuplicate).toBe(true)
    })
  })

  describe('Content-Based Detection', () => {
    test('should detect identical content with different paths', () => {
      const newFile = {
        name: 'NewApp.tsx',
        path: '/components/NewApp.tsx',
        content: 'import React from "react";\nexport default function App() { return <div>Hello</div> }', // Same as existing App.tsx
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')
      expect(result.isDuplicate).toBe(true)
      expect(result.contentSimilarity).toBeGreaterThan(0.95)
      expect(result.recommendedAction).toBe('update')
    })

    test('should ignore very short content', () => {
      const shortFiles = [...mockExistingFiles, {
        id: '5',
        name: 'short.ts',
        path: '/src/short.ts',
        content: 'x',
        language: 'typescript',
        isDirectory: false
      }]

      const newFile = {
        name: 'another.ts',
        path: '/src/another.ts',
        content: 'x', // Same very short content
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, shortFiles, 'test-project')
      expect(result.recommendedAction).toBe('create_new') // Should not match due to short content
    })
  })

  describe('Fuzzy Path Matching', () => {
    test('should handle similar paths with high confidence', () => {
      const newFile = {
        name: 'Button.tsx',
        path: '/src/ui/Button.tsx', // Different directory but same filename
        content: 'New button implementation',
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')
      expect(result.isDuplicate).toBe(true)
      expect(result.pathSimilarity).toBeGreaterThan(0.5)
    })

    test('should handle filename variations', () => {
      const newFile = {
        name: 'button.tsx', // Lowercase
        path: '/src/components/button.tsx',
        content: 'Button component',
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')
      expect(result.isDuplicate).toBe(true)
    })
  })

  describe('No Duplicates', () => {
    test('should allow genuinely new files', () => {
      const newFile = {
        name: 'NewComponent.tsx',
        path: '/src/components/NewComponent.tsx',
        content: 'export const NewComponent = () => <div>New!</div>',
        language: 'typescript',
        isDirectory: false
      }

      const result = DuplicateDetector.analyzeFile(newFile, mockExistingFiles, 'test-project')
      expect(result.isDuplicate).toBe(false)
      expect(result.recommendedAction).toBe('create_new')
    })
  })

  describe('Batch Analysis', () => {
    test('should handle multiple files correctly', () => {
      const newFiles = [
        {
          name: 'App.tsx',
          path: '/src/App.tsx',
          content: 'Updated app',
          language: 'typescript',
          isDirectory: false
        },
        {
          name: 'NewFile.tsx',
          path: '/src/NewFile.tsx',
          content: 'Brand new file',
          language: 'typescript',
          isDirectory: false
        },
        {
          name: 'Button.tsx',
          path: 'src/components/Button.tsx', // Different normalization
          content: 'Updated button',
          language: 'typescript',
          isDirectory: false
        }
      ]

      const results = DuplicateDetector.batchAnalyze(newFiles, mockExistingFiles)

      expect(results.size).toBe(3)

      // Check that duplicates are detected
      const appAnalysis = results.get('/src/App.tsx:App.tsx')
      expect(appAnalysis?.isDuplicate).toBe(true)
      expect(appAnalysis?.recommendedAction).toBe('update')

      // Check that new files are allowed
      const newFileAnalysis = results.get('/src/NewFile.tsx:NewFile.tsx')
      expect(newFileAnalysis?.isDuplicate).toBe(false)
      expect(newFileAnalysis?.recommendedAction).toBe('create_new')

      // Check path normalization
      const buttonAnalysis = results.get('/src/components/Button.tsx:Button.tsx')
      expect(buttonAnalysis?.isDuplicate).toBe(true)
    })
  })

  describe('Performance and Metrics', () => {
    test('should track metrics correctly', () => {
      const initialMetrics = DuplicateLogger.getMetrics()
      
      // Perform several detections
      DuplicateDetector.analyzeFile({
        name: 'App.tsx',
        path: '/src/App.tsx',
        content: 'Updated',
        language: 'typescript',
        isDirectory: false
      }, mockExistingFiles, 'test-project')

      DuplicateDetector.analyzeFile({
        name: 'New.tsx',
        path: '/src/New.tsx',
        content: 'New file',
        language: 'typescript',
        isDirectory: false
      }, mockExistingFiles, 'test-project')

      const updatedMetrics = DuplicateLogger.getMetrics()
      expect(updatedMetrics.totalDetections).toBeGreaterThan(initialMetrics.totalDetections)
      expect(updatedMetrics.updateActions).toBeGreaterThan(initialMetrics.updateActions)
    })

    test('should log performance metrics', () => {
      DuplicateDetector.analyzeFile({
        name: 'TestFile.tsx',
        path: '/src/TestFile.tsx',
        content: 'Test content',
        language: 'typescript',
        isDirectory: false
      }, mockExistingFiles, 'test-project')

      const recentLogs = DuplicateLogger.getRecentLogs(10, 'DEBUG')
      const perfLogs = recentLogs.filter(log => log.category === 'PERFORMANCE')
      
      expect(perfLogs.length).toBeGreaterThan(0)
    })
  })
})

describe('PathUtils Enhanced Features', () => {
  describe('Path Normalization', () => {
    test('should normalize paths consistently', () => {
      expect(PathUtils.normalize('/src/App.tsx')).toBe('/src/app.tsx')
      expect(PathUtils.normalize('src/App.tsx')).toBe('/src/app.tsx')
      expect(PathUtils.normalize('//src///App.tsx')).toBe('/src/app.tsx')
      expect(PathUtils.normalize('src\\App.tsx')).toBe('/src/app.tsx')
    })

    test('should preserve case when requested', () => {
      expect(PathUtils.normalize('/src/App.tsx', { preserveCase: true })).toBe('/src/App.tsx')
    })

    test('should handle edge cases', () => {
      expect(PathUtils.normalize('')).toBe('/')
      expect(PathUtils.normalize('/')).toBe('/')
      expect(PathUtils.normalize('   ')).toBe('/')
    })
  })

  describe('Path Equivalence', () => {
    test('should detect equivalent paths with flexible options', () => {
      expect(PathUtils.areEquivalent('/src/App.tsx', 'src/App.tsx', {
        ignoreLeadingSlash: true
      })).toBe(true)

      expect(PathUtils.areEquivalent('/src/App.tsx', '/SRC/APP.TSX', {
        ignoreCase: true
      })).toBe(true)

      expect(PathUtils.areEquivalent('/src/App.tsx/', '/src/App.tsx', {
        ignoreTrailingSlash: true
      })).toBe(true)
    })
  })

  describe('Path Similarity', () => {
    test('should calculate similarity correctly', () => {
      expect(PathUtils.calculateSimilarity('/src/App.tsx', '/src/App.tsx')).toBe(1.0)
      expect(PathUtils.calculateSimilarity('/src/App.tsx', '/components/App.tsx')).toBeGreaterThan(0.5)
      expect(PathUtils.calculateSimilarity('/src/App.tsx', '/src/Button.tsx')).toBeGreaterThan(0.3)
      expect(PathUtils.calculateSimilarity('/src/App.tsx', '/completely/different/file.js')).toBeLessThan(0.3)
    })
  })
})

describe('Integration Tests', () => {
  test('should prevent duplicates in realistic scenario', () => {
    // Simulate AI generating files that might be duplicates
    const aiGeneratedFiles = [
      {
        name: 'App.tsx',
        path: '/src/App.tsx', // Exact match
        content: 'Updated App component',
        language: 'typescript',
        isDirectory: false
      },
      {
        name: 'app.tsx',
        path: 'src/app.tsx', // Case and leading slash difference
        content: 'Another App component',
        language: 'typescript',
        isDirectory: false
      },
      {
        name: 'Button.tsx',
        path: '/components/Button.tsx', // Different directory
        content: 'import React from "react";\nexport const Button = () => <button>Click me</button>', // Same content
        language: 'typescript',
        isDirectory: false
      },
      {
        name: 'Header.tsx',
        path: '/src/components/Header.tsx', // Genuinely new
        content: 'export const Header = () => <header>Header</header>',
        language: 'typescript',
        isDirectory: false
      }
    ]

    const results = aiGeneratedFiles.map(file => 
      DuplicateDetector.analyzeFile(file, mockExistingFiles, 'integration-test')
    )

    // Should detect App.tsx as duplicate for update
    expect(results[0].isDuplicate).toBe(true)
    expect(results[0].recommendedAction).toBe('update')

    // Should detect app.tsx as duplicate (case/path normalization)
    expect(results[1].isDuplicate).toBe(true)
    expect(results[1].recommendedAction).toBe('update')

    // Should detect Button.tsx as duplicate (content similarity)
    expect(results[2].isDuplicate).toBe(true)
    expect(results[2].recommendedAction).toBe('update')

    // Should allow Header.tsx as new
    expect(results[3].isDuplicate).toBe(false)
    expect(results[3].recommendedAction).toBe('create_new')
  })

  test('should generate comprehensive debug report', () => {
    // Generate some activity
    for (let i = 0; i < 5; i++) {
      DuplicateDetector.analyzeFile({
        name: `File${i}.tsx`,
        path: `/src/File${i}.tsx`,
        content: i % 2 === 0 ? 'duplicate content' : `unique content ${i}`,
        language: 'typescript',
        isDirectory: false
      }, mockExistingFiles, 'debug-test')
    }

    const report = DuplicateLogger.generateDebugReport('debug-test')

    expect(report.summary.projectId).toBe('debug-test')
    expect(report.summary.totalLogs).toBeGreaterThan(0)
    expect(report.metrics.totalDetections).toBe(5)
    expect(report.recommendations).toBeInstanceOf(Array)
    expect(report.recommendations.length).toBeGreaterThan(0)
  })
})

describe('Error Handling and Edge Cases', () => {
  test('should handle empty file lists', () => {
    const result = DuplicateDetector.analyzeFile({
      name: 'Test.tsx',
      path: '/src/Test.tsx',
      content: 'test',
      language: 'typescript',
      isDirectory: false
    }, [])

    expect(result.isDuplicate).toBe(false)
    expect(result.recommendedAction).toBe('create_new')
  })

  test('should handle malformed file data', () => {
    const malformedFiles = [
      {
        id: 'bad1',
        name: '',
        path: '',
        content: '',
        language: 'unknown',
        isDirectory: false
      },
      {
        id: 'bad2',
        name: 'test',
        path: null as any,
        content: undefined as any,
        language: '',
        isDirectory: false
      }
    ]

    expect(() => {
      DuplicateDetector.analyzeFile({
        name: 'Test.tsx',
        path: '/src/Test.tsx',
        content: 'test',
        language: 'typescript',
        isDirectory: false
      }, malformedFiles)
    }).not.toThrow()
  })
})

export {}