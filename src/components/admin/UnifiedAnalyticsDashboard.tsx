import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, UserCheck, UserX, Activity, FileText, Calendar, CreditCard, DollarSign } from 'lucide-react'

interface UnifiedStats {
  // Firebase Auth data
  totalRegistered: number
  usersWithEmail: number
  recentUsers7Days: number
  recentUsers30Days: number
  
  // Project data  
  totalProjects: number
  activeUsers: number
  inactiveUsers: number
  activationRate: string
  avgProjectsPerUser: number
  
  // Stripe payment data
  totalPayments: number
  totalRevenue: number
  recentPayments30Days: number
  recentRevenue30Days: number
  recentPayments7Days: number
  recentRevenue7Days: number
  lastPayments: Array<{
    id: string
    amount: number
    currency: string
    created: string
    customerEmail: string
    description: string
  }>
  
  // Dates
  oldestUser: string | null
  newestUser: string | null
  
  loading: boolean
  error: string | null
}

export function UnifiedAnalyticsDashboard() {
  const [stats, setStats] = useState<UnifiedStats>({
    totalRegistered: 0,
    usersWithEmail: 0,
    recentUsers7Days: 0,
    recentUsers30Days: 0,
    totalProjects: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    activationRate: '0%',
    avgProjectsPerUser: 0,
    totalPayments: 0,
    totalRevenue: 0,
    recentPayments30Days: 0,
    recentRevenue30Days: 0,
    recentPayments7Days: 0,
    recentRevenue7Days: 0,
    lastPayments: [],
    oldestUser: null,
    newestUser: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    loadAllStats()
  }, [])

  const loadAllStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('📊 Loading unified analytics...')
      
      // Fetch real user stats from server
      const response = await fetch('/api/admin/user-stats')
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Unified stats loaded:', data.summary)
      
      setStats({
        totalRegistered: data.summary.totalRegistered,
        usersWithEmail: data.firebaseAuth.usersWithEmail,
        recentUsers7Days: data.firebaseAuth.recentUsers7Days,
        recentUsers30Days: data.firebaseAuth.recentUsers30Days,
        totalProjects: data.projects.totalProjects,
        activeUsers: data.summary.activeUsers,
        inactiveUsers: data.summary.inactiveUsers,
        activationRate: data.summary.activationRate,
        avgProjectsPerUser: data.summary.activeUsers > 0 ? 
          Number((data.projects.totalProjects / data.summary.activeUsers).toFixed(1)) : 0,
        totalPayments: data.stripe?.totalPayments || 0,
        totalRevenue: data.stripe?.totalRevenue || 0,
        recentPayments30Days: data.stripe?.recentPayments30Days || 0,
        recentRevenue30Days: data.stripe?.recentRevenue30Days || 0,
        recentPayments7Days: data.stripe?.recentPayments7Days || 0,
        recentRevenue7Days: data.stripe?.recentRevenue7Days || 0,
        lastPayments: data.stripe?.lastPayments || [],
        oldestUser: data.firebaseAuth.oldestUser,
        newestUser: data.firebaseAuth.newestUser,
        loading: false,
        error: null
      })
      
    } catch (error: any) {
      console.error('❌ Error loading unified stats:', error)
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  if (stats.loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Načítám analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (stats.error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-500 mb-2">Chyba při načítání dat</h3>
              <p className="text-sm text-muted-foreground mb-4">{stats.error}</p>
              <button 
                onClick={loadAllStats}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Zkusit znovu
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Celkem registrováno
              </CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{stats.totalRegistered}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Firebase Auth uživatelé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktivní uživatelé
              </CardTitle>
              <UserCheck className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{stats.activeUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              S alespoň 1 projektem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Neaktivní uživatelé
              </CardTitle>
              <UserX className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{stats.inactiveUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bez projektů
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Celkové tržby
              </CardTitle>
              <DollarSign className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-500">
              {new Intl.NumberFormat('cs-CZ', {
                style: 'currency',
                currency: 'CZK',
                minimumFractionDigits: 0
              }).format(stats.totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ze {stats.totalPayments} plateb
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Celkem projektů
              </CardTitle>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-500">{stats.totalProjects}</p>
            <p className="text-xs text-muted-foreground mt-1">
              V celém systému
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projektů/aktivní uživatel
              </CardTitle>
              <Activity className="w-4 h-4 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pink-500">{stats.avgProjectsPerUser}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Průměrná aktivita
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nové registrace (30d)
              </CardTitle>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">{stats.recentUsers30Days}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Posledních 30 dní: {stats.recentUsers7Days} (7d)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📈 Růstové metriky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Uživatelé s emailem:</span>
              <span className="font-semibold">{stats.usersWithEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Registrace za 7 dní:</span>
              <span className="font-semibold">{stats.recentUsers7Days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Registrace za 30 dní:</span>
              <span className="font-semibold">{stats.recentUsers30Days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Denní průměr (30d):</span>
              <span className="font-semibold">{Math.round(stats.recentUsers30Days / 30)}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platby za 30 dní:</span>
                <span className="font-semibold">{stats.recentPayments30Days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tržby za 30 dní:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('cs-CZ', {
                    style: 'currency',
                    currency: 'CZK',
                    minimumFractionDigits: 0
                  }).format(stats.recentRevenue30Days)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📅 Časová data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nejstarší registrace:</span>
              <span className="font-semibold">
                {stats.oldestUser ? 
                  new Date(stats.oldestUser).toLocaleDateString('cs-CZ') : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nejnovější registrace:</span>
              <span className="font-semibold">
                {stats.newestUser ? 
                  new Date(stats.newestUser).toLocaleDateString('cs-CZ') : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Provoz od:</span>
              <span className="font-semibold">
                {stats.oldestUser ? 
                  Math.round((Date.now() - new Date(stats.oldestUser).getTime()) / (1000 * 60 * 60 * 24)) + ' dní' :
                  'N/A'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      {stats.lastPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Poslední platby
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2 text-sm font-medium">Datum</th>
                    <th className="p-2 text-sm font-medium">Email</th>
                    <th className="p-2 text-sm font-medium">Částka</th>
                    <th className="p-2 text-sm font-medium">Popis</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lastPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        {new Date(payment.created).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="p-2 text-sm font-mono">
                        {payment.customerEmail.length > 25 
                          ? payment.customerEmail.substring(0, 25) + '...' 
                          : payment.customerEmail
                        }
                      </td>
                      <td className="p-2 text-sm font-semibold text-green-600">
                        {new Intl.NumberFormat('cs-CZ', {
                          style: 'currency',
                          currency: payment.currency,
                          minimumFractionDigits: 0
                        }).format(payment.amount)}
                      </td>
                      <td className="p-2 text-sm">
                        {payment.description.length > 30 
                          ? payment.description.substring(0, 30) + '...' 
                          : payment.description
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground">
        Automaticky aktualizováno: {new Date().toLocaleString('cs-CZ')}
      </div>
    </div>
  )
}