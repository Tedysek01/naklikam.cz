import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Database,
  Calendar,
  Filter,
  CheckCircle2
} from 'lucide-react'

interface User {
  id: string
  email: string
  createdAt: Date
  lastLogin?: Date
  projectCount: number
  subscription?: {
    plan: string
    status: string
  }
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
  stripePaymentIntentId?: string
}

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

interface ExportPanelProps {
  users: User[]
  payments: Payment[]
  dailyStats: DailyStats[]
  planDistribution: PlanDistribution[]
  onExport: (data: any[], filename: string) => void
}

export function ExportPanel({ 
  users, 
  payments, 
  dailyStats, 
  onExport 
}: ExportPanelProps) {
  const [exportStatus, setExportStatus] = useState<Record<string, boolean>>({})

  const handleExport = async (type: string, data: any[], filename: string) => {
    setExportStatus(prev => ({ ...prev, [type]: true }))
    
    try {
      onExport(data, filename)
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setExportStatus(prev => ({ ...prev, [type]: false }))
      }, 2000)
    } catch (error) {
      setExportStatus(prev => ({ ...prev, [type]: false }))
    }
  }

  const prepareUserData = () => {
    return users.map(user => ({
      id: user.id,
      email: user.email,
      registrationDate: user.createdAt.toISOString(),
      lastLoginDate: user.lastLogin?.toISOString() || '',
      projectCount: user.projectCount,
      subscriptionPlan: user.subscription?.plan || 'free',
      subscriptionStatus: user.subscription?.status || 'none',
      daysSinceRegistration: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      isActive: user.projectCount > 0 ? 'Yes' : 'No'
    }))
  }

  const preparePaymentData = () => {
    return payments.map(payment => ({
      id: payment.id,
      userId: payment.userId,
      userEmail: payment.userEmail,
      amount: payment.amount,
      currency: payment.currency,
      plan: payment.plan,
      status: payment.status,
      paymentDate: payment.createdAt.toISOString(),
      stripePaymentIntentId: payment.stripePaymentIntentId || '',
      monthYear: payment.createdAt.toISOString().substring(0, 7)
    }))
  }

  const prepareAnalyticsData = () => {
    const cohortAnalysis = users.reduce((acc, user) => {
      const month = user.createdAt.toISOString().substring(0, 7)
      if (!acc[month]) {
        acc[month] = { registered: 0, active: 0, retention: 0 }
      }
      acc[month].registered++
      if (user.projectCount > 0) {
        acc[month].active++
      }
      return acc
    }, {} as Record<string, { registered: number; active: number; retention: number }>)

    // Calculate retention
    Object.keys(cohortAnalysis).forEach(month => {
      const cohort = cohortAnalysis[month]
      cohort.retention = cohort.registered > 0 ? (cohort.active / cohort.registered) * 100 : 0
    })

    return Object.entries(cohortAnalysis).map(([month, data]) => ({
      month,
      registeredUsers: data.registered,
      activeUsers: data.active,
      retentionRate: data.retention.toFixed(2)
    }))
  }

  const prepareSegmentationData = () => {
    const segments = [
      { name: 'Power Users', min: 10, max: Infinity },
      { name: 'Active Users', min: 2, max: 9 },
      { name: 'Light Users', min: 1, max: 1 },
      { name: 'Inactive Users', min: 0, max: 0 }
    ]

    return segments.map(segment => {
      const count = users.filter(u => 
        u.projectCount >= segment.min && u.projectCount <= segment.max
      ).length
      
      const paidUsers = users.filter(u => 
        u.projectCount >= segment.min && 
        u.projectCount <= segment.max &&
        u.subscription?.plan && 
        u.subscription.plan !== 'free'
      ).length

      return {
        segment: segment.name,
        userCount: count,
        paidUsers,
        conversionRate: count > 0 ? ((paidUsers / count) * 100).toFixed(2) : '0.00',
        percentageOfTotal: users.length > 0 ? ((count / users.length) * 100).toFixed(2) : '0.00'
      }
    })
  }

  const prepareRevenueData = () => {
    const monthlyRevenue = payments
      .filter(p => p.status.toLowerCase() === 'succeeded')
      .reduce((acc, payment) => {
        const month = payment.createdAt.toISOString().substring(0, 7)
        if (!acc[month]) {
          acc[month] = { revenue: 0, payments: 0, uniqueUsers: new Set() }
        }
        acc[month].revenue += payment.amount
        acc[month].payments++
        acc[month].uniqueUsers.add(payment.userId)
        return acc
      }, {} as Record<string, { revenue: number; payments: number; uniqueUsers: Set<string> }>)

    return Object.entries(monthlyRevenue)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        paymentCount: data.payments,
        uniqueCustomers: data.uniqueUsers.size,
        averageOrderValue: data.payments > 0 ? (data.revenue / data.payments).toFixed(2) : '0.00'
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
  }

  const exportItems = [
    {
      id: 'users',
      title: 'Seznam uživatelů',
      description: 'Kompletní data o všech registrovaných uživatelích',
      icon: Database,
      data: prepareUserData(),
      filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-blue-500'
    },
    {
      id: 'payments',
      title: 'Historie plateb',
      description: 'Všechny platby s detaily o zákaznících a plánech',
      icon: FileText,
      data: preparePaymentData(),
      filename: `payments_export_${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-green-500'
    },
    {
      id: 'cohort',
      title: 'Cohort analýza',
      description: 'Retention analýza podle měsíců registrace',
      icon: Calendar,
      data: prepareAnalyticsData(),
      filename: `cohort_analysis_${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-purple-500'
    },
    {
      id: 'segments',
      title: 'Segmentace uživatelů',
      description: 'Analýza podle aktivity a konverze',
      icon: Filter,
      data: prepareSegmentationData(),
      filename: `user_segments_${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-orange-500'
    },
    {
      id: 'revenue',
      title: 'Měsíční tržby',
      description: 'Detailní analýza příjmů podle měsíců',
      icon: Download,
      data: prepareRevenueData(),
      filename: `monthly_revenue_${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-indigo-500'
    },
    {
      id: 'daily',
      title: 'Denní statistiky',
      description: 'Denní data o registracích a platbách',
      icon: Calendar,
      data: dailyStats,
      filename: `daily_stats_${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-pink-500'
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export dat pro analýzu
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Stáhněte si data ve formátu CSV pro další analýzu v Excelu, Google Sheets nebo specializovaných nástrojích.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${item.color} text-white rounded-lg`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">
                        {item.data.length} záznamů
                      </Badge>
                      <Badge variant="secondary">
                        CSV format
                      </Badge>
                    </div>

                    {item.data.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-3">
                        <strong>Sloupce:</strong> {Object.keys(item.data[0]).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleExport(item.id, item.data, item.filename)}
                disabled={item.data.length === 0 || exportStatus[item.id]}
                className="w-full"
                variant={exportStatus[item.id] ? "default" : "outline"}
              >
                {exportStatus[item.id] ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Exportováno
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Stáhnout CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export All */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Stáhnout všechna data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Stáhněte si všechny dostupné exporty najednou
            </p>
            <Button
              onClick={() => {
                exportItems.forEach(item => {
                  if (item.data.length > 0) {
                    setTimeout(() => {
                      handleExport(item.id, item.data, item.filename)
                    }, 100 * exportItems.indexOf(item))
                  }
                })
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Stáhnout všechny CSV soubory
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Tipy pro analýzu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Excel/Google Sheets:</strong> Otevřete CSV soubory a používejte pivot tabulky pro pokročilé analýzy
          </div>
          <div>
            <strong>Power BI/Tableau:</strong> Importujte CSV soubory pro vytváření pokročilých dashboardů a vizualizací  
          </div>
          <div>
            <strong>Python/R:</strong> Použijte pandas/dplyr pro statistické analýzy a machine learning modely
          </div>
          <div>
            <strong>SQL databáze:</strong> Importujte data pro komplexní dotazy a join operace
          </div>
        </CardContent>
      </Card>
    </div>
  )
}