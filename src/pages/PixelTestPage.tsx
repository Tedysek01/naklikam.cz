import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useCookiesStore } from '@/store/cookiesStore'
import { 
  trackPageView, 
  trackCompleteRegistration, 
  trackInitiateCheckout,
  trackViewContent,
  trackSearch,
  trackAddToCart,
  trackPurchase,
  trackLead,
  trackAddPaymentInfo,
  trackPlaceAnOrder,
  trackProjectCreated,
  trackAIPromptSubmitted,
  trackSubscriptionStarted,
  trackDeploymentStarted,
  identifyUser 
} from '@/utils/analytics'
import { useAuthStore } from '@/store/authStore'
import { Check, X, AlertCircle, User, ShoppingCart, CreditCard, Package, Search, Sparkles } from 'lucide-react'

interface EventLog {
  id: string
  timestamp: Date
  eventName: string
  parameters?: any
  success: boolean
}

export default function PixelTestPage() {
  const { preferences, hasInteracted } = useCookiesStore()
  const { user } = useAuthStore()
  const [eventLogs, setEventLogs] = useState<EventLog[]>([])
  const [isIdentifying, setIsIdentifying] = useState(false)
  
  // Track page view on mount
  useEffect(() => {
    trackViewContent('Pixel Test Page', 'test')
  }, [])
  
  const logEvent = (eventName: string, parameters?: any, success: boolean = true) => {
    const newLog: EventLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      eventName,
      parameters,
      success
    }
    setEventLogs(prev => [newLog, ...prev].slice(0, 20)) // Keep last 20 events
  }
  
  const resetCookies = () => {
    localStorage.removeItem('cookies-preferences')
    window.location.reload()
  }
  
  // Standard E-commerce Events
  const testPageView = () => {
    trackPageView()
    logEvent('PageView')
  }
  
  const testViewContent = () => {
    const params = { contentName: 'Professional Plan', category: 'subscription', value: 1290 }
    trackViewContent(params.contentName, params.category, params.value)
    logEvent('ViewContent', params)
  }
  
  const testSearch = () => {
    const params = { searchString: 'landing page builder' }
    trackSearch(params.searchString)
    logEvent('Search', params)
  }
  
  const testAddToCart = () => {
    const params = { contentId: 'professional-plan', contentName: 'Professional Plan', value: 1290 }
    trackAddToCart(params.contentId, params.contentName, params.value)
    logEvent('AddToCart', params)
  }
  
  const testAddPaymentInfo = () => {
    const params = { contentId: 'professional-plan', contentName: 'Professional Plan', value: 1290 }
    trackAddPaymentInfo(params.contentId, params.contentName, params.value)
    logEvent('AddPaymentInfo', params)
  }
  
  const testInitiateCheckout = () => {
    // Small delay to separate from button click detection
    setTimeout(() => {
      const params = { value: 1290, numItems: 1, plan: 'professional' }
      
      // Test direct TikTok Pixel call
      if ((window as any).ttq) {
        try {
          (window as any).ttq.track('InitiateCheckout', {
            contents: [{
              content_id: 'professional',
              content_type: 'product',
              content_name: 'professional subscription'
            }],
            value: 1290,
            currency: 'CZK'
          });
        } catch (e) {
          console.error('Direct call failed:', e)
        }
      }
      
      trackInitiateCheckout(params.value, params.numItems, params.plan)
      logEvent('InitiateCheckout', params)
    }, 100)
  }
  
  const testPlaceAnOrder = () => {
    const params = { contentId: 'professional-plan', contentName: 'Professional Plan', value: 1290 }
    trackPlaceAnOrder(params.contentId, params.contentName, params.value)
    logEvent('PlaceAnOrder', params)
  }
  
  const testPurchase = () => {
    const params = { value: 1290, contentIds: ['professional-plan'] }
    trackPurchase(params.value, params.contentIds)
    logEvent('Purchase', params)
  }
  
  const testCompleteRegistration = () => {
    const params = { registrationMethod: 'email' }
    trackCompleteRegistration(params.registrationMethod)
    logEvent('CompleteRegistration', params)
  }
  
  const testLead = () => {
    const params = { value: 100 }
    trackLead(params.value)
    logEvent('Lead', params)
  }
  
  // Custom Naklikam Events
  const testProjectCreated = () => {
    const params = { projectType: 'landing-page' }
    trackProjectCreated(params.projectType)
    logEvent('ProjectCreated', params)
  }
  
  const testAIPromptSubmitted = () => {
    const params = { promptType: 'website-generation' }
    trackAIPromptSubmitted(params.promptType)
    logEvent('AIPromptSubmitted', params)
  }
  
  const testSubscriptionStarted = () => {
    const params = { plan: 'professional', value: 1290 }
    trackSubscriptionStarted(params.plan, params.value)
    logEvent('Subscribe', params)
  }
  
  const testDeploymentStarted = () => {
    const params = { deploymentType: 'vercel' }
    trackDeploymentStarted(params.deploymentType)
    logEvent('DeploymentStarted', params)
  }

  const testEventsAPI = async () => {
    try {
      const response = await fetch('/api/tiktok/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'ViewContent',
          properties: {
            content_id: 'test-product-123',
            content_name: 'Test Product from Events API',
            content_type: 'product', 
            value: 199,
            currency: 'CZK'
          },
          user: {
            email: user?.email || 'test@example.com',
            external_id: user?.id || 'test-user-id'
          }
        })
      })
      
      const result = await response.json()
      console.log('🎯 Events API Response:', result)
      
      if (response.ok && result.success) {
        logEvent('Events API Test', { status: 'success', event: 'ViewContent' }, true)
      } else {
        logEvent('Events API Test', { status: 'error', error: result.error }, false)
      }
    } catch (error) {
      console.error('❌ Events API Test failed:', error)
      logEvent('Events API Test', { status: 'error', error: error instanceof Error ? error.message : String(error) }, false)
    }
  }
  
  const testIdentify = async () => {
    if (!user) {
      logEvent('Identify', { error: 'No user logged in' }, false)
      return
    }
    
    setIsIdentifying(true)
    await identifyUser()
    setIsIdentifying(false)
    logEvent('Identify', { userId: user.id, email: user.email })
  }
  
  const checkPixelStatus = () => {
    const status = {
      metaPixel: !!(window as any).fbq,
      tiktokPixel: !!(window as any).ttq,
      googleAnalytics: !!(window as any).gtag,
      marketingConsent: preferences.marketing,
      hasInteracted,
      userLoggedIn: !!user
    }
    
    
    logEvent('Status Check', status)
  }
  
  const clearLogs = () => {
    setEventLogs([])
  }
  
  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 bg-naklikam-gradient bg-clip-text text-transparent">
        TikTok Pixel Test Page
      </h1>
      
      {/* Status Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Marketing consent:</span>
              {preferences.marketing ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">User logged in:</span>
              {user ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">TikTok Pixel:</span>
              {(window as any).ttq ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Meta Pixel:</span>
              {(window as any).fbq ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Has interacted:</span>
              {hasInteracted ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={checkPixelStatus} variant="outline" size="sm">
              Check Full Status
            </Button>
            <Button onClick={resetCookies} variant="outline" size="sm">
              Reset Cookies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Identification */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Identification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Test TikTok Pixel user identification (ttq.identify)
          </p>
          <Button 
            onClick={testIdentify} 
            disabled={!user || isIdentifying}
            className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark"
          >
            {isIdentifying ? 'Identifying...' : 'Test Identify User'}
          </Button>
          {!user && (
            <p className="text-sm text-red-500 mt-2">Please log in to test user identification</p>
          )}
        </CardContent>
      </Card>

      {/* Debug Test */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Debug Test - Direct TikTok Pixel Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              onClick={() => {
                if ((window as any).ttq) {
                    
                  // Test 1: ViewContent with proper parameters
                  try {
                    (window as any).ttq.track('ViewContent', {
                      contents: [{
                        content_id: 'test-page',
                        content_type: 'product',
                        content_name: 'Test Page'
                      }],
                      value: 100,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ ViewContent failed:', e)
                  }
                  
                  // Test 2: InitiateCheckout with contents
                  try {
                    (window as any).ttq.track('InitiateCheckout', {
                      contents: [{
                        content_id: 'professional-plan',
                        content_type: 'product',
                        content_name: 'Professional Plan',
                        quantity: 1
                      }],
                      value: 1290,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ InitiateCheckout failed:', e)
                  }
                  
                  // Test 3: AddToCart
                  try {
                    (window as any).ttq.track('AddToCart', {
                      contents: [{
                        content_id: 'starter-plan',
                        content_type: 'product',
                        content_name: 'Starter Plan',
                        quantity: 1
                      }],
                      value: 580,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ AddToCart failed:', e)
                  }
                  
                  // Test 4: AddPaymentInfo
                  try {
                    (window as any).ttq.track('AddPaymentInfo', {
                      contents: [{
                        content_id: 'professional-plan',
                        content_type: 'product',
                        content_name: 'Professional Plan',
                        quantity: 1
                      }],
                      value: 1290,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ AddPaymentInfo failed:', e)
                  }
                  
                  // Test 5: PlaceAnOrder
                  try {
                    (window as any).ttq.track('PlaceAnOrder', {
                      contents: [{
                        content_id: 'business-plan',
                        content_type: 'product',
                        content_name: 'Business Plan',
                        quantity: 1
                      }],
                      value: 2290,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ PlaceAnOrder failed:', e)
                  }
                  
                  // Test 6: Purchase
                  try {
                    (window as any).ttq.track('Purchase', {
                      contents: [{
                        content_id: 'unlimited-plan',
                        content_type: 'product',
                        content_name: 'Unlimited Plan',
                        quantity: 1
                      }],
                      value: 4970,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ Purchase failed:', e)
                  }
                  
                  // Test 7: CompleteRegistration
                  try {
                    (window as any).ttq.track('CompleteRegistration', {
                      contents: [{
                        content_id: 'user-registration',
                        content_type: 'product',
                        content_name: 'New User Registration'
                      }],
                      value: 0,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ CompleteRegistration failed:', e)
                  }
                  
                  // Test 8: Search
                  try {
                    (window as any).ttq.track('Search', {
                      search_string: 'landing page builder',
                      contents: [{
                        content_id: 'search-results',
                        content_type: 'product',
                        content_name: 'Search Results'
                      }],
                      value: 0,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ Search failed:', e)
                  }
                  
                  // Test 9: SubmitForm (Lead)
                  try {
                    (window as any).ttq.track('SubmitForm', {
                      contents: [{
                        content_id: 'contact-form',
                        content_type: 'product',
                        content_name: 'Contact Form'
                      }],
                      value: 100,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ SubmitForm failed:', e)
                  }
                  
                  // Test 10: Subscribe
                  try {
                    (window as any).ttq.track('Subscribe', {
                      contents: [{
                        content_id: 'professional-subscription',
                        content_type: 'product',
                        content_name: 'Professional Subscription'
                      }],
                      value: 1290,
                      currency: 'CZK'
                    });
                  } catch (e) {
                    console.error('❌ Subscribe failed:', e)
                  }
                  
                } else {
                }
              }}
              variant="default"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Test ALL TikTok Events Directly (Check Console)
            </Button>
            <p className="text-xs text-muted-foreground">
              This button sends all 10 TikTok events at once with proper parameters - watch console and TikTok Pixel Helper
            </p>
          </div>
        </CardContent>
      </Card>

      {/* E-commerce Events */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            E-commerce Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Button onClick={testPageView} variant="outline" size="sm">
              PageView
            </Button>
            <Button onClick={testViewContent} variant="outline" size="sm">
              ViewContent
            </Button>
            <Button onClick={testSearch} variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search
            </Button>
            <Button onClick={testAddToCart} variant="outline" size="sm">
              AddToCart
            </Button>
            <Button onClick={testAddPaymentInfo} variant="outline" size="sm" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              AddPaymentInfo
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                testInitiateCheckout()
              }} 
              variant="outline" 
              size="sm"
            >
              InitiateCheckout
            </Button>
            <Button onClick={testPlaceAnOrder} variant="outline" size="sm" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              PlaceAnOrder
            </Button>
            <Button onClick={testPurchase} variant="outline" size="sm">
              Purchase
            </Button>
            <Button onClick={testCompleteRegistration} variant="outline" size="sm">
              CompleteRegistration
            </Button>
            <Button onClick={testLead} variant="outline" size="sm">
              Lead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Events */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Custom Naklikam Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={testProjectCreated} variant="outline" size="sm">
              ProjectCreated
            </Button>
            <Button onClick={testAIPromptSubmitted} variant="outline" size="sm">
              AIPromptSubmitted
            </Button>
            <Button onClick={testSubscriptionStarted} variant="outline" size="sm">
              SubscriptionStarted
            </Button>
            <Button onClick={testDeploymentStarted} variant="outline" size="sm">
              DeploymentStarted
            </Button>
            <Button onClick={testEventsAPI} variant="outline" size="sm" className="bg-purple-100 hover:bg-purple-200 text-purple-800">
              🎯 Test Events API
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Event Logs</span>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {eventLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events triggered yet
              </p>
            ) : (
              eventLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`p-3 rounded-lg border ${
                    log.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{log.eventName}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {log.parameters && (
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(log.parameters, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p className="mb-2">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Open browser console (F12) to see detailed debug logs</li>
          <li>Install TikTok Pixel Helper browser extension to verify events</li>
          <li>Events will only fire if marketing consent is given</li>
          <li>User identification requires being logged in</li>
        </ul>
      </div>
    </div>
  )
}