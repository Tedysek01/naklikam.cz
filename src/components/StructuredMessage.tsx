import { useState } from 'react'
import { StructuredResponse } from '@/types'

// Inline UI Components
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'lg' ? 'px-8 py-4 text-lg' : size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-pink-500/50 bg-transparent text-pink-400 hover:bg-pink-500/10 hover:border-pink-500' :
      variant === 'ghost' ? 'text-pink-300 hover:bg-pink-500/10' :
      'bg-naklikam-gradient text-white hover:bg-naklikam-gradient-dark'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)
import FileCard from '@/components/FileCard'
import { 
  CheckCircle,
  Download,
  Info, 
  ChevronDown, 
  ChevronRight,
  Code,
  Lightbulb,
  Users
} from 'lucide-react'

interface StructuredMessageProps {
  response: StructuredResponse
  onFileAction?: (file: any, action: 'copy' | 'add' | 'download') => void
  onAddAllFiles?: () => void
}

export default function StructuredMessage({ 
  response, 
  onFileAction, 
  onAddAllFiles 
}: StructuredMessageProps) {
  const [showFeatures, setShowFeatures] = useState(true)
  const [showInstructions, setShowInstructions] = useState(true)

  const getTypeIcon = () => {
    switch (response.type) {
      case 'code_generation':
        return <Code className="h-4 w-4" />
      case 'explanation':
        return <Lightbulb className="h-4 w-4" />
      case 'conversation':
        return <Users className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (response.type) {
      case 'code_generation':
        return 'text-green-400 bg-green-900/20 border-green-700'
      case 'explanation':
        return 'text-purple-400 bg-purple-900/20 border-purple-700'
      case 'conversation':
        return 'text-purple-400 bg-purple-900/20 border-purple-700'
      default:
        return 'text-gray-400 bg-gray-800 border-gray-700'
    }
  }

  const getComplexityColor = () => {
    switch (response.metadata?.complexity) {
      case 'low':
        return 'text-green-400 bg-green-900/50'
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/50'
      case 'high':
        return 'text-red-400 bg-red-900/50'
      default:
        return 'text-gray-400 bg-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Message */}
      <div className={`p-4 border-l-4 rounded-lg bg-gray-800/50 ${getTypeColor()}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
                {response.type.replace('_', ' ').toUpperCase()}
              </span>
              {response.metadata?.complexity && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor()}`}>
                  {response.metadata.complexity.toUpperCase()}
                </span>
              )}
              {response.metadata?.intent && (
                <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-400 bg-purple-900/50">
                  {response.metadata.intent.toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="font-semibold font-display text-foreground mb-2">{response.message}</h3>
            {response.description && (
              <p className="text-sm text-muted-foreground">{response.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      {response.features && response.features.length > 0 && (
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="flex items-center gap-2 w-full text-left mb-3 hover:text-purple-400 transition-colors"
          >
            {showFeatures ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-semibold font-display">✨ Funkce ({response.features.length})</span>
          </button>
          
          {showFeatures && (
            <ul className="space-y-2">
              {response.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Files Section */}
      {response.files && response.files.length > 0 && (
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold font-display flex items-center gap-2">
              <Code className="h-4 w-4" />
              Soubory ({response.files.length})
            </h4>
            {response.files.length > 1 && onAddAllFiles && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddAllFiles}
                className="text-green-400 border-green-700 hover:bg-green-900/20"
              >
                <Download className="h-3 w-3 mr-1" />
                Přidat všechny
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {response.files.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onAction={onFileAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions Section */}
      {response.instructions && (
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 w-full text-left mb-3 hover:text-purple-400 transition-colors"
          >
            {showInstructions ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-semibold font-display">📋 Instrukce</span>
          </button>
          
          {showInstructions && (
            <div className="text-sm text-muted-foreground bg-gray-900/50 p-3 rounded-lg">
              {response.instructions}
            </div>
          )}
        </div>
      )}
    </div>
  )
}