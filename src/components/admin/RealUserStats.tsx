import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, UserCheck, UserX, TrendingUp, Activity, Calendar } from 'lucide-react'

interface RealUserStatsData {
  firebaseAuth: {
    totalUsers: number
    usersWithEmail: number
    recentUsers30Days: number
    recentUsers7Days: number
    oldestUser: string | null
    newestUser: string | null
  }
  projects: {
    totalProjects: number
    uniqueProjectOwners: number
  }
  summary: {
    totalRegistered: number
    activeUsers: number
    inactiveUsers: number
    activationRate: string
  }
}

export function RealUserStats() {
  const [data, setData] = useState<RealUserStatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRealUserStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching real user stats from server...')
      
      const response = await fetch('/api/admin/user-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization if needed
        }
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Real user stats received:', result)
      
      setData(result)
    } catch (err: any) {
      console.error('❌ Error fetching real user stats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Skutečné statistiky uživatelů
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchRealUserStats}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Načítám z Firebase Auth...' : 'Načíst skutečné statistiky'}
        </Button>
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 font-semibold">Chyba:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {data && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Celkem registrováno</span>
                </div>
                <p className="text-2xl font-bold text-blue-500">{data.summary.totalRegistered}</p>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Aktivní uživatelé</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{data.summary.activeUsers}</p>
                <p className="text-xs text-muted-foreground">s projekty</p>
              </div>
              
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserX className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Neaktivní</span>
                </div>
                <p className="text-2xl font-bold text-orange-500">{data.summary.inactiveUsers}</p>
                <p className="text-xs text-muted-foreground">bez projektů</p>
              </div>
              
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Míra aktivace</span>
                </div>
                <p className="text-2xl font-bold text-purple-500">{data.summary.activationRate}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">Nové registrace</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posledních 7 dní:</span>
                    <span className="font-semibold">{data.firebaseAuth.recentUsers7Days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posledních 30 dní:</span>
                    <span className="font-semibold">{data.firebaseAuth.recentUsers30Days}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold">Projekty</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Celkem projektů:</span>
                    <span className="font-semibold">{data.projects.totalProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Projektů/aktivní uživatel:</span>
                    <span className="font-semibold">
                      {data.summary.activeUsers > 0 ? 
                        (data.projects.totalProjects / data.summary.activeUsers).toFixed(1) : 
                        '0'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Detaily:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Uživatelé s emailem:</strong> {data.firebaseAuth.usersWithEmail}</p>
                  <p><strong>Nejstarší registrace:</strong> {
                    data.firebaseAuth.oldestUser ? 
                    new Date(data.firebaseAuth.oldestUser).toLocaleDateString('cs-CZ') : 
                    'N/A'
                  }</p>
                </div>
                <div>
                  <p><strong>Nejnovější registrace:</strong> {
                    data.firebaseAuth.newestUser ? 
                    new Date(data.firebaseAuth.newestUser).toLocaleDateString('cs-CZ') : 
                    'N/A'
                  }</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}