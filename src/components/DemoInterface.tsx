import { useState, useEffect } from 'react'
import { ChevronRight, Send, FileText, FolderOpen, Eye, Code, Sparkles } from 'lucide-react'
import Logo from '@/components/ui/logo'

// Inline UI Components

export default function DemoInterface() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const steps = [
    {
      message: "Vytvoř mi jednoduchý e-shop s produkty",
      code: `export default function EShop() {
  const [cart, setCart] = useState([])
  
  const products = [
    { id: 1, name: "Smartphone", price: 12999 },
    { id: 2, name: "Notebook", price: 24999 },
    { id: 3, name: "Sluchátka", price: 1999 }
  ]
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold font-display mb-6">E-Shop</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  )
}`
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 5)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setIsTyping(true)
    setDisplayedText('')
    setShowCode(false)
    setShowPreview(false)
    
    const text = steps[0].message
    let index = 0
    
    const typingInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(typingInterval)
        
        setTimeout(() => setShowCode(true), 500)
        setTimeout(() => setShowPreview(true), 1500)
      }
    }, 50)
    
    return () => clearInterval(typingInterval)
  }, [currentStep])

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-2xl max-w-6xl mx-auto mt-16">
      {/* Top Bar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-muted-foreground ml-2">Naklikam.cz IDE</span>
        </div>
        <div className="text-xs text-muted-foreground">Živá ukázka</div>
      </div>

      <div className="grid lg:grid-cols-3 min-h-[600px]">
        {/* Left Sidebar - File Explorer */}
        <div className="bg-background/50 border-r border-border p-4 lg:col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Projekt</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-card cursor-pointer">
              <ChevronRight className="h-3 w-3" />
              <FileText className="h-3 w-3 text-blue-500" />
              <span>package.json</span>
            </div>
            <div className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer ${showCode ? 'bg-naklikam-pink-500/20 text-naklikam-pink-600' : 'hover:bg-card'}`}>
              <ChevronRight className="h-3 w-3" />
              <FileText className="h-3 w-3 text-green-500" />
              <span>EShop.tsx</span>
              {showCode && <div className="ml-auto w-2 h-2 bg-naklikam-pink-500 rounded-full animate-pulse" />}
            </div>
            <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-card cursor-pointer">
              <ChevronRight className="h-3 w-3" />
              <FileText className="h-3 w-3 text-yellow-500" />
              <span>index.html</span>
            </div>
          </div>
        </div>

        {/* Middle - Code Editor */}
        <div className="bg-background border-r border-border lg:col-span-1 flex flex-col">
          <div className="border-b border-border p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Editor</span>
            </div>
            <div className="flex space-x-2">
              <Eye className={`h-4 w-4 cursor-pointer ${showPreview ? 'text-naklikam-pink-500' : 'text-muted-foreground'}`} />
            </div>
          </div>
          <div className="flex-1 p-4 font-mono text-sm overflow-auto">
            {showCode ? (
              <pre className="text-muted-foreground">
                <code className="animate-fade-in">{steps[0].code}</code>
              </pre>
            ) : (
              <div className="text-muted-foreground/50">Čekám na AI odpověď...</div>
            )}
          </div>
        </div>

        {/* Right - Chat + Preview */}
        <div className="lg:col-span-1 flex flex-col">
          {/* Chat Area */}
          <div className="flex-1 border-b border-border p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-4 w-4 text-naklikam-pink-500" />
              <span className="text-sm font-medium">AI Asistent</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-naklikam-gradient flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white font-bold">JA</span>
                </div>
                <div className="bg-card p-3 rounded-lg max-w-[80%]">
                  <p className="text-sm">{displayedText}{isTyping && <span className="animate-pulse">|</span>}</p>
                </div>
              </div>
              
              {showCode && (
                <div className="flex items-start space-x-2 animate-fade-in">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Logo size="sm" />
                  </div>
                  <div className="bg-naklikam-pink-500/10 border border-naklikam-pink-500/20 p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm">Vytvářím pro vás e-shop komponentu...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Preview Area */}
          {showPreview && (
            <div className="h-48 bg-white border-t border-border p-4 animate-fade-in">
              <div className="text-xs text-muted-foreground mb-2">Náhled</div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-display">E-Shop</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-100 p-2 rounded text-xs">
                    <div className="font-medium">Smartphone</div>
                    <div className="text-gray-600">12 999 Kč</div>
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-xs">
                    <div className="font-medium">Notebook</div>
                    <div className="text-gray-600">24 999 Kč</div>
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-xs">
                    <div className="font-medium">Sluchátka</div>
                    <div className="text-gray-600">1 999 Kč</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="border-t border-border p-3">
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Napište, co chcete vytvořit..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-naklikam-pink-500"
              />
              <button className="bg-naklikam-gradient p-2 rounded-lg hover:bg-naklikam-gradient-dark transition-colors">
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}