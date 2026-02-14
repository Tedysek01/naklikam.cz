import { create } from 'zustand'
import { User } from '@/types'
import { auth } from '@/config/firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth'
import { subscriptionService } from '@/services/subscriptionService'
import { trackCompleteRegistration, identifyUser } from '@/utils/analytics'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
  initAuth: () => () => void
  updateSubscription: (subscription: any) => void
}

// Admin emails - add your admin emails here
const ADMIN_EMAILS = ['admin@naklikam.cz']

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  error: null,

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Load subscription data - only if user is fully authenticated
        let subscription = null
        try {
          subscription = await subscriptionService.getSubscription(firebaseUser.uid)
        } catch (error) {
          console.warn('Could not load subscription data:', error)
          // Continue without subscription - user might need to purchase
        }
        
        const user: User = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
          subscription: subscription ? {
            plan: subscription.plan,
            tokens: subscription.tokens,
            tokensUsed: subscription.tokensUsed,
            tokensLimit: subscription.tokensLimit,
            credits: subscription.credits,
            contentAddon: subscription.contentAddon || undefined,
            expiresAt: subscription.expiresAt,
            createdAt: subscription.createdAt,
            isLegacyPricing: subscription.isLegacyPricing,
            stripeCustomerId: subscription.stripeCustomerId,
            stripeSubscriptionId: subscription.stripeSubscriptionId
          } : undefined
        }
        
        const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '')
        console.log('Auth State - Email:', firebaseUser.email, 'Is Admin:', isAdmin, 'Admin Emails:', ADMIN_EMAILS)
        set({ user, isAuthenticated: true, isAdmin, isLoading: false })
        
        // Identify user for TikTok Pixel after auth state change
        setTimeout(() => identifyUser(), 100) // Small delay to ensure state is updated
      } else {
        set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
      }
    })

    return unsubscribe
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Load subscription data
      const subscription = await subscriptionService.getSubscription(userCredential.user.uid)
      
      const user: User = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || email.split('@')[0],
        avatar: userCredential.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        subscription: subscription ? {
          plan: subscription.plan,
          tokens: subscription.tokens,
          tokensUsed: subscription.tokensUsed,
          tokensLimit: subscription.tokensLimit,
          credits: subscription.credits || 0,
          contentAddon: subscription.contentAddon || undefined,
          expiresAt: subscription.expiresAt,
          createdAt: subscription.createdAt,
          isLegacyPricing: subscription.isLegacyPricing,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId
        } : undefined
      }
      
      const isAdmin = ADMIN_EMAILS.includes(userCredential.user.email || '')
      set({ user, isAuthenticated: true, isAdmin, isLoading: false })
      
      // Identify user for TikTok Pixel
      identifyUser()
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null })
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      })

      // No automatic subscription for new users - they need to purchase one

      const user: User = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        subscription: undefined // No subscription by default for new users
      }
      
      const isAdmin = ADMIN_EMAILS.includes(userCredential.user.email || '')
      set({ user, isAuthenticated: true, isAdmin, isLoading: false })
      
      // Track registration completion with small delay to ensure pixel tracking
      trackCompleteRegistration('email')
      
      // Identify user for TikTok Pixel
      await identifyUser()
      
      // Small delay to ensure tracking is sent before navigation
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await signOut(auth)
      set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null })
    try {
      await sendPasswordResetEmail(auth, email)
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },
  
  updateSubscription: (subscription: any) => {
    set((state) => ({
      user: state.user ? {
        ...state.user,
        subscription: subscription ? {
          plan: subscription.plan,
          tokens: subscription.tokens,
          tokensUsed: subscription.tokensUsed,
          tokensLimit: subscription.tokensLimit,
          credits: subscription.credits || 0,
          contentAddon: subscription.contentAddon || undefined,
          expiresAt: subscription.expiresAt,
          createdAt: subscription.createdAt,
          isLegacyPricing: subscription.isLegacyPricing,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId
        } : undefined
      } : null
    }))
  }
}))