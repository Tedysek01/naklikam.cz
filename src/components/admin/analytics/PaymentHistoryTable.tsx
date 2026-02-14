import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  ArrowUpDown, 
  CreditCard, 
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

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

interface PaymentHistoryTableProps {
  payments: Payment[]
  onExport: () => void
}

type SortField = 'createdAt' | 'amount' | 'userEmail' | 'plan' | 'status'
type SortOrder = 'asc' | 'desc'

export function PaymentHistoryTable({ payments, onExport }: PaymentHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedPayments = [...payments].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    // Handle Date objects
    if (aVal instanceof Date && bVal instanceof Date) {
      aVal = aVal.getTime()
      bVal = bVal.getTime()
    }

    // Handle strings
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortOrder === 'asc' ? result : -result
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </button>
  )

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Úspěšná
          </Badge>
        )
      case 'failed':
      case 'declined':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Neúspěšná
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Čekající
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  const getPlanBadge = (plan: string) => {
    const planColors = {
      'free': 'secondary',
      'hobby': 'default',
      'starter': 'outline',
      'professional': 'secondary',
      'business': 'destructive',
      'lifetime': 'default'
    } as const

    return (
      <Badge variant={planColors[plan as keyof typeof planColors] || 'outline'}>
        {plan}
      </Badge>
    )
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getDaysAgo = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Dnes'
    if (diffDays === 1) return 'Včera'
    if (diffDays < 7) return `Před ${diffDays} dny`
    if (diffDays < 30) return `Před ${Math.floor(diffDays / 7)} týdny`
    return `Před ${Math.floor(diffDays / 30)} měsíci`
  }

  const totalRevenue = payments.reduce((sum, payment) => 
    payment.status.toLowerCase() === 'succeeded' ? sum + payment.amount : sum, 0
  )

  const successfulPayments = payments.filter(p => p.status.toLowerCase() === 'succeeded').length
  const failedPayments = payments.filter(p => p.status.toLowerCase() === 'failed').length

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Historie plateb ({payments.length})</CardTitle>
          </div>
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {formatAmount(totalRevenue, payments[0]?.currency || 'czk')}
              </div>
              <div className="text-muted-foreground">Celkové tržby</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {successfulPayments}
              </div>
              <div className="text-muted-foreground">Úspěšné platby</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {failedPayments}
              </div>
              <div className="text-muted-foreground">Neúspěšné platby</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {payments.length > 0 ? ((successfulPayments / payments.length) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-muted-foreground">Úspěšnost</div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 text-sm font-medium">
                  <SortButton field="createdAt">
                    <Calendar className="w-4 h-4" />
                    Datum
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="userEmail">
                    <User className="w-4 h-4" />
                    Zákazník
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="amount">
                    <DollarSign className="w-4 h-4" />
                    Částka
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="plan">
                    Plán
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="status">
                    Stav
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">Stripe ID</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="text-sm">
                      <div>{formatDate(payment.createdAt).split(' ')[0]}</div>
                      <div className="text-xs text-muted-foreground">
                        {getDaysAgo(payment.createdAt)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="text-sm">
                      <div className="font-mono">
                        {payment.userEmail.length > 30 
                          ? `${payment.userEmail.substring(0, 30)}...` 
                          : payment.userEmail
                        }
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {payment.userId.substring(0, 8)}...
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className={`text-lg font-bold ${
                      payment.status.toLowerCase() === 'succeeded' 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                    }`}>
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                  </td>
                  
                  <td className="p-3">
                    {getPlanBadge(payment.plan)}
                  </td>
                  
                  <td className="p-3">
                    {getStatusBadge(payment.status)}
                  </td>
                  
                  <td className="p-3">
                    {payment.stripePaymentIntentId ? (
                      <div className="font-mono text-xs text-muted-foreground">
                        {payment.stripePaymentIntentId.substring(0, 12)}...
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">N/A</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedPayments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Žádné platby nenalezeny</p>
            </div>
          )}
        </div>

        {/* Additional stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Platby podle plánu:</h4>
              {Object.entries(
                payments.reduce((acc, payment) => {
                  acc[payment.plan] = (acc[payment.plan] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([plan, count]) => (
                <div key={plan} className="flex justify-between text-xs">
                  <span className="capitalize">{plan}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Posledních 30 dní:</h4>
              {(() => {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                const recentPayments = payments.filter(p => p.createdAt >= thirtyDaysAgo)
                const recentRevenue = recentPayments
                  .filter(p => p.status.toLowerCase() === 'succeeded')
                  .reduce((sum, p) => sum + p.amount, 0)
                
                return (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Platby:</span>
                      <span className="font-semibold">{recentPayments.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Tržby:</span>
                      <span className="font-semibold">
                        {formatAmount(recentRevenue, payments[0]?.currency || 'czk')}
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Průměry:</h4>
              <div className="flex justify-between text-xs">
                <span>Průměrná platba:</span>
                <span className="font-semibold">
                  {payments.length > 0 
                    ? formatAmount(totalRevenue / successfulPayments, payments[0]?.currency || 'czk')
                    : '0 Kč'
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Plateb/den:</span>
                <span className="font-semibold">
                  {(() => {
                    if (payments.length === 0) return '0'
                    const oldestPayment = Math.min(...payments.map(p => p.createdAt.getTime()))
                    const daysSinceFirst = Math.max(1, Math.floor((Date.now() - oldestPayment) / (1000 * 60 * 60 * 24)))
                    return (payments.length / daysSinceFirst).toFixed(1)
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}