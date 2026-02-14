import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  ArrowUpDown, 
  Users, 
  Calendar,
  Activity,
  Mail,
  CreditCard
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

interface UserListTableProps {
  users: User[]
  onExport: () => void
}

type SortField = 'email' | 'createdAt' | 'lastLogin' | 'projectCount'
type SortOrder = 'asc' | 'desc'

export function UserListTable({ users, onExport }: UserListTableProps) {
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

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    // Handle Date objects
    if (aVal instanceof Date && bVal instanceof Date) {
      aVal = aVal.getTime()
      bVal = bVal.getTime()
    }

    // Handle undefined values (put them last)
    if (aVal === undefined && bVal === undefined) return 0
    if (aVal === undefined) return 1
    if (bVal === undefined) return -1

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

  const getPlanBadgeColor = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case 'free': return 'secondary'
      case 'hobby': return 'default'
      case 'starter': return 'outline'
      case 'professional': return 'secondary'
      case 'business': return 'destructive'
      case 'lifetime': return 'default'
      default: return 'secondary'
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Nikdy'
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

  const getActivityColor = (projectCount: number) => {
    if (projectCount === 0) return 'text-red-500'
    if (projectCount >= 10) return 'text-green-500'
    if (projectCount >= 5) return 'text-blue-500'
    if (projectCount >= 2) return 'text-yellow-500'
    return 'text-orange-500'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Seznam uživatelů ({users.length})</CardTitle>
          </div>
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 text-sm font-medium">
                  <SortButton field="email">
                    <Mail className="w-4 h-4" />
                    Email
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="createdAt">
                    <Calendar className="w-4 h-4" />
                    Registrace
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="lastLogin">
                    <Activity className="w-4 h-4" />
                    Poslední aktivita
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <SortButton field="projectCount">
                    Projekty
                  </SortButton>
                </th>
                <th className="p-3 text-sm font-medium">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Plán
                </th>
                <th className="p-3 text-sm font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div className="font-mono text-sm">
                      {user.email.length > 35 
                        ? `${user.email.substring(0, 35)}...` 
                        : user.email
                      }
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="text-sm">
                      <div>{formatDate(user.createdAt).split(' ')[0]}</div>
                      <div className="text-xs text-muted-foreground">
                        {getDaysAgo(user.createdAt)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    {user.lastLogin ? (
                      <div className="text-sm">
                        <div>{formatDate(user.lastLogin).split(' ')[0]}</div>
                        <div className="text-xs text-muted-foreground">
                          {getDaysAgo(user.lastLogin)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Nikdy
                      </div>
                    )}
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getActivityColor(user.projectCount)}`}>
                        {user.projectCount}
                      </span>
                      {user.projectCount === 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Neaktivní
                        </Badge>
                      )}
                      {user.projectCount >= 10 && (
                        <Badge variant="default" className="text-xs">
                          Power User
                        </Badge>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <Badge variant={getPlanBadgeColor(user.subscription?.plan)}>
                      {user.subscription?.plan || 'free'}
                    </Badge>
                    {user.subscription?.status && user.subscription.status !== 'active' && (
                      <div className="text-xs text-red-500 mt-1">
                        {user.subscription.status}
                      </div>
                    )}
                  </td>
                  
                  <td className="p-3">
                    <div className="font-mono text-xs text-muted-foreground">
                      {user.id.substring(0, 8)}...
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Žádní uživatelé nenalezeni</p>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">
                {users.filter(u => u.projectCount > 0).length}
              </div>
              <div className="text-muted-foreground">Aktivní uživatelé</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">
                {users.filter(u => u.projectCount === 0).length}
              </div>
              <div className="text-muted-foreground">Neaktivní uživatelé</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">
                {users.filter(u => u.subscription?.plan && u.subscription.plan !== 'free').length}
              </div>
              <div className="text-muted-foreground">Platící zákazníci</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">
                {users.filter(u => {
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return u.createdAt >= thirtyDaysAgo
                }).length}
              </div>
              <div className="text-muted-foreground">Noví (30 dní)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}