import { projectService } from '@/services/firebaseService'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

interface PaymentData {
  id: string
  userId: string
  userEmail: string
  amount: number
  plan: string
  status: string
  createdAt: Date
  stripePaymentIntentId?: string
  stripeInvoiceId?: string
}

interface UserRegistration {
  id: string
  email: string
  createdAt: Date
  lastLogin?: Date
  subscription?: {
    plan: string
    status: string
  }
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

export class AnalyticsServiceV2 {
  async getRegistrations(days: number = 30): Promise<UserRegistration[]> {
    try {
      console.log('🔍 Getting registrations via projects approach...')
      const startDate = startOfDay(subDays(new Date(), days))
      
      // Get projects to find user IDs (this works!)
      const projects = await projectService.getAllProjects()
      console.log('📋 Found', projects.length, 'projects')
      
      // Get unique user IDs
      const userIds = [...new Set(projects.map(p => p.ownerId))]
      console.log('👥 Found', userIds.length, 'unique users')
      
      const registrations: UserRegistration[] = []
      
      // Get user info for each user ID (this works!)
      let usersWithoutDate = 0
      let usersOutsideRange = 0
      let usersProcessed = 0
      
      for (const userId of userIds) {
        try {
          const userInfo = await projectService.getUserInfo(userId)
          if (!userInfo) continue
          
          usersProcessed++
          if (usersProcessed <= 3) { // Log first 3 users for debugging
            console.log('👤 User sample:', {
              id: userId,
              email: userInfo.email,
              createdAt: userInfo.createdAt,
              registeredAt: userInfo.registeredAt,
              keys: Object.keys(userInfo)
            })
          }
          
          // Check if user has creation date
          const createdAt = userInfo.createdAt?.toDate() || userInfo.registeredAt?.toDate()
          
          if (!createdAt) {
            usersWithoutDate++
            // For users without creation date, use current date (or estimate from first project)
            const fallbackDate = new Date() // You might want to use project creation date instead
            
            registrations.push({
              id: userId,
              email: userInfo.email || 'Unknown',
              createdAt: fallbackDate,
              lastLogin: userInfo.lastLogin?.toDate() || userInfo.lastLoginAt?.toDate(),
              subscription: undefined
            })
          } else if (createdAt >= startDate) {
            registrations.push({
              id: userId,
              email: userInfo.email || 'Unknown',
              createdAt,
              lastLogin: userInfo.lastLogin?.toDate() || userInfo.lastLoginAt?.toDate(),
              subscription: undefined
            })
          } else {
            usersOutsideRange++
          }
        } catch (error) {
          console.warn('Failed to get user info for:', userId)
        }
      }
      
      console.log('📊 Processing summary:', {
        totalUserIds: userIds.length,
        usersProcessed,
        usersWithoutDate,
        usersOutsideRange,
        finalRegistrations: registrations.length
      })
      
      console.log('✅ Final registrations:', registrations.length)
      return registrations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
    } catch (error) {
      console.error('❌ Error fetching registrations:', error)
      return []
    }
  }

  async getPayments(_days: number = 30): Promise<PaymentData[]> {
    try {
      // Since we can't access payments directly, we'll simulate based on users with paid plans
      console.log('🔍 Getting payments via user subscriptions...')
      
      // Get registrations would be needed here if we had access to subscription data
      // const registrations = await this.getRegistrations(days)
      const payments: PaymentData[] = []
      
      // This is a placeholder - we'd need to check subscriptions somehow
      // For now, let's return empty array since we can't access subscription data either
      
      return payments
    } catch (error) {
      console.error('❌ Error fetching payments:', error)
      return []
    }
  }

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    try {
      console.log('🔍 Getting plan distribution via users...')
      
      // Get all users via projects
      const projects = await projectService.getAllProjects()
      const userIds = [...new Set(projects.map(p => p.ownerId))]
      
      const distribution: Record<string, PlanDistribution> = {
        'active_users': { plan: 'Active Users (with projects)', count: 0, revenue: 0 }
      }
      
      // Count users who have projects as "active"
      distribution.active_users.count = userIds.length
      
      return Object.values(distribution)
    } catch (error) {
      console.error('❌ Error fetching plan distribution:', error)
      return []
    }
  }

  async getDailyStats(days: number = 7): Promise<DailyStats[]> {
    try {
      console.log('🔍 Getting daily stats...')
      const stats: DailyStats[] = []
      
      // Get registrations first
      const allRegistrations = await this.getRegistrations(90) // Get more data to have enough for daily breakdown
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const start = startOfDay(date)
        const end = endOfDay(date)
        
        // Filter registrations for this day
        const dayRegistrations = allRegistrations.filter(reg => 
          reg.createdAt >= start && reg.createdAt <= end
        )
        
        stats.push({
          date: format(date, 'dd.MM'),
          registrations: dayRegistrations.length,
          payments: 0, // Can't get this easily
          revenue: 0, // Can't get this easily
          activeUsers: 0 // Can't get this easily
        })
      }
      
      return stats
    } catch (error) {
      console.error('❌ Error fetching daily stats:', error)
      return []
    }
  }

  async getTotalRevenue(_days: number = 30): Promise<number> {
    // Can't get this without access to payments or subscriptions
    return 0
  }

  async getConversionRate(_days: number = 30): Promise<number> {
    // Can't calculate this without subscription data
    return 0
  }
}

export const analyticsServiceV2 = new AnalyticsServiceV2()
