import { Check, ChevronDown, Zap, Clock, Brain } from 'lucide-react'
import { useState } from 'react'

export type ModelType = 'sonnet' | 'haiku'

interface ModelSelectorProps {
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
  disabled?: boolean
}

const models = [
  {
    id: 'sonnet' as ModelType,
    name: 'Claude Sonnet 4',
    description: 'Nejlepší kvalita pro komplexní projekty',
    icon: Brain,
    badges: ['Nejlepší', 'Komplexní kód'],
    cost: 'Vyšší náklady',
    costColor: 'text-naklikam-purple-600'
  },
  {
    id: 'haiku' as ModelType,
    name: 'Claude Haiku 3.5',
    description: 'Rychlý a levný pro jednoduché úkoly',
    icon: Clock,
    badges: ['Rychlý', 'Levný'],
    cost: '4x levnější',
    costColor: 'text-naklikam-pink-600'
  }
]

export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedModelData = models.find(m => m.id === selectedModel)!
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
          transition-colors min-w-[180px] justify-between
          ${disabled 
            ? 'bg-muted text-muted-foreground cursor-not-allowed border-border' 
            : 'bg-card hover:bg-naklikam-pink-900/10 text-foreground hover:text-naklikam-pink-300 border-border hover:border-naklikam-pink-500 hover:shadow-md hover:shadow-naklikam-pink-500/10'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <selectedModelData.icon className="h-4 w-4" />
          <span className="truncate">{selectedModelData.name}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute bottom-full left-0 mb-1 w-80 bg-background rounded-lg shadow-lg border border-border z-20 py-2 max-h-80 overflow-y-auto">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-4 py-3 text-left hover:bg-naklikam-pink-900/10 hover:border-l-2 hover:border-naklikam-pink-400 transition-colors
                  ${selectedModel === model.id ? 'bg-naklikam-pink-900/20 border-l-4 border-naklikam-pink-500' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <model.icon className={`h-5 w-5 mt-0.5 ${
                      selectedModel === model.id ? 'text-naklikam-pink-600' : 'text-muted-foreground'
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${
                          selectedModel === model.id ? 'text-naklikam-pink-900' : 'text-foreground'
                        }`}>
                          {model.name}
                        </h4>
                        {selectedModel === model.id && (
                          <Check className="h-4 w-4 text-naklikam-pink-600" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {model.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-2">
                        {model.badges.map((badge) => (
                          <span 
                            key={badge}
                            className={`px-2 py-1 text-xs rounded-full ${
                              selectedModel === model.id 
                                ? 'bg-naklikam-pink-100 text-naklikam-pink-700' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Zap className={`h-3 w-3 ${model.costColor}`} />
                        <span className={`text-xs font-medium ${model.costColor}`}>
                          {model.cost}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            <div className="px-4 py-2 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Sonnet pro nové projekty, Haiku pro úpravy a opravy
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}