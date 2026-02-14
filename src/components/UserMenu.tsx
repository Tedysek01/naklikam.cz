import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { 
  CreditCard, 
  LogOut, 
  ChevronDown,
  Shield,
  HelpCircle
} from 'lucide-react'

export function UserMenu() {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  
  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const subscriptionBadge = user.subscription ? (
    <span className={`text-xs px-2 py-0.5 rounded-full ${
      user.subscription.plan === 'unlimited' 
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
        : user.subscription.plan === 'business'
        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
        : user.subscription.plan === 'professional'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }`}>
      {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
    </span>
  ) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 hover:bg-muted group"
        >
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="h-8 w-8 rounded-full"
          />
          <span className="text-sm font-medium group-hover:text-pink-400 transition-colors">{user.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isAdmin && (
          <>
            <DropdownMenuItem 
              className="cursor-pointer text-destructive" 
              onClick={() => navigate('/admin')}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={() => navigate('/subscription')}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          <div className="flex items-center justify-between w-full">
            <span>Předplatné</span>
            {subscriptionBadge}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={() => navigate('/navody')}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Návody</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Odhlásit se</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}