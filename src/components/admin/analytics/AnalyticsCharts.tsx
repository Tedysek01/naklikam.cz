import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users,
  Calendar,
  Activity
} from 'lucide-react'

interface DailyStats {
  date: string
  registrations: number
  payments: number
  revenue: number
  activeUsers: number
}

interface PlanDistribution {
  plan: string
  count: number
  revenue: number
}

interface User {
  id: string
  email: string
  createdAt: Date
  lastLogin?: Date
  projectCount: number
}

interface Payment {
  id: string
  userId: string
  userEmail: string
  amount: number
  currency: string
  plan: string
  status: string
  createdAt: Date
}

interface AnalyticsChartsProps {
  dailyStats: DailyStats[]
  planDistribution: PlanDistribution[]
  users: User[]
  payments: Payment[]
}

export function AnalyticsCharts({ 
  dailyStats, 
  planDistribution, 
  users, 
  payments 
}: AnalyticsChartsProps) {

  // Calculate cohort analysis (simplified)
  const calculateCohortData = () => {
    const cohorts: Record<string, { registered: number; active: number; retention: number }> = {}
    
    users.forEach(user => {
      const month = user.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!cohorts[month]) {
        cohorts[month] = { registered: 0, active: 0, retention: 0 }
      }
      cohorts[month].registered++
      if (user.projectCount > 0) {
        cohorts[month].active++
      }
    })
    
    // Calculate retention rates
    Object.keys(cohorts).forEach(month => {
      const cohort = cohorts[month]
      cohort.retention = cohort.registered > 0 ? (cohort.active / cohort.registered) * 100 : 0
    })
    
    return cohorts
  }

  // Calculate user segments
  const calculateUserSegments = () => {
    const segments = {
      powerUsers: users.filter(u => u.projectCount >= 10).length,
      activeUsers: users.filter(u => u.projectCount >= 2 && u.projectCount < 10).length,
      lightUsers: users.filter(u => u.projectCount === 1).length,
      inactiveUsers: users.filter(u => u.projectCount === 0).length,
    }
    
    return segments
  }

  // Calculate revenue trends
  const calculateRevenueTrends = () => {
    const trends: Record<string, number> = {}
    
    payments
      .filter(p => p.status.toLowerCase() === 'succeeded')
      .forEach(payment => {
        const month = payment.createdAt.toISOString().substring(0, 7) // YYYY-MM
        trends[month] = (trends[month] || 0) + payment.amount
      })
    
    return trends
  }

  const cohortData = calculateCohortData()
  const userSegments = calculateUserSegments()
  const revenueTrends = calculateRevenueTrends()

  // Simple ASCII-style chart component
  const SimpleBarChart = ({ 
    data, 
    title, 
    valueKey, 
    labelKey, 
    color = 'bg-blue-500' 
  }: {
    data: any[]
    title: string
    valueKey: string
    labelKey: string
    color?: string
  }) => {
    const maxValue = Math.max(...data.map(item => item[valueKey]))
    
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-16 text-xs text-muted-foreground truncate">
                {item[labelKey]}
              </div>
              <div className="flex-1 flex items-center">
                <div
                  className={`h-4 ${color} rounded-sm`}
                  style={{
                    width: `${maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0}%`,
                    minWidth: item[valueKey] > 0 ? '8px' : '0'
                  }}
                />
                <span className="ml-2 text-xs font-medium">
                  {typeof item[valueKey] === 'number' 
                    ? item[valueKey].toLocaleString('cs-CZ')
                    : item[valueKey]
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const PieChartDisplay = ({ 
    data, 
    title 
  }: {
    data: { label: string; value: number; color: string }[]
    title: string
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${item.color}`}
                />
                <span>{item.label}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{item.value}</div>
                <div className="text-xs text-muted-foreground">
                  {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Registration and Activity Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Denní registrace (30 dní)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={dailyStats}
              title="Registrace podle dní"
              valueKey="registrations"
              labelKey="date"
              color="bg-blue-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Denní tržby (30 dní)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={dailyStats}
              title="Tržby podle dní"
              valueKey="revenue"
              labelKey="date"
              color="bg-green-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* User Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Segmentace uživatelů
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartDisplay
              title="Uživatelé podle aktivity"
              data={[
                { label: 'Power Users (10+ projektů)', value: userSegments.powerUsers, color: 'bg-green-500' },
                { label: 'Aktivní (2-9 projektů)', value: userSegments.activeUsers, color: 'bg-blue-500' },
                { label: 'Lehcí (1 projekt)', value: userSegments.lightUsers, color: 'bg-yellow-500' },
                { label: 'Neaktivní (0 projektů)', value: userSegments.inactiveUsers, color: 'bg-red-500' }
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribuce plánů
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartDisplay
              title="Uživatelé podle plánů"
              data={planDistribution.map((plan, index) => ({
                label: plan.plan,
                value: plan.count,
                color: [
                  'bg-gray-500', 
                  'bg-blue-500', 
                  'bg-purple-500', 
                  'bg-green-500', 
                  'bg-orange-500', 
                  'bg-red-500'
                ][index % 6]
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cohort analýza (retention)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Retention rate podle měsíců registrace</h4>
              <div className="space-y-1">
                {Object.entries(cohortData)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 6)
                  .map(([month, data]) => (
                    <div key={month} className="flex items-center justify-between text-sm p-2 border rounded">
                      <div>
                        <span className="font-medium">{month}</span>
                        <div className="text-xs text-muted-foreground">
                          {data.registered} registrací
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          data.retention >= 50 ? 'text-green-600' :
                          data.retention >= 25 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {data.retention.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.active} aktivních
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Měsíční tržby
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={Object.entries(revenueTrends)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([month, revenue]) => ({
                  month,
                  revenue: Math.round(revenue)
                }))
              }
              title="Tržby podle měsíců"
              valueKey="revenue"
              labelKey="month"
              color="bg-purple-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Klíčová zjištění</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-800">Aktivace uživatelů</div>
              <div className="text-blue-600">
                {users.length > 0 
                  ? ((users.filter(u => u.projectCount > 0).length / users.length) * 100).toFixed(1)
                  : 0
                }% uživatelů má alespoň 1 projekt
              </div>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-800">Průměrné ARPU</div>
              <div className="text-green-600">
                {(() => {
                  const successfulPayments = payments.filter(p => p.status.toLowerCase() === 'succeeded')
                  const uniquePayers = new Set(successfulPayments.map(p => p.userId)).size
                  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0)
                  return uniquePayers > 0 
                    ? `${Math.round(totalRevenue / uniquePayers)} Kč/uživatel`
                    : '0 Kč/uživatel'
                })()}
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="font-semibold text-purple-800">Konverzní poměr</div>
              <div className="text-purple-600">
                {(() => {
                  const paidUsers = new Set(payments.filter(p => p.status.toLowerCase() === 'succeeded').map(p => p.userId)).size
                  return users.length > 0 
                    ? `${((paidUsers / users.length) * 100).toFixed(1)}%`
                    : '0%'
                })()}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="font-semibold text-amber-800 mb-2">📊 Doporučení pro růst:</div>
            <ul className="text-sm text-amber-700 space-y-1">
              {userSegments.inactiveUsers > userSegments.activeUsers && (
                <li>• Vysoký počet neaktivních uživatelů - zvážit onboarding kampaň</li>
              )}
              {payments.filter(p => p.status.toLowerCase() === 'succeeded').length < users.length * 0.1 && (
                <li>• Nízký konverzní poměr - optimalizovat pricing a nabídku</li>
              )}
              {userSegments.powerUsers < users.length * 0.05 && (
                <li>• Málo power users - zaměřit se na engagement existujících uživatelů</li>
              )}
              <li>• Pravidelně monitorovat cohort retention pro včasné záchyty problémů</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}