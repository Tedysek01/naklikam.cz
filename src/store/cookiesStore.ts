import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Extend Window interface for tracking pixels
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    fbq: (...args: any[]) => void
    ttq: (...args: any[]) => void
  }
}

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

interface CookiesStore {
  preferences: CookiePreferences
  showBanner: boolean
  hasInteracted: boolean
  setPreferences: (preferences: Partial<CookiePreferences>) => void
  acceptAll: () => void
  rejectAll: () => void
  hideBanner: () => void
  showSettings: () => void
  initializeTracking: () => void
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Vždy povolené
  analytics: false,
  marketing: false,
  functional: false,
}

export const useCookiesStore = create<CookiesStore>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      showBanner: true,
      hasInteracted: false,

      setPreferences: (newPreferences) => {
        const updatedPreferences = { ...get().preferences, ...newPreferences }
        set({ 
          preferences: updatedPreferences, 
          hasInteracted: true,
          showBanner: false 
        })
        get().initializeTracking()
      },

      acceptAll: () => {
        const allAccepted: CookiePreferences = {
          necessary: true,
          analytics: true,
          marketing: true,
          functional: true,
        }
        set({ 
          preferences: allAccepted, 
          hasInteracted: true,
          showBanner: false 
        })
        get().initializeTracking()
      },

      rejectAll: () => {
        set({ 
          preferences: defaultPreferences, 
          hasInteracted: true,
          showBanner: false 
        })
        get().initializeTracking()
      },

      hideBanner: () => {
        set({ showBanner: false })
      },

      showSettings: () => {
        set({ showBanner: true })
      },

      initializeTracking: async () => {
        const { preferences } = get()
        console.log('[CookiesStore] Initializing tracking with preferences:', preferences)
        
        // Google Analytics
        if (preferences.analytics && typeof window !== 'undefined') {
          if (!window.gtag) {
            const script1 = document.createElement('script')
            script1.async = true
            script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-V6XTCVRS6V'
            document.head.appendChild(script1)

            const script2 = document.createElement('script')
            script2.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-V6XTCVRS6V', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            `
            document.head.appendChild(script2)
            ;(window as any).gtag = function() {
              ;(window as any).dataLayer.push(arguments)
            }
          }
        }

        // Meta Pixel and TikTok Pixel are loaded via HTML, but we need to trigger PageView if consent is given
        if (preferences.marketing && typeof window !== 'undefined') {
          console.log('[CookiesStore] Marketing consent given, initializing pixels...')
          
          // Initialize Meta Pixel if loaded but not yet tracking
          if ((window as any).fbq) {
            console.log('[CookiesStore] Sending Meta Pixel PageView')
            try {
              (window as any).fbq('track', 'PageView')
            } catch (e) {
              console.error('Meta Pixel PageView failed:', e)
            }
          }
          
          // Initialize TikTok Pixel if loaded
          if ((window as any).ttq) {
            console.log('[CookiesStore] TikTok Pixel available - tracking allowed')
            // TikTok pixel is already loaded and tracking via ttq.page() in HTML
          } else {
            console.warn('[CookiesStore] TikTok pixel not loaded yet')
          }
        } else {
          console.log('[CookiesStore] Marketing consent not given or window not available')
          
          // TikTok tracking will be disabled through consent check in analytics
          console.log('[CookiesStore] TikTok tracking disabled - events will be blocked by consent check')
        }

        // Google Ads
        if (preferences.marketing && typeof window !== 'undefined') {
          if (!(window as any).gtag) {
            const script1 = document.createElement('script')
            script1.async = true
            script1.src = 'https://www.googletagmanager.com/gtag/js?id=AW-CONVERSION_ID'
            document.head.appendChild(script1)

            const script2 = document.createElement('script')
            script2.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-CONVERSION_ID');
            `
            document.head.appendChild(script2)
          }
        }
        
        // If marketing cookies are enabled, identify user for TikTok
        if (preferences.marketing) {
          // Import dynamically to avoid circular dependency
          const { identifyUser } = await import('@/utils/analytics')
          await identifyUser()
        }
      },
    }),
    {
      name: 'cookies-preferences',
      partialize: (state) => ({ 
        preferences: state.preferences, 
        hasInteracted: state.hasInteracted 
      }),
    }
  )
)