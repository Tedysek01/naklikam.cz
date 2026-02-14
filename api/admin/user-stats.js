import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

const adminDb = admin.firestore();

export default async (req, res) => {
  console.log('[USER-STATS] Request received:', req.method)
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if user is admin (you might want to add proper auth check)
    const { authorization } = req.headers
    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    console.log('[USER-STATS] Getting Firebase Auth user count...')
    
    // Get total users from Firebase Auth
    let totalUsers = 0
    let userEmails = []
    let userCreationDates = []
    
    try {
      // List all users (in batches)
      const listUsersResult = await getAuth().listUsers(1000) // Max 1000 at once
      totalUsers = listUsersResult.users.length
      
      // Extract emails and creation dates
      listUsersResult.users.forEach(user => {
        if (user.email) {
          userEmails.push(user.email)
        }
        if (user.metadata.creationTime) {
          userCreationDates.push(new Date(user.metadata.creationTime))
        }
      })
      
      console.log(`[USER-STATS] Found ${totalUsers} users in Firebase Auth`)
      
      // If there are more users, we'd need pagination
      if (listUsersResult.pageToken) {
        console.log('[USER-STATS] Warning: More than 1000 users, pagination needed')
        // For now, just note that there are more
      }
    } catch (authError) {
      console.error('[USER-STATS] Error accessing Firebase Auth:', authError)
      return res.status(500).json({ 
        error: 'Failed to access Firebase Auth', 
        details: authError.message 
      })
    }

    // Get project statistics
    let projectStats = {
      totalProjects: 0,
      uniqueProjectOwners: 0,
      projectOwnerIds: []
    }

    try {
      const projectsSnapshot = await adminDb.collection('projects').get()
      projectStats.totalProjects = projectsSnapshot.size
      
      const ownerIds = new Set()
      projectsSnapshot.forEach(doc => {
        const ownerId = doc.data().ownerId
        if (ownerId) {
          ownerIds.add(ownerId)
        }
      })
      
      projectStats.uniqueProjectOwners = ownerIds.size
      projectStats.projectOwnerIds = Array.from(ownerIds)
      
      console.log(`[USER-STATS] Found ${projectStats.totalProjects} projects from ${projectStats.uniqueProjectOwners} users`)
    } catch (projectError) {
      console.error('[USER-STATS] Error getting project stats:', projectError)
    }

    // Calculate time-based statistics
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentUsers30Days = userCreationDates.filter(date => date >= last30Days).length
    const recentUsers7Days = userCreationDates.filter(date => date >= last7Days).length

    const response = {
      timestamp: new Date().toISOString(),
      firebaseAuth: {
        totalUsers,
        usersWithEmail: userEmails.length,
        recentUsers30Days,
        recentUsers7Days,
        oldestUser: userCreationDates.length > 0 ? new Date(Math.min(...userCreationDates.map(d => d.getTime()))) : null,
        newestUser: userCreationDates.length > 0 ? new Date(Math.max(...userCreationDates.map(d => d.getTime()))) : null
      },
      projects: projectStats,
      summary: {
        totalRegistered: totalUsers,
        activeUsers: projectStats.uniqueProjectOwners,
        inactiveUsers: totalUsers - projectStats.uniqueProjectOwners,
        activationRate: totalUsers > 0 ? ((projectStats.uniqueProjectOwners / totalUsers) * 100).toFixed(1) + '%' : '0%'
      }
    }

    console.log('[USER-STATS] Response summary:', response.summary)
    res.json(response)

  } catch (error) {
    console.error('[USER-STATS] Error:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}