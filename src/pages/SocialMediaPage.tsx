import { useState } from 'react'
import { MapPin, Clock, Phone, Mail, Heart, Star, Award, Users, Instagram, TrendingUp, Camera } from 'lucide-react'

const SocialMediaPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    service: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Děkujeme za váš zájem! Ozveme se vám do 24 hodin na telefon ' + formData.phone)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-violet-100">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 bg-white/30 rounded-2xl"></div>
                <span className="text-2xl relative z-10 drop-shadow-md">📱</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">Sociální Síla</h1>
                <p className="text-xs text-gray-600 font-medium">Brno • Social Media agentura</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sluzby" className="text-gray-700 hover:text-violet-600 transition-colors font-medium">Naše služby</a>
              <a href="#cenik" className="text-gray-700 hover:text-violet-600 transition-colors font-medium">Ceník</a>
              <a href="#portfolio" className="text-gray-700 hover:text-violet-600 transition-colors font-medium">Portfolio</a>
              <a href="#kontakt" className="text-gray-700 hover:text-violet-600 transition-colors font-medium">Kontakt</a>
            </div>

            {/* Contact Info */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-violet-600" />
                <span className="text-gray-700 font-medium">+420 774 123 456</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-violet-600" />
                <span className="text-gray-700">Po-Pá 9:00-18:00</span>
              </div>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Fullscreen centered */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-violet-300 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-purple-300 rounded-full opacity-15 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-indigo-300 rounded-full opacity-25 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          {/* Live status badge */}
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full mb-8 shadow-lg border border-violet-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">LIVE</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-sm text-gray-600">Spravujeme více než 50 účtů</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-sm text-violet-600 font-medium">2,5M+ dosah tento měsíc</span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-tight max-w-5xl mx-auto">
            Budujeme vaši 
            <span className="block text-violet-600">
              digitální přítomnost
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Profesionální správa sociálních sítí založená na datech pro firmy, které chtějí růst. 
            <strong className="text-violet-600">Více než 200 úspěšných projektů</strong> od roku 2016.
          </p>
          
          {/* Social proof metrics */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">+150%</div>
                <div className="text-sm text-gray-600">Průměrný růst</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">200+</div>
                <div className="text-sm text-gray-600">Spokojených klientů</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">4.8/5</div>
                <div className="text-sm text-gray-600">Google hodnocení</div>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="#audit" 
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3"
            >
              <Camera className="h-6 w-6" />
              Konzultace zdarma
              <span className="bg-white/20 px-2 py-1 rounded-lg text-sm">30 min</span>
            </a>
            <a 
              href="#vysledky" 
              className="bg-white/90 backdrop-blur-sm text-gray-800 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white transition-all border-2 border-violet-200 hover:border-violet-400 flex items-center gap-3"
            >
              <span>📊</span>
              Ukázat výsledky
            </a>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-violet-600">
          <span className="text-sm font-medium">Scroll dolů</span>
          <div className="w-6 h-10 border-2 border-violet-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-violet-500 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Ultra-modern Audit Section */}
      <section id="audit" className="relative py-32 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-violet-900 to-indigo-900">
          <div className="absolute inset-0 opacity-40 bg-gray-800/20"></div>
          <div className="absolute top-20 left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-sm font-medium">Zdarma pro prvních 10 firem tento měsíc</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                Odhalíme váš skrytý 
                <span className="block text-violet-400">
                  potenciál za 30 minut
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Získejte detailní roadmapu k růstu vašich sociálních sítí
              </p>
            </div>
            
            {/* Interactive cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              <div className="group">
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-violet-400/50 transition-all duration-500 hover:scale-105 hover:bg-white/15">
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    1
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500 shadow-2xl">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">Audit obsahu</h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Prošetříme každý váš příspěvek a odhalíme, co funguje a co ne
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-violet-400">
                      <span className="text-sm font-medium">Analýza posledních 3 měsíců</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:bg-white/15">
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    2
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500 shadow-2xl">
                    <span className="text-3xl">🥊</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">Konkurenční boj</h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Ukážeme vám tajné zbraně vašich nejúspěšnějších konkurentů
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-purple-400">
                      <span className="text-sm font-medium">Top 5 konkurentů</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-indigo-400/50 transition-all duration-500 hover:scale-105 hover:bg-white/15">
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    3
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500 shadow-2xl">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">Raketa k růstu</h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Dostanete detailní plán s konkrétními kroky na příštích 90 dní
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-indigo-400">
                      <span className="text-sm font-medium">90denní roadmapa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA with timer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl mb-8 border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Zbývá pouze</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-violet-500 text-white px-3 py-1 rounded-lg font-bold text-lg">4</span>
                  <span className="text-white/80">volných míst</span>
                </div>
              </div>
              
              <a href="#kontakt" className="group relative bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-violet-500/25 inline-flex items-center gap-4">
                <Camera className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                <span>Rezervovat konzultaci zdarma</span>
                <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">
                  30 min
                </div>
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
              </a>
              
              <p className="text-gray-400 text-sm mt-4">
                ✨ Žádné závazky • 🎯 Konkrétní tipy • 💡 Okamžité poznatky
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Ultra-modern Results Section */}
      <section id="vysledky" className="relative py-32 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 text-sm font-medium">Měřitelné výsledky každý měsíc</span>
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
              Firmy, které s námi 
              <span className="block text-violet-600">
                vystřelily k hvězdám
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Každý měsíc pomáháme desítkám firem v Brně a okolí dominovat na sociálních sítích
            </p>
          </div>
          
          {/* Interactive case studies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
            {/* Kavárna - Success story */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  +340%
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">☕</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">🏆</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Kavárna Šiška</h3>
                    <p className="text-green-600 font-medium">Brno - Veveří • 6 měsíců</p>
                  </div>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Followers</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">340%</div>
                      <div className="text-xs text-gray-500">růst</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Engagement</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">8.2%</div>
                      <div className="text-xs text-gray-500">průměr</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Noví zákazníci</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">+180</div>
                      <div className="text-xs text-gray-500">měsíčně</div>
                    </div>
                  </div>
                </div>
                
                <div className="relative p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="absolute -top-2 left-4 text-4xl text-green-300">“</div>
                  <p className="text-gray-700 font-medium italic pl-6">
                    Díky agentuře Sociální Síla se náš obrat zvýšil o 65 %. Rozhodně doporučujeme!
                  </p>
                  <div className="flex items-center gap-3 mt-4 pl-6">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      JŠ
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Jana Šišková</div>
                      <div className="text-xs text-gray-500">Majitelka</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Finanční studio */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute -top-4 -right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  ROI 450%
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">💼</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">💰</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Finanční studio</h3>
                    <p className="text-blue-600 font-medium">B2B • 8 měsíců</p>
                  </div>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">LinkedIn reach</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">520%</div>
                      <div className="text-xs text-gray-500">růst</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">Kvalitní leady</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">45</div>
                      <div className="text-xs text-gray-500">měsíčně</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">Uzavřené obchody</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-xs text-gray-500">měsíčně</div>
                    </div>
                  </div>
                </div>
                
                <div className="relative p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <div className="absolute -top-2 left-4 text-4xl text-blue-300">“</div>
                  <p className="text-gray-700 font-medium italic pl-6">
                    ROI 450 %. Nejlepší investice do marketingu za poslední roky.
                  </p>
                  <div className="flex items-center gap-3 mt-4 pl-6">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      PN
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Petr Novák</div>
                      <div className="text-xs text-gray-500">Ředitel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Beauty Lounge */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute -top-4 -right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  +450%
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">💅</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">✨</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Beauty Lounge</h3>
                    <p className="text-purple-600 font-medium">Královo Pole • 4 měsíce</p>
                  </div>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700 font-medium">Followers</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">280%</div>
                      <div className="text-xs text-gray-500">růst</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700 font-medium">Rezervace</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">450%</div>
                      <div className="text-xs text-gray-500">růst</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700 font-medium">Tržby</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">+165%</div>
                      <div className="text-xs text-gray-500">růst</div>
                    </div>
                  </div>
                </div>
                
                <div className="relative p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                  <div className="absolute -top-2 left-4 text-4xl text-purple-300">“</div>
                  <p className="text-gray-700 font-medium italic pl-6">
                    Konečně máme plně obsazenou knihu rezervací. Výborná práce!
                  </p>
                  <div className="flex items-center gap-3 mt-4 pl-6">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      TK
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Tereza Krásná</div>
                      <div className="text-xs text-gray-500">Majitelka</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats overview */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl mb-20">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Celkové výsledky za poslední rok
              </h3>
              <p className="text-gray-600">Souhrnná statistika všech našich klientů</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl">
                <div className="text-3xl md:text-4xl font-black text-violet-600 mb-2">+285%</div>
                <div className="text-sm text-gray-600 font-medium">Průměrný růst dosahu</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <div className="text-3xl md:text-4xl font-black text-green-600 mb-2">50+</div>
                <div className="text-sm text-gray-600 font-medium">Spokojených klientů</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                <div className="text-3xl md:text-4xl font-black text-blue-600 mb-2">12M+</div>
                <div className="text-sm text-gray-600 font-medium">Celkový dosah</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
                <div className="text-3xl md:text-4xl font-black text-orange-600 mb-2">98%</div>
                <div className="text-sm text-gray-600 font-medium">Spokojenosť klientů</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <a href="#kontakt" className="group relative bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-violet-500/25 inline-flex items-center gap-4">
              <TrendingUp className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              <span>Chci také dosáhnout takových výsledků</span>
              <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">
                Zdarma konzultace
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Live Demo Preview Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-25"></div>
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-6 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 text-sm font-medium">Včera vytvořeno za 3 minuty</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
                Tohle někdo skutečně 
                <span className="block text-violet-600">
                  vytvořil včera večer
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Podívejte se, jak vypadají skutečné weby vytvořené našimi klienty pomocí AI
              </p>
            </div>
            
            {/* Demo grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
              {/* Cukrárna demo */}
              <div className="group">
                <div className="relative bg-gray-50 rounded-3xl p-8 border border-gray-200 hover:border-violet-300 transition-all duration-300 hover:scale-105">
                  <div className="absolute -top-4 -right-4 bg-violet-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    LIVE WEB
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Cukrárna U Babičky</h3>
                    <p className="text-gray-600">Prompt: "web pro cukrárnu s fotkami dortů, ceníkem a objednávkovým formulářem"</p>
                  </div>
                  
                  <div className="relative mb-6 cursor-pointer" onClick={() => document.getElementById('cukrarna-modal')?.classList.remove('hidden')}>
                    <img 
                      src="/cukrarna_hero.webp" 
                      alt="Náhled webu cukrárny"
                      className="w-full h-48 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-colors flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-gray-900 font-medium">👀 Zobrazit celý web</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-violet-600">3 min</div>
                      <div className="text-xs text-gray-500">čas tvorby</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">100%</div>
                      <div className="text-xs text-gray-500">funkční</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">5 sekcí</div>
                      <div className="text-xs text-gray-500">kompletní web</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => document.getElementById('cukrarna-modal')?.classList.remove('hidden')}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105"
                  >
                    Prohlédnout celý web
                  </button>
                </div>
              </div>
              
              {/* Social media agency demo */}
              <div className="group">
                <div className="relative bg-gray-50 rounded-3xl p-8 border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:scale-105">
                  <div className="absolute -top-4 -right-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    LIVE WEB
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Social Media Agentura</h3>
                    <p className="text-gray-600">Prompt: "moderní web pro social media agenturu s referencemi a ceníkem"</p>
                  </div>
                  
                  <div className="relative mb-6 cursor-pointer" onClick={() => document.getElementById('social-modal')?.classList.remove('hidden')}>
                    <img 
                      src="/social_hero.webp" 
                      alt="Náhled webu social media agentury"
                      className="w-full h-48 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-colors flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-gray-900 font-medium">👀 Zobrazit celý web</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">4 min</div>
                      <div className="text-xs text-gray-500">čas tvorby</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">100%</div>
                      <div className="text-xs text-gray-500">funkční</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">6 sekcí</div>
                      <div className="text-xs text-gray-500">kompletní web</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => document.getElementById('social-modal')?.classList.remove('hidden')}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105"
                  >
                    Prohlédnout celý web
                  </button>
                </div>
              </div>
            </div>
            
            {/* CTA */}
            <div className="text-center">
              <p className="text-gray-600 mb-8 text-lg">
                Chcete také takový web? Napište nám, co potřebujete.
              </p>
              <a href="#kontakt" className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-violet-500/25 inline-flex items-center gap-4">
                <span>🚀</span>
                <span>Vytvořit můj web</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Cukrárna Modal */}
      <div id="cukrarna-modal" className="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
            <h3 className="text-2xl font-bold text-gray-900">Cukrárna U Babičky - Kompletní web</h3>
            <button 
              onClick={() => document.getElementById('cukrarna-modal')?.classList.add('hidden')}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="p-6 space-y-6">
            <img src="/cukrarna_hero.webp" alt="Hero sekce cukrárny" className="w-full rounded-2xl shadow-lg" />
            <img src="/cukrarna_speciality.webp" alt="Speciality cukrárny" className="w-full rounded-2xl shadow-lg" />
            <img src="/cukrarna_cenik.webp" alt="Ceník cukrárny" className="w-full rounded-2xl shadow-lg" />
            <img src="/cukrarna_formular.webp" alt="Objednávkový formulář" className="w-full rounded-2xl shadow-lg" />
            <img src="/cukrarna_footer.webp" alt="Footer cukrárny" className="w-full rounded-2xl shadow-lg" />
            
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h4 className="font-bold text-green-800 mb-3">✅ Co web obsahuje:</h4>
              <ul className="text-green-700 space-y-2">
                <li>• Profesionální hero sekce s call-to-action</li>
                <li>• Fotografie dortů a specialit</li>
                <li>• Přehledný ceník s cenami</li>
                <li>• Funkční objednávkový formulář</li>
                <li>• Kontaktní informace a otevírací dobu</li>
                <li>• Responzivní design pro mobily</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Modal */}
      <div id="social-modal" className="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
            <h3 className="text-2xl font-bold text-gray-900">Social Media Agentura - Kompletní web</h3>
            <button 
              onClick={() => document.getElementById('social-modal')?.classList.add('hidden')}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="p-6 space-y-6">
            <img src="/social_hero.webp" alt="Hero sekce social media agentury" className="w-full rounded-2xl shadow-lg" />
            <img src="/social_audit.webp" alt="Audit sekce" className="w-full rounded-2xl shadow-lg" />
            <img src="/social_reference.webp" alt="Reference a výsledky" className="w-full rounded-2xl shadow-lg" />
            <img src="/social_cenik.webp" alt="Ceník služeb" className="w-full rounded-2xl shadow-lg" />
            <img src="/social_formular.webp" alt="Kontaktní formulář" className="w-full rounded-2xl shadow-lg" />
            
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
              <h4 className="font-bold text-purple-800 mb-3">✅ Co web obsahuje:</h4>
              <ul className="text-purple-700 space-y-2">
                <li>• Moderní hero s animacemi a statistikami</li>
                <li>• Bezplatná analýza jako lead magnet</li>
                <li>• Konkrétní reference s výsledky</li>
                <li>• Transparentní ceník služeb</li>
                <li>• Kontaktní formulář s výběrem služeb</li>
                <li>• Profesionální design s wow efekty</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Služby - Redesigned */}
      <section id="sluzby" className="py-20 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Jak vám pomůžeme růst
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Od strategie až po realizaci – komplexní služby pro vaši digitální přítomnost
            </p>
          </div>
          
          {/* Process flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analýza</h3>
              <p className="text-gray-600">Analyzujeme vaše současné účty a konkurenci</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Strategie</h3>
              <p className="text-gray-600">Vytvoříme plán obsahu a naplánujeme kampaně</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Realizace</h3>
              <p className="text-gray-600">Denně tvoříme obsah a spravujeme vaše účty</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimalizace</h3>
              <p className="text-gray-600">Měříme výsledky a průběžně vylepšujeme</p>
            </div>
          </div>
          
          {/* Service cards - horizontal layout */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Tvorba obsahu</h3>
                      <p className="text-violet-600 font-medium">Kreativní studio</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg mb-6">Profesionální grafiky, videa, fotografie a copywriting. Vše přizpůsobené vaší značce a cílové skupině.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">8–16 příspěvků měsíčně</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">Profesionální grafiky</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">Video obsah</span>
                    </li>
                  </ul>
                  <div className="text-3xl font-bold text-violet-600">od 4 900 Kč měsíčně</div>
                </div>
                <div className="bg-gradient-to-br from-violet-100 to-purple-100 p-8 lg:p-12 flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1611262588024-d12430b98920?w=500&h=400&fit=crop"
                    alt="Content creation"
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="bg-gradient-to-br from-indigo-100 to-violet-100 p-8 lg:p-12 flex items-center order-2 lg:order-1">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=400&fit=crop"
                    alt="Analytics dashboard"
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                </div>
                <div className="p-8 lg:p-12 order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Placená reklama</h3>
                      <p className="text-indigo-600 font-medium">Performance marketing</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg mb-6">Facebook, Instagram a Google Ads kampaně se zaměřením na ROI. Testujeme, optimalizujeme a škálujeme.</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">Strategická konzultace</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">Správa kampaní</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">Denní optimalizace</span>
                    </li>
                  </ul>
                  <div className="text-3xl font-bold text-indigo-600">15% z ad spend</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ceník */}
      <section id="cenik" className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Transparentní ceník
            </h2>
            <p className="text-xl text-gray-600">
              Žádné skryté poplatky • Flexibilní balíčky
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-violet-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Starter</h3>
              </div>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-violet-600 mb-2">4 900 Kč</div>
                  <div className="text-gray-600">měsíčně</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">2 sociální sítě</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">8 příspěvků měsíčně</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Základní grafiky</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Měsíční report</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-violet-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                Nejoblíbenější
              </div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Professional</h3>
              </div>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-violet-600 mb-2">8 900 Kč</div>
                  <div className="text-gray-600">měsíčně</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">3 sociální sítě</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">16 příspěvků měsíčně</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Profesionální grafiky</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Video obsah</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Detailní analytics</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-violet-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Enterprise</h3>
              </div>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-violet-600 mb-2">Individuální</div>
                  <div className="text-gray-600">dle požadavků</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Unlimited sítě</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Unlimited obsah</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Fotografování</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">Dedikovaný manažer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">24/7 podpora</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio/Výsledky */}
      <section id="portfolio" className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Naše výsledky mluví za vše
            </h2>
            <p className="text-xl text-gray-600">
              Reálné case studies našich klientů z Brna a okolí
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-violet-100">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🏪</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Lokální kavárna</h3>
                <p className="text-gray-600 text-sm">Brno - Veveří</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Followers na IG</span>
                  <span className="font-bold text-green-600">+340%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Engagement rate</span>
                  <span className="font-bold text-green-600">8.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Nové zákazníky</span>
                  <span className="font-bold text-green-600">+180/měsíc</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-violet-100">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Finanční poradce</h3>
                <p className="text-gray-600 text-sm">Brno - centrum</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">LinkedIn reach</span>
                  <span className="font-bold text-blue-600">+520%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Generované leady</span>
                  <span className="font-bold text-blue-600">45/měsíc</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Uzavřené obchody</span>
                  <span className="font-bold text-blue-600">12/měsíc</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-violet-100">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">💅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Beauty salon</h3>
                <p className="text-gray-600 text-sm">Brno - Královo Pole</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Instagram followers</span>
                  <span className="font-bold text-purple-600">+280%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Objednávky online</span>
                  <span className="font-bold text-purple-600">+450%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tržby</span>
                  <span className="font-bold text-purple-600">+165%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontaktní formulář */}
      <section id="kontakt" className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Začněme spolupracovat
              </h2>
              <p className="text-xl text-gray-600">
                Napište nám a my vám do 24 hodin pošleme konkrétní návrh strategie
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-3" htmlFor="name">
                          Vaše jméno *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          className="w-full px-4 py-4 border-2 border-violet-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all"
                          placeholder="Martin Novák"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-3" htmlFor="phone">
                          Telefon *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          className="w-full px-4 py-4 border-2 border-violet-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all"
                          placeholder="+420 123 456 789"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-3" htmlFor="email">
                          E-mail
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="w-full px-4 py-4 border-2 border-violet-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all"
                          placeholder="martin@firma.cz"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-3" htmlFor="service">
                          Jaká služba vás zajímá? *
                        </label>
                        <select
                          id="service"
                          name="service"
                          required
                          className="w-full px-4 py-4 border-2 border-violet-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all"
                          value={formData.service}
                          onChange={handleInputChange}
                        >
                          <option value="">Vyberte službu</option>
                          <option value="tvorba-obsahu">Tvorba obsahu</option>
                          <option value="analytics">Analytics & reporting</option>
                          <option value="reklama">Placená reklama</option>
                          <option value="komplet">Kompletní správa</option>
                          <option value="konzultace">Jen konzultace</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-3" htmlFor="message">
                        Popište nám váš projekt *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="w-full px-4 py-4 border-2 border-violet-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-400 transition-all resize-none"
                        placeholder="Máme kavárnu v centru Brna a chceme získat více mladých zákazníků přes Instagram. Momentálně máme 200 followers a rádi bychom růst..."
                        value={formData.message}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 hover:from-violet-600 hover:via-purple-600 hover:to-violet-700 text-white font-bold py-5 px-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
                    >
                      <Camera className="h-5 w-5" />
                      Odeslat poptávku
                    </button>
                  </form>
                </div>
                
                <div className="bg-gradient-to-br from-violet-400 via-purple-400 to-violet-500 p-8 lg:p-12 flex items-center">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-6">Proč spolupracovat s námi?</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Star className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Lokální znalost</h4>
                          <p className="text-white/90 text-sm">8 let zkušeností s firmami v Brně a okolí</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Měřitelné výsledky</h4>
                          <p className="text-white/90 text-sm">Průměrně +150% růst u našich klientů</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Heart className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Osobní přístup</h4>
                          <p className="text-white/90 text-sm">Každý klient má svého dedikovaného manažera</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontaktní informace */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Navštivte nás v Brně
            </h2>
            <p className="text-xl text-gray-600">
              Kancelář v centru města • Parkování v okolí
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-violet-100">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Úřední hodiny</h3>
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center p-3 bg-violet-50 rounded-xl">
                  <span className="font-medium text-gray-700">Pondělí - Pátek</span>
                  <span className="font-bold text-violet-600">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                  <span className="font-medium text-gray-700">Sobota</span>
                  <span className="font-bold text-violet-600">10:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl">
                  <span className="font-medium text-gray-700">Neděle</span>
                  <span className="font-bold text-violet-600">Zavřeno</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-violet-100">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Adresa</h3>
              <div className="space-y-4">
                <div className="p-4 bg-violet-50 rounded-xl">
                  <p className="font-bold text-gray-800 mb-1">Moravské náměstí 8</p>
                  <p className="text-gray-600">602 00 Brno</p>
                  <p className="text-sm text-gray-500 mt-2">4. patro, kancelář 403</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>🚗 Parkování: Parkoviště Moravské náměstí</p>
                  <p>🚊 Tramvaj: Moravské náměstí (5 minut pěšky)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-violet-100">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Kontakt</h3>
              <div className="space-y-4">
                <div className="p-4 bg-violet-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-violet-600" />
                    <span className="font-bold text-gray-800">+420 774 123 456</span>
                  </div>
                  <p className="text-sm text-gray-600">volejte denně 9:00-18:00</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-violet-600" />
                    <span className="font-bold text-gray-800">info@socialnisila.cz</span>
                  </div>
                  <p className="text-sm text-gray-600">odpovídáme do 4 hodin</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>IČO: 89456123</p>
                  <p>Jednatel: Tomáš Procházka</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl mb-6">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Sociální Síla</h3>
            <p className="text-gray-400 mb-6">Social Media agentura • Brno • Od roku 2016</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8 text-sm">
              <div>
                <h4 className="font-semibold mb-3 text-violet-400">Kancelář</h4>
                <p className="text-gray-300">Moravské náměstí 8</p>
                <p className="text-gray-300">602 00 Brno</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-violet-400">Kontakt</h4>
                <p className="text-gray-300">+420 774 123 456</p>
                <p className="text-gray-300">info@socialnisila.cz</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-violet-400">Pracovní doba</h4>
                <p className="text-gray-300">Po-Pá: 9:00-18:00</p>
                <p className="text-gray-300">So: 10:00-14:00</p>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-500 text-sm">
                © 2024 Sociální Síla • Všechna práva vyhrazena • IČO: 89456123
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SocialMediaPage