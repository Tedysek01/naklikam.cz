import type { User } from '@/types'

export const DEPLOYMENT_PLANS = ['trial', 'starter', 'professional', 'pro', 'business', 'unlimited'] as const
export const STARTER_PLAN = 'starter' as const
export const FREE_PLAN = 'free' as const
export const CODE_ACCESS_PLANS = ['trial', 'starter', 'professional', 'pro', 'business', 'unlimited'] as const

export function canAccessDeployment(user: User | null): boolean {
  if (!user?.subscription?.plan) return false
  
  const plan = user.subscription.plan.toLowerCase()
  return DEPLOYMENT_PLANS.includes(plan as any)
}

export function isStarterPlan(user: User | null): boolean {
  if (!user?.subscription?.plan) return true // Default to starter behavior
  
  const plan = user.subscription.plan.toLowerCase()
  return plan === STARTER_PLAN
}

export function isFreePlan(user: User | null): boolean {
  if (!user?.subscription?.plan) return false
  
  const plan = user.subscription.plan.toLowerCase()
  return plan === FREE_PLAN
}

export function canViewCode(user: User | null): boolean {
  if (!user?.subscription?.plan) return false
  
  const plan = user.subscription.plan.toLowerCase()
  return CODE_ACCESS_PLANS.includes(plan as any)
}

export function canDownloadCode(user: User | null): boolean {
  if (!user?.subscription?.plan) return false
  
  const plan = user.subscription.plan.toLowerCase()
  return CODE_ACCESS_PLANS.includes(plan as any)
}

export function getUpgradeMessage(feature: 'deployment' | 'github' | 'code_view' | 'code_download'): string {
  switch (feature) {
    case 'deployment':
      return 'Deployment a GitHub integrace jsou dostupné od Starter plánu. Upgraduj pro automatické nasazování tvých projektů!'
    case 'github':
      return 'GitHub integrace je dostupná od Starter plánu. Upgraduj pro synchronizaci s repozitáři!'
    case 'code_view':
      return 'Pro zobrazení kódu je potřeba předplatné. Získej Starter plán!'
    case 'code_download':
      return 'Pro stažení kódu je potřeba předplatné. Získej Starter plán a stahuj své projekty jako ZIP!'
    default:
      return 'Tato funkce je dostupná s předplatným.'
  }
}