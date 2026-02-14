import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/store/projectStore'
import { DuplicateCleanup, CleanupAnalysis, CleanupRecommendation } from '@/utils/duplicateCleanup'
import { DuplicateLogger } from '@/utils/duplicateLogger'
import { Trash2, AlertTriangle, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ProjectCleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export default function ProjectCleanupDialog({ open, onOpenChange, projectId }: ProjectCleanupDialogProps) {
  const { currentProject, deleteProjectFile } = useProjectStore()
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set())
  const [cleanupResult, setCleanupResult] = useState<{
    deleted: number
    errors: string[]
    summary: string
  } | null>(null)

  // Analyze project when dialog opens
  useEffect(() => {
    if (open && currentProject && currentProject.id === projectId) {
      analyzeProject()
    }
  }, [open, currentProject, projectId])

  const analyzeProject = async () => {
    if (!currentProject) return

    setIsAnalyzing(true)
    setAnalysis(null)
    setCleanupResult(null)

    try {
      console.log('[ProjectCleanup] Starting analysis...')
      const result = await DuplicateCleanup.analyzeProject(currentProject.id, currentProject.files)
      setAnalysis(result)

      // Auto-select safe deletions
      const safeDeletionSet = new Set(
        result.recommendations
          .filter(rec => rec.type === 'delete' && rec.confidence > 0.9)
          .map(rec => rec.fileId)
      )
      setSelectedRecommendations(safeDeletionSet)

      console.log('[ProjectCleanup] Analysis complete:', {
        duplicateGroups: result.duplicateGroups.length,
        safeDeletions: result.safeDeletions.length,
        conflicts: result.conflictResolutions.length
      })

    } catch (error) {
      console.error('[ProjectCleanup] Analysis failed:', error)
      DuplicateLogger.logError('CLEANUP_ANALYSIS', 'Project analysis failed', 
        error instanceof Error ? error : new Error(String(error)), {
          projectId: currentProject.id
        })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const executeCleanup = async () => {
    if (!analysis || !currentProject) return

    setIsCleaningUp(true)

    try {
      const filesToDelete = Array.from(selectedRecommendations)
      console.log(`[ProjectCleanup] Executing cleanup: ${filesToDelete.length} files to delete`)

      // Delete files one by one
      let deleted = 0
      const errors: string[] = []

      for (const fileId of filesToDelete) {
        try {
          await deleteProjectFile(fileId)
          deleted++
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push(`Failed to delete file ${fileId}: ${errorMsg}`)
          console.error(`[ProjectCleanup] Failed to delete file ${fileId}:`, error)
        }
      }

      const summary = `Cleanup completed: ${deleted} files deleted, ${errors.length} errors`
      setCleanupResult({ deleted, errors, summary })

      DuplicateLogger.logBatchProcessing(currentProject.id, filesToDelete.length, {
        successful: deleted,
        skipped: 0,
        errors: errors.length
      })

      console.log('[ProjectCleanup] Cleanup completed:', { deleted, errors: errors.length })

    } catch (error) {
      console.error('[ProjectCleanup] Cleanup failed:', error)
      setCleanupResult({
        deleted: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        summary: 'Cleanup failed'
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  const toggleRecommendation = (fileId: string) => {
    const newSelected = new Set(selectedRecommendations)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedRecommendations(newSelected)
  }

  const getRecommendationIcon = (type: CleanupRecommendation['type']) => {
    switch (type) {
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />
      case 'merge': return <FileText className="w-4 h-4 text-orange-500" />
      case 'review': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence > 0.9) return <Badge variant="destructive">High</Badge>
    if (confidence > 0.7) return <Badge variant="secondary">Medium</Badge>
    return <Badge variant="outline">Low</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              🧹 Project Cleanup - Duplicate Files
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyze and remove duplicate files from your project
            </p>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {isAnalyzing && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
                <span className="text-gray-600">Analyzing project for duplicates...</span>
              </div>
            )}

            {analysis && !isAnalyzing && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysis.totalFiles}</div>
                    <div className="text-sm text-blue-800">Total Files</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analysis.duplicateGroups.length}</div>
                    <div className="text-sm text-red-800">Duplicate Groups</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysis.safeDeletions.length}</div>
                    <div className="text-sm text-green-800">Safe Deletions</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analysis.conflictResolutions.length}</div>
                    <div className="text-sm text-orange-800">Conflicts</div>
                  </div>
                </div>

                {/* Cleanup Results */}
                {cleanupResult && (
                  <div className={`p-4 rounded-lg ${cleanupResult.errors.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center mb-2">
                      {cleanupResult.errors.length > 0 ? (
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      )}
                      <span className="font-medium">
                        {cleanupResult.summary}
                      </span>
                    </div>
                    {cleanupResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-red-600 mb-1">Errors:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {cleanupResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && !cleanupResult && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Recommendations ({selectedRecommendations.size} selected)
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {analysis.recommendations.map((rec, index) => (
                        <div key={`${rec.fileId}-${index}`} 
                             className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                               selectedRecommendations.has(rec.fileId) 
                                 ? 'border-blue-300 bg-blue-50' 
                                 : 'border-gray-200 hover:border-gray-300'
                             }`}
                             onClick={() => toggleRecommendation(rec.fileId)}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {getRecommendationIcon(rec.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {rec.filePath}
                                  </code>
                                  {getConfidenceBadge(rec.confidence)}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                                <p className="text-xs text-gray-500 mt-1">{rec.action}</p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedRecommendations.has(rec.fileId)}
                              onChange={() => toggleRecommendation(rec.fileId)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflicts requiring manual review */}
                {analysis.conflictResolutions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                      Manual Review Required
                    </h3>
                    <div className="space-y-3">
                      {analysis.conflictResolutions.map((conflict, index) => (
                        <div key={index} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                            <span className="font-medium text-orange-800">
                              {conflict.conflictType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-orange-700 mb-2">{conflict.recommendedAction}</p>
                          <div className="text-sm text-orange-600">
                            <strong>Files involved:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {conflict.files.map(file => (
                                <li key={file.id} className="font-mono">{file.path}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No duplicates found */}
                {analysis.duplicateGroups.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found!</h3>
                    <p className="text-gray-600">Your project is already clean - no duplicate files detected.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAnalyzing || isCleaningUp}
            >
              Close
            </Button>
            
            <div className="flex space-x-3">
              {analysis && !cleanupResult && (
                <Button
                  variant="outline"
                  onClick={analyzeProject}
                  disabled={isAnalyzing || isCleaningUp}
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Re-analyze
                </Button>
              )}
              
              {analysis && selectedRecommendations.size > 0 && !cleanupResult && (
                <Button
                  onClick={executeCleanup}
                  disabled={isAnalyzing || isCleaningUp}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isCleaningUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete Selected ({selectedRecommendations.size})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export { ProjectCleanupDialog }