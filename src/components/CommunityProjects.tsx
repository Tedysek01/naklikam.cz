import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { projectService } from '@/services/firebaseService'
import { Project } from '@/types'

interface ProjectWithAuthor extends Project {
  author?: {
    name: string
    avatar: string
  }
  thumbnail?: string
  category?: string
  categoryColor?: string
}

// Category mapping for visual styling
const getCategoryStyle = (projectName: string) => {
  const name = projectName.toLowerCase()
  if (name.includes('dashboard') || name.includes('analytics')) return { category: 'Dashboard', color: 'bg-blue-500' }
  if (name.includes('shop') || name.includes('e-commerce') || name.includes('store')) return { category: 'E-shop', color: 'bg-green-500' }
  if (name.includes('portfolio') || name.includes('cv')) return { category: 'Portfolio', color: 'bg-purple-500' }
  if (name.includes('task') || name.includes('todo') || name.includes('management')) return { category: 'Produktivita', color: 'bg-orange-500' }
  if (name.includes('blog') || name.includes('news')) return { category: 'Blog', color: 'bg-pink-500' }
  if (name.includes('weather') || name.includes('app')) return { category: 'Aplikace', color: 'bg-cyan-500' }
  if (name.includes('restaurant') || name.includes('menu') || name.includes('food')) return { category: 'Restaurant', color: 'bg-red-500' }
  if (name.includes('fitness') || name.includes('health') || name.includes('exercise')) return { category: 'Zdraví', color: 'bg-emerald-500' }
  return { category: 'Projekt', color: 'bg-gray-500' }
}

export default function CommunityProjects() {
  const [projects, setProjects] = useState<ProjectWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPublicProjects = async () => {
      try {
        const publicProjects = await projectService.getPublicProjects(8)
        
        // Enhance projects with additional display data
        const enhancedProjects = publicProjects.map(project => {
          const categoryStyle = getCategoryStyle(project.name)
          return {
            ...project,
            author: {
              name: project.userId || 'Anonymní uživatel',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.userId || project.id}`
            },
            thumbnail: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1551288049-bebda4e38f71' : '1467232004584-a241de8bcf5d'}?w=400&h=300&fit=crop`,
            category: categoryStyle.category,
            categoryColor: categoryStyle.color
          }
        })
        
        setProjects(enhancedProjects)
      } catch (error) {
        console.error('Error loading public projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPublicProjects()
  }, [])
  return (
    <div className="mt-16 md:mt-32">
      <div className="text-center mb-8 md:mb-12 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
          Z naší komunity
        </h2>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-4 md:mt-6">
          <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-card border border-border hover:border-naklikam-pink-500 transition-colors text-xs md:text-sm">
            Všechny
          </button>
          <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-card border border-border hover:border-naklikam-pink-500 transition-colors text-xs md:text-sm">
            E-shopy
          </button>
          <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-card border border-border hover:border-naklikam-pink-500 transition-colors text-xs md:text-sm">
            Portfolia
          </button>
          <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-card border border-border hover:border-naklikam-pink-500 transition-colors text-xs md:text-sm">
            Aplikace
          </button>
          <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-card border border-border hover:border-naklikam-pink-500 transition-colors text-xs md:text-sm">
            Blogy
          </button>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-sm rounded-xl md:rounded-3xl border border-border p-4 md:p-8 mx-4 md:mx-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naklikam-pink-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Načítám veřejné projekty...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Zatím nejsou k dispozici žádné veřejné projekty.</p>
            <p className="text-sm text-muted-foreground mt-2">Buďte první, kdo zde svůj projekt zveřejní!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {projects.map((project) => (
                <div key={project.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg md:rounded-xl mb-3">
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-36 sm:h-40 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`${project.categoryColor} text-white text-xs px-3 py-1 rounded-full`}>
                        {project.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold font-display text-foreground group-hover:text-naklikam-pink-500 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.description || 'Projekt vytvořený pomocí AI'}
                      </p>
                      <div className="flex items-center mt-3 space-x-2">
                        <img
                          src={project.author?.avatar}
                          alt={project.author?.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs text-muted-foreground">
                          {project.author?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.updatedAt).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {projects.length >= 8 && (
              <div className="text-center mt-8">
                <button className="text-naklikam-pink-500 hover:text-naklikam-pink-600 font-medium text-sm">
                  Zobrazit více →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}