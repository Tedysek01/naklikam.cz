import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Users, 
  CreditCard, 
  Download, 
  Search, 
  Activity,
  UserCheck,
  DollarSign,
  FileText,
  BarChart3,
  PieChart
} from 'lucide-react'
import { analyticsServiceV2 } from '@/services/analyticsServiceV2'
import { UserListTable } from './analytics/UserListTable'
import { PaymentHistoryTable } from './analytics/PaymentHistoryTable'
import { AnalyticsCharts } from './analytics/AnalyticsCharts'
import { ExportPanel } from './analytics/ExportPanel'

interface AnalyticsState {
  loading: boolean
  error: string | null
  
  // Overview stats
  basicStats: {
    totalProjects: number
    uniqueUsers: number
    oldestProject: Date | null
    newestProject: Date | null
  }
  
  // User data
  users: Array<{
    id: string
    email: string
    createdAt: Date
    lastLogin?: Date
    projectCount: number
    subscription?: {
      plan: string
      status: string
    }
  }>
  
  // Payment data
  payments: Array<{
    id: string
    userId: string
    userEmail: string
    amount: number
    currency: string
    plan: string
    status: string
    createdAt: Date
    stripePaymentIntentId?: string
  }>
  
  // Analytics data
  dailyStats: Array<{
    date: string
    registrations: number
    payments: number
    revenue: number
    activeUsers: number
  }>
  
  planDistribution: Array<{
    plan: string
    count: number
    revenue: number
  }>
  
  // Server data for calculations
  serverData?: any
}

const initialState: AnalyticsState = {
  loading: true,
  error: null,
  basicStats: {
    totalProjects: 0,
    uniqueUsers: 0,
    oldestProject: null,
    newestProject: null
  },
  users: [],
  payments: [],
  dailyStats: [],
  planDistribution: []
}

type TabType = 'overview' | 'users' | 'payments' | 'charts' | 'export'

