import { db } from '@/config/firebase'
import { 
  collection, 
  getDocs
} from 'firebase/firestore'
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

export class AnalyticsService {
  async getPayments(days: number = 30): Promise<PaymentData[]> {
    try {
      // Since payments aren't stored in Firestore, we'll get them from subscriptions
      // This is a workaround to get payment-like data from subscription creation dates
      const startDate = startOfDay(subDays(new Date(), days))
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const payments: PaymentData[] = []
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        
        // Get user's subscription
        try {
          const userSubRef = collection(db, `users/${userDoc.id}/subscription`)
          const subSnapshot = await getDocs(userSubRef)
          
          for (const subDoc of subSnapshot.docs) {
            const subData = subDoc.data()
            const createdAt = subData.createdAt?.toDate() || subData.updatedAt?.toDate()
            
            if (createdAt && createdAt >= startDate && subData.plan && subData.plan !== 'free') {
              // Calculate estimated payment amount based on plan
              const planPrices: Record<string, number> = {
                'hobby': 249,
                'starter': 499, 
                'professional': 999,
                'business': 1999,
                'lifetime': 9999
              }
              
              payments.push({
                id: `${userDoc.id}_${subDoc.id}`,
                userId: userDoc.id,
                userEmail: userData.email || 'Unknown',
                amount: planPrices[subData.plan] || 0,
                plan: subData.plan,
                status: 'succeeded', // Assume successful if subscription exists
                createdAt: createdAt,
                stripePaymentIntentId: subData.stripeSubscriptionId,
                stripeInvoiceId: undefined
              })
            }
          }
        } catch (error) {
          console.error(`Error fetching subscription for user ${userDoc.id}:`, error)
        }
      }
      
      // Sort by creation date descending
      payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      return payments
    } catch (error) {
      console.error('Error fetching payments:', error)
      return []
    }
  }

  async getRegistrations(days: number = 30): Promise<UserRegistration[]> {
    try {
      console.log('🔍 Getting registrations for last', days, 'days')
      const startDate = startOfDay(subDays(new Date(), days))
      console.log('📅 Start date:', startDate)
      
      const usersRef = collection(db, 'users')
      
      // Get all users first, then filter by date
      const snapshot = await getDocs(usersRef)
      console.log('👥 Total users found:', snapshot.size)
      
      const registrations: UserRegistration[] = []
      
      for (const doc of snapshot.docs) {
        const data = doc.data()
        console.log('📄 User data sample:', {
          id: doc.id,
          email: data.email,
          createdAt: data.createdAt,
          registeredAt: data.registeredAt,
          keys: Object.keys(data)
        })
        
        const createdAt = (data.createdAt as any)?.toDate() || (data.registeredAt as any)?.toDate()
        
        // Skip if no creation date or outside date range
        if (!createdAt || createdAt < startDate) {
          console.log('⏭️ Skipping user - no date or outside range')
          continue
        }
        
        // Get subscription info from subcollection
        let subscription
        try {
          const subRef = collection(db, `users/${doc.id}/subscription`)
          const subSnapshot = await getDocs(subRef)
          if (!subSnapshot.empty) {
            const subData = subSnapshot.docs[0].data()
            subscription = {
              plan: subData.plan || 'free',
              status: 'active' // Assume active if exists
            }
          }
        } catch (error) {
          console.error('Error fetching subscription:', error)
        }
        
        registrations.push({
          id: doc.id,
          email: data.email || 'Unknown',
          createdAt,
          lastLogin: (data.lastLogin as any)?.toDate() || (data.lastLoginAt as any)?.toDate(),
          subscription
        })
      }
      
      // Sort by creation date descending
      registrations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      console.log('✅ Final registrations count:', registrations.length)
      return registrations
    } catch (error) {
      console.error('❌ Error fetching registrations:', error)
      return []
    }
  }

  async getDailyStats(days: number = 7): Promise<DailyStats[]> {
    try {
      const stats: DailyStats[] = []
      
      // Get all users first to avoid multiple queries
      const usersRef = collection(db, 'users')
      const allUsersSnapshot = await getDocs(usersRef)
      const allUsers = allUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{ id: string; createdAt?: any; registeredAt?: any; lastLogin?: any; lastLoginAt?: any; [key: string]: any }>
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const start = startOfDay(date)
        const end = endOfDay(date)
        
        // Filter registrations for this day
        const dayRegistrations = allUsers.filter(user => {
          const createdAt = (user.createdAt as any)?.toDate() || (user.registeredAt as any)?.toDate()
          return createdAt && createdAt >= start && createdAt <= end
        })
        
        // Get payments for this day (from our modified getPayments method)
        let dayPayments = 0
        let dayRevenue = 0
        
        for (const user of allUsers) {
          try {
            const subRef = collection(db, `users/${user.id}/subscription`)
            const subSnapshot = await getDocs(subRef)
            
            for (const subDoc of subSnapshot.docs) {
              const subData = subDoc.data()
              const createdAt = subData.createdAt?.toDate() || subData.updatedAt?.toDate()
              
              if (createdAt && createdAt >= start && createdAt <= end && subData.plan !== 'free') {
                dayPayments++
                
                // Calculate revenue based on plan
                const planPrices: Record<string, number> = {
                  'hobby': 249,
                  'starter': 499,
                  'professional': 999,
                  'business': 1999,
                  'lifetime': 9999
                }
                dayRevenue += planPrices[subData.plan] || 0
              }
            }
          } catch (error) {
            // Skip if can't read subscription
          }
        }
        
        // Get active users for this day
        const activeUsers = allUsers.filter(user => {
          const lastLogin = user.lastLogin?.toDate() || user.lastLoginAt?.toDate()
          return lastLogin && lastLogin >= start && lastLogin <= end
        })
        
        stats.push({
          date: format(date, 'dd.MM'),
          registrations: dayRegistrations.length,
          payments: dayPayments,
          revenue: dayRevenue,
          activeUsers: activeUsers.length
        })
      }
      
      return stats
    } catch (error) {
      console.error('Error fetching daily stats:', error)
      return []
    }
  }

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const distribution: Record<string, PlanDistribution> = {
        'free': { plan: 'free', count: 0, revenue: 0 }
      }
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const subRef = collection(db, `users/${userDoc.id}/subscription`)
          const subSnapshot = await getDocs(subRef)
          
          let plan = 'free' // Default to free
          if (!subSnapshot.empty) {
            const subData = subSnapshot.docs[0].data()
            plan = subData.plan || 'free'
          }
          
          if (!distribution[plan]) {
            distribution[plan] = {
              plan,
              count: 0,
              revenue: 0
            }
          }
          
          distribution[plan].count++
          
          // Calculate revenue based on plan
          const planPrices: Record<string, number> = {
            'free': 0,
            'hobby': 249,
            'starter': 499,
            'professional': 999,
            'business': 1999,
            'lifetime': 9999
          }
          
          distribution[plan].revenue += planPrices[plan] || 0
        } catch (error) {
          // If no subscription, count as free
          distribution['free'].count++
        }
      }
      
      return Object.values(distribution)
    } catch (error) {
      console.error('Error fetching plan distribution:', error)
      return []
    }
  }

  async getTotalRevenue(days: number = 30): Promise<number> {
    try {
      const payments = await this.getPayments(days)
      return payments.reduce((total, payment) => total + payment.amount, 0)
    } catch (error) {
      console.error('Error calculating total revenue:', error)
      return 0
    }
  }

  async getConversionRate(days: number = 30): Promise<number> {
    try {
      const registrations = await this.getRegistrations(days)
      if (registrations.length === 0) return 0
      
      const paidUsers = registrations.filter(user => 
        user.subscription && user.subscription.plan !== 'free'
      ).length
      
      return (paidUsers / registrations.length) * 100
    } catch (error) {
      console.error('Error calculating conversion rate:', error)
      return 0
    }
  }
}

export const analyticsService = new AnalyticsService()