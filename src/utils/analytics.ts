import { useCookiesStore } from '@/store/cookiesStore'
import { hashEmail, hashExternalId } from './crypto'
import { useAuthStore } from '@/store/authStore'

// Helper function to send events to TikTok Events API
const sendToEventsAPI = async (eventName: string, properties: Record<string, any> = {}) => {
  const { preferences } = useCookiesStore.getState()
  const { user } = useAuthStore.getState()
  
  console.log(`📡 sendToEventsAPI called for ${eventName}:`, { properties, hasMarketingConsent: preferences.marketing })
  
  // Only send if user consented to marketing cookies
  if (!preferences.marketing) {
    console.warn(`❌ ${eventName} API call blocked - no marketing consent`)
    return
  }
  
  try {
    const userData: Record<string, any> = {}
    
    if (user?.email) {
      userData.email = user.email
    }
    if (user?.id) {
      userData.external_id = user.id
    }
    
    const payload = {
      event: eventName,
      properties: {
        ...properties,
        page_url: window.location.href,
      },
      user: userData,
    }
    
    console.log(`🚀 Sending ${eventName} to TikTok Events API:`, payload)
    
    const response = await fetch('/api/tiktok/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    
    const result = await response.json()
    console.log(`✅ ${eventName} API response:`, result)
  } catch (error) {
    console.error('Failed to send event to TikTok Events API:', error)
  }
}

// TikTok user identification
export const identifyUser = async () => {
  const { preferences } = useCookiesStore.getState()
  const { user } = useAuthStore.getState()
  
  // Only identify if user consented to marketing cookies and is logged in
  if (!preferences.marketing || typeof window === 'undefined' || !user) return
  
  // Check if TikTok Pixel is loaded
  if (!(window as any).ttq) return
  
  try {
    const hashedEmail = await hashEmail(user.email)
    const hashedExternalId = await hashExternalId(user.id)
    
    const identifyData: any = {}
    if (hashedEmail) identifyData.email = hashedEmail
    if (hashedExternalId) identifyData.external_id = hashedExternalId
    
    if (Object.keys(identifyData).length > 0) {
      (window as any).ttq.identify(identifyData)
    }
  } catch (error) {
    console.error('Failed to identify user for TikTok Pixel:', error)
  }
}

// Meta Pixel event tracking
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  const { preferences } = useCookiesStore.getState()
  
  
  // Only track if user consented to marketing cookies
  if (!preferences.marketing || typeof window === 'undefined') {
    return
  }
  
  // Send to TikTok Events API (server-side)
  sendToEventsAPI(eventName, parameters)
  
  // Track in Meta Pixel
  if ((window as any).fbq) {
    try {
      (window as any).fbq('track', eventName, parameters);
    } catch (error) {
      console.error('Failed to track Meta Pixel event:', error)
    }
  }
  
  // Track in TikTok Pixel
  if ((window as any).ttq) {
    try {
      console.log(`[Analytics] Tracking TikTok event: ${eventName}`, parameters)
      
      // Map Meta Pixel events to TikTok events
      const tiktokEventMap: Record<string, string> = {
        'PageView': 'page',
        'ViewContent': 'ViewContent',
        'Search': 'Search',
        'AddToCart': 'AddToCart',
        'AddPaymentInfo': 'AddPaymentInfo',
        'InitiateCheckout': 'InitiateCheckout',
        'Purchase': 'Purchase',
        'CompleteRegistration': 'CompleteRegistration',
        'Lead': 'SubmitForm',
        'Subscribe': 'Subscribe',
        'PlaceAnOrder': 'PlaceAnOrder'
      }
      
      const tiktokEvent = tiktokEventMap[eventName] || eventName
      console.log(`[Analytics] Mapped to TikTok event: ${tiktokEvent}`)
      
      if (tiktokEvent === 'page') {
        (window as any).ttq.page();
        console.log('[Analytics] TikTok PageView sent')
      } else {
        // Convert parameters for TikTok format with proper contents structure
        const tiktokParams: any = {}
        
        // Build contents array if we have content information
        if (parameters?.content_ids || parameters?.content_name || parameters?.content_type || parameters?.content_id) {
          tiktokParams.contents = [{
            content_id: parameters.content_ids?.[0] || parameters.content_id || parameters.content_name || 'default',
            content_type: parameters.content_type || 'product',
            content_name: parameters.content_name || '',
            quantity: parameters.quantity || 1
          }]
        }
        
        // For ViewContent, ensure we always have contents array
        if (eventName === 'ViewContent' && !tiktokParams.contents) {
          tiktokParams.contents = [{
            content_id: parameters?.content_category || 'page-view',
            content_type: 'product',
            content_name: parameters?.content_name || 'Page View'
          }]
        }
        
        // Add other parameters - TikTok always requires value parameter
        tiktokParams.value = parameters?.value || 0
        tiktokParams.currency = parameters?.currency || 'CZK'
        if (parameters?.search_string) tiktokParams.search_string = parameters.search_string
        if (parameters?.query) tiktokParams.query = parameters.query
        
        console.log(`[Analytics] TikTok ${tiktokEvent} params:`, tiktokParams)
        ;(window as any).ttq.track(tiktokEvent, tiktokParams)
        console.log(`🎯 TikTok ${tiktokEvent} called - check TikTok Pixel Helper or Events Manager to verify actual delivery`)
        
        // Log pixel status for debugging
        console.log('[Debug] TikTok Pixel Status:', {
          pixelLoaded: !!(window as any).ttq,
          marketingConsent: preferences.marketing,
          eventName: tiktokEvent,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to track TikTok Pixel event:', error)
    }
  } else {
    console.warn('[Analytics] TikTok pixel not available')
  }
}

// Standard e-commerce events
export const trackPageView = () => trackEvent('PageView')
export const trackViewContent = (contentName: string, contentCategory: string, value?: number) => {
  trackEvent('ViewContent', {
    content_name: contentName,
    content_category: contentCategory,
    content_id: contentCategory, // Required for TikTok
    content_type: 'product',
    value: value || 0,
    currency: 'CZK'
  })
}
export const trackSearch = (searchString: string) => {
  trackEvent('Search', { search_string: searchString })
}
export const trackAddToCart = (contentId: string, contentName: string, value: number) => {
  trackEvent('AddToCart', {
    content_ids: [contentId],
    content_id: contentId, // Add for TikTok
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: 'CZK'
  })
}
export const trackInitiateCheckout = (value: number, numItems: number, plan?: string) => {
  trackEvent('InitiateCheckout', {
    value: value,
    currency: 'CZK',
    num_items: numItems,
    content_ids: [plan || 'subscription'],
    content_id: plan || 'subscription', // Required for TikTok
    content_name: plan ? `${plan} subscription` : 'subscription',
    content_type: 'product'
  })
}
export const trackPurchase = (value: number, contentIds: string[]) => {
  console.log('🛒 trackPurchase called:', { value, contentIds })
  
  const { preferences } = useCookiesStore.getState()
  console.log('🍪 Cookie preferences:', preferences)
  
  if (!preferences.marketing) {
    console.warn('❌ Purchase tracking blocked - no marketing consent')
    return
  }
  
  const purchaseParams = {
    value: value,
    currency: 'CZK',
    content_ids: contentIds,
    content_id: contentIds[0] || 'purchase', // Required for TikTok
    content_name: contentIds[0] || 'Purchase',
    content_type: 'product'
  }
  
  console.log('🎯 Tracking Purchase event with params:', purchaseParams)
  trackEvent('Purchase', purchaseParams)
}
export const trackCompleteRegistration = (registrationMethod?: string) => {
  trackEvent('CompleteRegistration', {
    registration_method: registrationMethod,
    content_id: 'user-registration', // Required for TikTok
    content_name: 'User Registration',
    content_type: 'service',
    value: 0,
    currency: 'CZK'
  })
}
export const trackLead = (value?: number) => {
  trackEvent('Lead', {
    value: value,
    currency: 'CZK',
    content_id: 'lead-form',
    content_name: 'Lead Form',
    content_type: 'service'
  })
}

// TikTok specific events
export const trackAddPaymentInfo = (contentId: string, contentName: string, value: number) => {
  trackEvent('AddPaymentInfo', {
    content_ids: [contentId],
    content_id: contentId, // Required for TikTok
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: 'CZK'
  })
}

export const trackPlaceAnOrder = (contentId: string, contentName: string, value: number) => {
  trackEvent('PlaceAnOrder', {
    content_ids: [contentId],
    content_id: contentId, // Required for TikTok
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: 'CZK'
  })
}

// Custom events for naklikam.cz
export const trackProjectCreated = (projectType: string) => {
  trackEvent('ProjectCreated', {
    project_type: projectType,
    content_category: 'project_creation',
    content_id: `project-${projectType}`,
    content_name: `Project ${projectType}`,
    content_type: 'service'
  })
}
export const trackAIPromptSubmitted = (promptType: string) => {
  trackEvent('AIPromptSubmitted', {
    prompt_type: promptType,
    content_category: 'ai_interaction',
    content_id: `ai-prompt-${promptType}`,
    content_name: `AI Prompt ${promptType}`,
    content_type: 'service'
  })
}
export const trackSubscriptionStarted = (plan: string, value: number) => {
  trackEvent('Subscribe', {
    plan: plan,
    value: value,
    currency: 'CZK',
    predicted_ltv: value * 12, // Assuming yearly value
    content_id: `subscription-${plan}`,
    content_name: `${plan} subscription`,
    content_type: 'product'
  })
}
export const trackDeploymentStarted = (deploymentType: string) => {
  trackEvent('DeploymentStarted', {
    deployment_type: deploymentType,
    content_category: 'deployment',
    content_id: `deployment-${deploymentType}`,
    content_name: `Deployment ${deploymentType}`,
    content_type: 'service'
  })
}