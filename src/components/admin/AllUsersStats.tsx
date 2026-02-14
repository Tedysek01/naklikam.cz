import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { projectService } from '@/services/firebaseService'
import { Users, Activity } from 'lucide-react'

interface UserStats {
  totalProjects: number
  uniqueUsers: number
  usersWithEmail: number
  avgProjectsPerUser: number
  loading: boolean
}

export function AllUsersStats() {
  const [stats, setStats] = useState<UserStats>({
    totalProjects: 0,
    uniqueUsers: 0,
    usersWithEmail: 0,
    avgProjectsPerUser: 0,
    loading: false
  })

  const loadAllUsersStats = async () => {
    setStats(prev => ({ ...prev, loading: true }))
    
    try {
      console.log('📊 Loading all users stats...')
      
      // Get all projects
      const projects = await projectService.getAllProjects()
      const userIds = [...new Set(projects.map(p => p.ownerId))]
      
      console.log('Found', projects.length, 'projects from', userIds.length, 'users')
      
      // Sample some users to get email stats
      let usersWithEmail = 0
      const sampleSize = Math.min(50, userIds.length) // Sample first 50 users for performance
      
      for (let i = 0; i < sampleSize; i++) {
        try {
          const userInfo = await projectService.getUserInfo(userIds[i])
          if (userInfo?.email) {
            usersWithEmail++
          }
        } catch (error) {
          // Skip failed users
        }
      }
      
      // Estimate total users with email based on sample
      const estimatedUsersWithEmail = Math.round((usersWithEmail / sampleSize) * userIds.length)
      
      setStats({
        totalProjects: projects.length,
        uniqueUsers: userIds.length,
        usersWithEmail: estimatedUsersWithEmail,
        avgProjectsPerUser: Number((projects.length / userIds.length).toFixed(1)),
        loading: false
      })
      
    } catch (error) {
      console.error('Error loading all users stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Celkové statistiky uživatelů
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={loadAllUsersStats}
          disabled={stats.loading}
        >
          {stats.loading ? 'Načítám...' : 'Načíst statistiky všech uživatelů'}
        </Button>
        
        {(stats.uniqueUsers > 0) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Celkem projektů</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{stats.totalProjects}</p>
            </div>
            
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Unikátní uživatelé</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.uniqueUsers}</p>
            </div>
            
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">S emailem</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">{stats.usersWithEmail}</p>
              <p className="text-xs text-muted-foreground">~odhad</p>
            </div>
            
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Projektů/uživatel</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">{stats.avgProjectsPerUser}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}