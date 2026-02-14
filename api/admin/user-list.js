import admin from 'firebase-admin';

export default async (req, res) => {
  try {
    console.log('[USER-LIST] Request received')
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get query parameters
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 1000, 1000)) // Ensure valid range 1-1000
    const pageToken = req.query.pageToken || undefined

    // Get Firebase Auth users with pagination
    console.log(`[USER-LIST] Fetching Firebase Auth users with limit=${limit}, type=${typeof limit}...`)
    let authUsers
    try {
      // Use the same format as working marketing scripts
      if (pageToken) {
        console.log('[USER-LIST] Using pagination with pageToken:', pageToken)
        authUsers = await admin.auth().listUsers(limit, pageToken)
      } else {
        console.log('[USER-LIST] Using simple limit approach')
        authUsers = await admin.auth().listUsers(limit)
      }
    } catch (authError) {
      console.error('[USER-LIST] Firebase Auth error:', authError)
      return res.status(500).json({ 
        error: 'Failed to access Firebase Auth', 
        details: authError.message 
      })
    }

    console.log(`[USER-LIST] Found ${authUsers.users.length} users`)

    // Get project statistics for user activity
    console.log('[USER-LIST] Getting project data...')
    const adminDb = admin.firestore()
    const projectsByUser = new Map()
    
    try {
      const projectsSnapshot = await adminDb.collection('projects').get()
      
      projectsSnapshot.forEach(doc => {
        const data = doc.data()
        const ownerId = data.ownerId
        if (ownerId) {
          const count = projectsByUser.get(ownerId) || 0
          projectsByUser.set(ownerId, count + 1)
        }
      })
      
      console.log(`[USER-LIST] Processed ${projectsSnapshot.size} projects`)
    } catch (projectError) {
      console.error('[USER-LIST] Error getting projects:', projectError)
    }

    // Format user data
    const users = authUsers.users.map(user => {
      const projectCount = projectsByUser.get(user.uid) || 0
      const daysSinceCreation = user.metadata.creationTime 
        ? Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
        : null
      const daysSinceLastLogin = user.metadata.lastSignInTime
        ? Math.floor((Date.now() - new Date(user.metadata.lastSignInTime).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        id: user.uid,
        email: user.email || '',
        emailVerified: user.emailVerified,
        displayName: user.displayName || '',
        createdAt: user.metadata.creationTime || null,
        lastSignIn: user.metadata.lastSignInTime || null,
        projectCount,
        provider: user.providerData?.[0]?.providerId || 'password',
        daysSinceCreation,
        daysSinceLastLogin,
        isActive: projectCount > 0,
        segment: projectCount >= 5 ? 'power_user' : 
                projectCount >= 2 ? 'active_user' :
                projectCount >= 1 ? 'light_user' : 'inactive'
      }
    })

    console.log('[USER-LIST] Response ready:', {
      usersReturned: users.length,
      hasMorePages: !!authUsers.pageToken,
      activeUsers: users.filter(u => u.projectCount > 0).length
    })

    res.json({
      users,
      pagination: {
        pageToken: authUsers.pageToken,
        hasMore: !!authUsers.pageToken,
        limit
      },
      summary: {
        totalInPage: users.length,
        activeUsers: users.filter(u => u.projectCount > 0).length,
        inactiveUsers: users.filter(u => u.projectCount === 0).length
      }
    })

  } catch (error) {
    console.error('[USER-LIST] Unexpected error:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}