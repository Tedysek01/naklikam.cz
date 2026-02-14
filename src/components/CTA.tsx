import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Logo from '@/components/ui/logo'

// Inline UI Components
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'lg' ? 'px-8 py-4 text-lg' : size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-pink-500/50 bg-transparent text-pink-400 hover:bg-pink-500/10 hover:border-pink-500' :
      variant === 'ghost' ? 'text-pink-300 hover:bg-pink-500/10' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)


export default function CTA() {
  return (
    <div className="mt-24 md:mt-32 mb-16 md:mb-24">
      <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-border p-8 md:p-12 text-center overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-naklikam-pink-500/5 via-naklikam-purple-500/10 to-naklikam-pink-500/5" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
            <Logo size="md" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
            Připraveni vytvořit svůj{' '}
            <span className="bg-naklikam-gradient bg-clip-text text-transparent">první projekt?</span>
          </h2>
          
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Začněte už dnes a objevte, jak jednoduché může být vytváření webů pomocí AI
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-lg px-8 py-4 group">
                Začít tvořit
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link to="/pricing">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 border-naklikam-pink-500/30 text-naklikam-pink-500 hover:bg-naklikam-pink-500 hover:text-white"
              >
                Zobrazit ceny
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            ✨ Rychlý start • 🎯 Česky • 🚀 Okamžité nasazení
          </p>
        </div>
      </div>
    </div>
  )
}