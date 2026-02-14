import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { db } from '@/config/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { projectService } from '@/services/firebaseService'

export function AnalyticsDebugger() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testFirestoreAccess = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      console.log('🔍 Testing Firestore access...')
      
      // Test 1: Try to read users collection
      console.log('📂 Testing users collection...')
      const usersRef = collection(db, 'users')
      let usersSnapshot
      try {
        usersSnapshot = await getDocs(usersRef)
        console.log('✅ Users collection accessible:', usersSnapshot.size, 'docs')
      } catch (usersError: unknown) {
        console.log('❌ Users collection not accessible:', (usersError as Error).message)
        
        // Try via projectService approach
        console.log('🔄 Trying projectService approach...')
        const projects = await projectService.getAllProjects(10)
        console.log('📋 Projects found:', projects.length)
        
        if (projects.length > 0) {
          const ownerIds = [...new Set(projects.map(p => p.ownerId))]
          console.log('👥 Unique owner IDs:', ownerIds.length)
          
          // Try to get user info via projectService
          const sampleUserId = ownerIds[0]
          const userInfo = await projectService.getUserInfo(sampleUserId)
          console.log('👤 Sample user via projectService:', userInfo)
        }
        
        setResults({
          error: 'Cannot read users collection directly',
          usersError: (usersError as Error).message,
          projectsWorkaround: projects.length,
          timestamp: new Date().toISOString()
        })
        return
      }
      
      // Test 2: Get first user and inspect data
      let sampleUser = null
      let sampleSubscription = null
      
      if (!usersSnapshot.empty) {
        const firstUser = usersSnapshot.docs[0]
        sampleUser = {
          id: firstUser.id,
          data: firstUser.data(),
          keys: Object.keys(firstUser.data())
        }
        console.log('👤 Sample user:', sampleUser)
        
        // Test 3: Try to read subscription subcollection
        try {
          const subRef = collection(db, `users/${firstUser.id}/subscription`)
          const subSnapshot = await getDocs(subRef)
          console.log('📋 Subscription subcollection for user:', subSnapshot.size, 'docs')
          
          if (!subSnapshot.empty) {
            const firstSub = subSnapshot.docs[0]
            sampleSubscription = {
              id: firstSub.id,
              data: firstSub.data(),
              keys: Object.keys(firstSub.data())
            }
            console.log('💳 Sample subscription:', sampleSubscription)
          }
        } catch (subError) {
          console.error('❌ Error reading subscription:', subError)
        }
      }
      
      // Test 4: Check what collections exist
      const testCollections = ['payments', 'subscriptions', 'userTokens']
      const collectionTests: Record<string, { exists: boolean; count?: number; error?: string }> = {}
      
      for (const collectionName of testCollections) {
        try {
          const testRef = collection(db, collectionName)
          const testSnapshot = await getDocs(testRef)
          collectionTests[collectionName] = {
            exists: true,
            count: testSnapshot.size
          }
          console.log(`📁 Collection ${collectionName}:`, testSnapshot.size, 'docs')
        } catch (error: unknown) {
          collectionTests[collectionName] = {
            exists: false,
            error: (error as Error).message
          }
          console.log(`❌ Collection ${collectionName}: Not accessible`)
        }
      }
      
      setResults({
        totalUsers: usersSnapshot.size,
        sampleUser,
        sampleSubscription,
        collectionTests,
        timestamp: new Date().toISOString()
      })
      
    } catch (error: unknown) {
      console.error('❌ Firestore test failed:', error)
      setResults({
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔧 Analytics Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testFirestoreAccess}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Firestore Access'}
        </Button>
        
        {results && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Results:</h4>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
            
            {results.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 font-semibold">Error:</p>
                <p className="text-sm">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}