export function AdvancedAnalyticsDashboard() {
  const [state, setState] = useState<AnalyticsState>(initialState)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set(['overview']))
  const [backgroundLoading, setBackgroundLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  })

  useEffect(() => {
    loadAllAnalytics()
  }, [])

  const loadAllAnalytics = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('📊 Loading analytics data (optimized)...')
      
      // Priority 1: Get unified stats from server (includes Stripe data) - this is fastest
      const serverResponse = await fetch('/api/admin/user-stats')
      
      if (!serverResponse.ok) {
        throw new Error(`Server error: ${serverResponse.status}`)
      }

      const serverData = await serverResponse.json()
      console.log('✅ Server data loaded')
      
      // Create basic stats from server data (no need to recalculate)
      const basicStats = {
        totalProjects: serverData.projects.totalProjects,
        uniqueUsers: serverData.summary.activeUsers,
        projectsByUser: {}, // We'll populate this lazily if needed
        oldestProject: null,
        newestProject: null
      }
      
      // Create payments array from server data
      const payments = serverData.stripe?.lastPayments?.map((payment: any) => ({
        id: payment.id,
        userId: payment.customerEmail,
        userEmail: payment.customerEmail,
        amount: payment.amount,
        currency: payment.currency.toUpperCase(),
        plan: payment.description.includes('Hobby') ? 'hobby' : 
              payment.description.includes('Starter') ? 'starter' : 
              payment.description.includes('Professional') ? 'professional' : 
              payment.description.includes('Business') ? 'business' : 'unknown',
        status: 'succeeded',
        createdAt: new Date(payment.created),
        stripePaymentIntentId: payment.id
      })) || []
      
      // Set initial state with server data (fast loading)
      setState(prev => ({
        ...prev,
        loading: false,
        basicStats,
        users: [], // Will be loaded in background
        payments,
        dailyStats: [], // Will be loaded in background
        planDistribution: [], // Will be loaded in background
        serverData
      }))
      
      console.log('✅ Basic analytics loaded (showing to user)')
      
      // Load detailed data in background (don't block UI)
      loadDetailedDataInBackground(serverData, basicStats)
      
    } catch (error: any) {
      console.error('❌ Error loading analytics:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }
  
  const loadDetailedDataInBackground = async (_serverData: any, _basicStats: any) => {
    try {
      setBackgroundLoading(true)
      console.log('📊 Loading detailed data in background...')
      
      // Load only what we need for detailed views (when user clicks tabs)
      const [dailyStats, planDistribution] = await Promise.all([
        analyticsServiceV2.getDailyStats(14), // Keep daily stats smaller
        analyticsServiceV2.getPlanDistribution()
      ])
      
      // Load all payment data from dedicated endpoint
      console.log('💳 Loading complete payment history...')
      let allPayments = []
      try {
        const paymentsResponse = await fetch('/api/admin/payment-history?limit=500&days=365')
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          allPayments = paymentsData.payments.map((payment: any) => ({
            id: payment.id,
            userId: payment.userId,
            userEmail: payment.userEmail,
            amount: payment.amount,
            currency: payment.currency,
            plan: payment.plan,
            status: payment.status,
            createdAt: new Date(payment.createdAt),
            stripePaymentIntentId: payment.stripePaymentIntentId
          }))
          console.log(`✅ Loaded ${allPayments.length} payments from Stripe`)
        } else {
          console.warn('❌ Failed to load payment history, using server data fallback')
        }
      } catch (error) {
        console.error('❌ Error loading payments:', error)
      }
      
      // Load real user data from new endpoint
      console.log('👥 Loading real user data...')
      const userListResponse = await fetch('/api/admin/user-list?limit=1000')
      
      let usersWithProjectCounts = []
      if (userListResponse.ok) {
        const userData = await userListResponse.json()
        console.log(`✅ Loaded ${userData.users.length} real users from Firebase Auth`)
        
        // Convert to our expected format
        usersWithProjectCounts = userData.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          lastLogin: user.lastSignIn ? new Date(user.lastSignIn) : undefined,
          projectCount: user.projectCount,
          subscription: undefined // We don't have subscription data in this endpoint
        }))
      } else {
        console.warn('❌ Failed to load real user data, falling back to project-based data')
        
        // Fallback to project-based approach
        const projectService = await import('@/services/firebaseService')
        const projects = await projectService.projectService.getAllProjects()
        
        const projectsByUser: Record<string, number> = {}
        projects.forEach(project => {
          projectsByUser[project.ownerId] = (projectsByUser[project.ownerId] || 0) + 1
        })
        
        const uniqueUserIds = [...new Set(projects.map(p => p.ownerId))]
        usersWithProjectCounts = uniqueUserIds.map(userId => ({
          id: userId,
          email: `user-${userId.substring(0, 8)}@fallback.com`,
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          projectCount: projectsByUser[userId] || 0,
          lastLogin: undefined,
          subscription: undefined
        }))
      }
      
      console.log(`✅ User list ready: ${usersWithProjectCounts.length} users (${usersWithProjectCounts.filter((u: any) => u.projectCount > 0).length} active)`)
      
      console.log('✅ Background data loaded')
      
      // Create projectsByUser mapping for basicStats
      const projectsByUser: Record<string, number> = {}
      usersWithProjectCounts.forEach((user: any) => {
        if (user.projectCount > 0) {
          projectsByUser[user.id] = user.projectCount
        }
      })
      
      // Update state with detailed data
      setState(prev => ({
        ...prev,
        basicStats: { ...prev.basicStats, projectsByUser },
        users: usersWithProjectCounts,
        payments: allPayments.length > 0 ? allPayments : prev.payments, // Use loaded payments or fallback to server data
        dailyStats,
        planDistribution
      }))
      
      setBackgroundLoading(false)
      
    } catch (error) {
      console.error('❌ Error loading background data:', error)
      setBackgroundLoading(false)
      // Don't show error to user, basic data is already loaded
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    
    URL.revokeObjectURL(url)
  }

  const filteredUsers = state.users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = dateFilter.from && dateFilter.to 
      ? user.createdAt >= new Date(dateFilter.from) && user.createdAt <= new Date(dateFilter.to)
      : true
      
    return matchesSearch && matchesDate
  })

  const filteredPayments = state.payments.filter(payment => {
    const matchesSearch = payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = dateFilter.from && dateFilter.to 
      ? payment.createdAt >= new Date(dateFilter.from) && payment.createdAt <= new Date(dateFilter.to)
      : true
      
    return matchesSearch && matchesDate
  })

  const handleTabChange = async (tabId: TabType) => {
    setActiveTab(tabId)
    
    // Load tab data if not loaded yet
    if (!loadedTabs.has(tabId)) {
      console.log(`📊 Loading data for ${tabId} tab...`)
      setLoadedTabs(prev => new Set(prev.add(tabId)))
      
      // Load specific data for this tab if needed
      if (tabId === 'users' && state.users.length === 0) {
        // Load detailed user data if needed
      }
    }
  }

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: BarChart3 },
    { id: 'users', label: 'Uživatelé', icon: Users },
    { id: 'payments', label: 'Platby', icon: CreditCard },
    { id: 'charts', label: 'Grafy', icon: PieChart },
    { id: 'export', label: 'Export', icon: Download }
  ] as const

  if (state.loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Načítám pokročilou analytiku...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-500 mb-2">Chyba při načítání analytiky</h3>
              <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
              <Button onClick={loadAllAnalytics}>
                Zkusit znovu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pokročilá analytika</h1>
          <p className="text-muted-foreground">
            Kompletní přehled uživatelů, plateb a metrik pro datovou analýzu
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {backgroundLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
              Načítám detailní data...
            </div>
          )}
          <Button 
            onClick={loadAllAnalytics} 
            variant="outline" 
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Obnovit data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters (shown for users and payments tabs) */}
      {(activeTab === 'users' || activeTab === 'payments') && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Hledat podle emailu nebo ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="w-auto"
                />
                <Input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="w-auto"
                />
                <Button
                  onClick={() => {
                    setDateFilter({ from: '', to: '' })
                    setSearchTerm('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Vymazat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-3xl font-bold text-blue-500">{state.serverData?.summary?.totalRegistered || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Firebase Auth uživatelé
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
                  }).format(state.serverData?.stripe?.totalRevenue || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Z {state.serverData?.stripe?.totalPayments || 0} plateb
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Celkem projektů
                  </CardTitle>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">{state.basicStats.totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ve všech uživatelských účtech
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
                <p className="text-3xl font-bold text-green-500">{state.basicStats.uniqueUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  S alespoň jedním projektem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Neaktivní uživatelé
                  </CardTitle>
                  <Users className="w-4 h-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">{state.serverData?.summary?.inactiveUsers || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bez projektů
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Průměr projektů/uživatel
                  </CardTitle>
                  <Activity className="w-4 h-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500">
                  {state.basicStats.uniqueUsers > 0 
                    ? (state.basicStats.totalProjects / state.basicStats.uniqueUsers).toFixed(1)
                    : '0'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Průměrná aktivita
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Rychlé statistiky</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Průměr projektů/uživatel:</span>
                  <span className="font-semibold">
                    {state.basicStats.uniqueUsers > 0 
                      ? (state.basicStats.totalProjects / state.basicStats.uniqueUsers).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Registrace za posledních 30 dní:</span>
                  <span className="font-semibold">
                    {state.users.filter(u => {
                      const thirtyDaysAgo = new Date()
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                      return u.createdAt >= thirtyDaysAgo
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Platby za posledních 30 dní:</span>
                  <span className="font-semibold">
                    {state.payments.filter(p => {
                      const thirtyDaysAgo = new Date()
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                      return p.createdAt >= thirtyDaysAgo
                    }).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📈 Plány uživatelů</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {state.planDistribution.map((plan) => (
                  <div key={plan.plan} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{plan.plan}:</span>
                    <div className="text-right">
                      <span className="font-semibold">{plan.count} uživatelů</span>
                      {plan.revenue > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {plan.revenue.toLocaleString('cs-CZ')} Kč
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <UserListTable 
          users={filteredUsers}
          onExport={() => exportToCSV(filteredUsers, `users_${new Date().toISOString().split('T')[0]}.csv`)}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentHistoryTable 
          payments={filteredPayments}
          onExport={() => exportToCSV(filteredPayments, `payments_${new Date().toISOString().split('T')[0]}.csv`)}
        />
      )}

      {activeTab === 'charts' && (
        <AnalyticsCharts 
          dailyStats={state.dailyStats}
          planDistribution={state.planDistribution}
          users={state.users}
          payments={state.payments}
        />
      )}

      {activeTab === 'export' && (
        <ExportPanel 
          users={state.users}
          payments={state.payments}
          dailyStats={state.dailyStats}
          planDistribution={state.planDistribution}
          onExport={exportToCSV}
        />
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        Posledná aktualizace: {new Date().toLocaleString('cs-CZ')} | 
        {state.users.length} uživatelů | {state.payments.length} plateb
      </div>
    </div>
  )
}