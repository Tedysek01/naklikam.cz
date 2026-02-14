import { projectService } from '@/services/firebaseService'
// Firebase imports removed as they're not used in this service

interface AnalyticsData {
  totalProjects: number
  uniqueUsers: number
  projectsByUser: Record<string, number>
  oldestProject: Date | null
  newestProject: Date | null
}

interface PlanDistribution {
  plan: string
  count: number
  revenue: number
}

export class AnalyticsServiceV3 {
  async getBasicStats(): Promise<AnalyticsData> {
    try {
      console.log('📊 Getting basic stats from projects...')
      
      // Get all projects (this works!)
      const projects = await projectService.getAllProjects()
      const userIds = [...new Set(projects.map(p => p.ownerId))]
      
      // Count projects per user
      const projectsByUser: Record<string, number> = {}
      projects.forEach(project => {
        projectsByUser[project.ownerId] = (projectsByUser[project.ownerId] || 0) + 1
      })
      
      // Get date ranges from projects
      const projectDates = projects
        .map(p => p.createdAt ? new Date(p.createdAt) : null)
        .filter(date => date !== null) as Date[]
      
      const oldestProject = projectDates.length > 0 ? new Date(Math.min(...projectDates.map(d => d.getTime()))) : null
      const newestProject = projectDates.length > 0 ? new Date(Math.max(...projectDates.map(d => d.getTime()))) : null
      
      console.log('✅ Basic stats calculated:', {
        totalProjects: projects.length,
        uniqueUsers: userIds.length,
        dateRange: oldestProject && newestProject ? 
          `${oldestProject.toDateString()} - ${newestProject.toDateString()}` : 'No dates'
      })
      
      return {
        totalProjects: projects.length,
        uniqueUsers: userIds.length,
        projectsByUser,
        oldestProject,
        newestProject
      }
    } catch (error) {
      console.error('❌ Error getting basic stats:', error)
      throw error
    }
  }

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    try {
      const stats = await this.getBasicStats()
      
      // Create distribution based on project activity
      const distribution: PlanDistribution[] = [
        {
          plan: 'Active Users (with projects)',
          count: stats.uniqueUsers,
          revenue: 0 // We don't have access to subscription data
        }
      ]
      
      // Add breakdown by project count
      const projectCounts = Object.values(stats.projectsByUser)
      const heavyUsers = projectCounts.filter((count: unknown) => (count as number) >= 5).length
      const mediumUsers = projectCounts.filter((count: unknown) => (count as number) >= 2 && (count as number) < 5).length
      const lightUsers = projectCounts.filter((count: unknown) => (count as number) === 1).length
      
      if (heavyUsers > 0) {
        distribution.push({
          plan: 'Heavy Users (5+ projects)',
          count: heavyUsers,
          revenue: 0
        })
      }
      
      if (mediumUsers > 0) {
        distribution.push({
          plan: 'Medium Users (2-4 projects)',
          count: mediumUsers,
          revenue: 0
        })
      }
      
      if (lightUsers > 0) {
        distribution.push({
          plan: 'Light Users (1 project)',
          count: lightUsers,
          revenue: 0
        })
      }
      
      return distribution
    } catch (error) {
      console.error('❌ Error getting plan distribution:', error)
      return []
    }
  }

  async getDailyStats(_days: number = 7) {
    try {
      // const stats = await this.getBasicStats() // Not used in this method
      const dailyStats = []
      
      // Get all projects with dates
      const projects = await projectService.getAllProjects()
      const projectsWithDates = projects.filter(p => p.createdAt)
      
      for (let i = _days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const dayProjects = projectsWithDates.filter(project => {
          const projectDate = new Date(project.createdAt)
          return projectDate >= date && projectDate < nextDay
        })
        
        // Count unique users who created projects this day
        const dayUsers = [...new Set(dayProjects.map(p => p.ownerId))]
        
        dailyStats.push({
          date: `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`,
          registrations: dayUsers.length, // Users who created first project
          payments: 0, // Can't determine
          revenue: 0, // Can't determine
          activeUsers: dayProjects.length // Projects created this day
        })
      }
      
      return dailyStats
    } catch (error) {
      console.error('❌ Error getting daily stats:', error)
      return []
    }
  }

  // Simple methods that return what we can actually measure
  async getTotalRevenue(): Promise<number> {
    // We don't have access to payment data, so return 0
    return 0
  }

  async getConversionRate(): Promise<number> {
    // We don't have subscription data, so return 0
    return 0
  }

  async getRegistrations(_days: number = 30) {
    try {
      // const stats = await this.getBasicStats() // Not used in this method
      
      // Instead of registrations, show users who created projects in timeframe
      const projects = await projectService.getAllProjects()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - _days)
      
      const recentProjects = projects.filter(project => {
        const projectDate = project.createdAt ? new Date(project.createdAt) : null
        return projectDate && projectDate >= startDate
      })
      
      const recentUsers = [...new Set(recentProjects.map(p => p.ownerId))]
      
      return recentUsers.map(userId => ({
        id: userId,
        email: `user-${userId.substring(0, 8)}@hidden.com`, // Hide real emails
        createdAt: new Date(), // Approximate
        lastLogin: null,
        subscription: { plan: 'unknown', status: 'active' }
      }))
      
    } catch (error) {
      console.error('❌ Error getting registrations:', error)
      return []
    }
  }

  async getPayments(_days: number = 30) {
    // We don't have payment data access
    return []
  }
}

export const analyticsServiceV3 = new AnalyticsServiceV3()