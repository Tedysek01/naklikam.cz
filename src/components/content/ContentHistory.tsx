import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { generatedContentService, GeneratedContent } from '@/services/generatedContentService'
import { useToast } from '@/hooks/use-toast'
import { FileText, Image as ImageIcon, Video, Trash2, Download, Copy, Calendar, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', disabled = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 
      size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
    } ${
      variant === 'outline' ? 'border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white' :
      variant === 'ghost' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' :
      variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' :
      'bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
)

const ContentHistory = () => {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [contents, setContents] = useState<GeneratedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video'>('all')
  const [stats, setStats] = useState({ total: 0, byType: { text: 0, image: 0, video: 0 }, totalCreditsUsed: 0 })

  useEffect(() => {
    if (user) {
      loadContent()
      loadStats()
    }
  }, [user, filter])

  const loadContent = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await generatedContentService.getUserContent(user.id, {
        type: filter === 'all' ? undefined : filter,
        limitCount: 50
      })
      setContents(data)
    } catch (error) {
      console.error('Error loading content:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst historii obsahu",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return
    
    try {
      const statsData = await generatedContentService.getContentStats(user.id)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleDelete = async (contentId: string) => {
    if (!user || !contentId) return
    
    try {
      await generatedContentService.deleteContent(user.id, contentId)
      setContents(prev => prev.filter(c => c.id !== contentId))
      loadStats() // Refresh stats
      toast({
        title: "Obsah smazán",
        description: "Obsah byl úspěšně odstraněn z historie"
      })
    } catch (error) {
      console.error('Error deleting content:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat obsah",
        variant: "destructive"
      })
    }
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Zkopírováno",
        description: "Text byl zkopírován do schránky"
      })
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  const handleDownload = (content: GeneratedContent) => {
    if (content.type === 'text' && typeof content.content === 'string') {
      const blob = new Blob([content.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${content.title.replace(/[^a-z0-9]/gi, '_')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else if (content.type === 'image' && Array.isArray(content.content)) {
      content.content.forEach((imageUrl, index) => {
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = `${content.title.replace(/[^a-z0-9]/gi, '_')}_${index + 1}.png`
        a.click()
      })
    } else if (content.type === 'video' && typeof content.content === 'string') {
      const a = document.createElement('a')
      a.href = content.content
      a.download = `${content.title.replace(/[^a-z0-9]/gi, '_')}.mp4`
      a.click()
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText size={20} />
      case 'image': return <ImageIcon size={20} />
      case 'video': return <Video size={20} />
      default: return <FileText size={20} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'text-purple-400'
      case 'image': return 'text-pink-400'
      case 'video': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naklikam-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Historie vygenerovaného obsahu</h2>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-300">Celkem</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.byType.text}</div>
            <div className="text-sm text-slate-300">Texty</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400">{stats.byType.image}</div>
            <div className="text-sm text-slate-300">Obrázky</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.byType.video}</div>
            <div className="text-sm text-slate-300">Videa</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'text', 'image', 'video'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type as any)}
            >
              {type === 'all' ? 'Vše' : 
               type === 'text' ? 'Texty' :
               type === 'image' ? 'Obrázky' : 'Videa'}
            </Button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {contents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg mb-2">Žádný obsah nebyl zatím uložen</div>
          <p className="text-slate-500 text-sm">Vygenerujte nějaký obsah a klikněte na "Uložit"</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {contents.map((content) => (
            <div
              key={content.id}
              className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${getTypeColor(content.type)}`}>
                    {getIcon(content.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white line-clamp-1">{content.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar size={12} />
                      <span>
                        {format(content.metadata.generatedAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: cs })}
                      </span>
                      <span>•</span>
                      <Zap size={12} />
                      <span>{content.metadata.credits} kreditů</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  {content.type === 'text' && typeof content.content === 'string' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(content.content as string)}
                    >
                      <Copy size={14} />
                    </Button>
                  )}
                  
                  {content.settings.canDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(content)}
                    >
                      <Download size={14} />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => content.id && handleDelete(content.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-600/30">
                {content.type === 'text' && typeof content.content === 'string' ? (
                  <p className="text-sm text-slate-300 line-clamp-3">{content.content}</p>
                ) : content.type === 'image' && Array.isArray(content.content) ? (
                  <div className="flex gap-2 overflow-x-auto">
                    {content.content.slice(0, 3).map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Generated ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border border-slate-600"
                      />
                    ))}
                    {content.content.length > 3 && (
                      <div className="w-16 h-16 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-xs text-slate-400">
                        +{content.content.length - 3}
                      </div>
                    )}
                  </div>
                ) : content.type === 'video' && typeof content.content === 'string' ? (
                  <video
                    src={content.content}
                    className="w-32 h-18 object-cover rounded border border-slate-600"
                    muted
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContentHistory