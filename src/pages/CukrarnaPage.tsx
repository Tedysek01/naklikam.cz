import { useState } from 'react'
import { MapPin, Clock, Phone, Mail, Heart, Star, Award, Users } from 'lucide-react'

const CukrarnaPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    date: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Děkujeme za vaši objednávku! Ozveme se vám do 24 hodin na telefon ' + formData.phone)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-rose-100">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 bg-white/30 rounded-2xl"></div>
                <span className="text-2xl relative z-10 drop-shadow-md">🧁</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">Cukrárna U Babičky</h1>
                <p className="text-xs text-gray-600 font-medium">Třebíč • Od roku 1987</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#dorty" className="text-gray-700 hover:text-rose-600 transition-colors font-medium">Naše dorty</a>
              <a href="#cenik" className="text-gray-700 hover:text-rose-600 transition-colors font-medium">Ceník</a>
              <a href="#objednavka" className="text-gray-700 hover:text-rose-600 transition-colors font-medium">Objednávka</a>
              <a href="#kontakt" className="text-gray-700 hover:text-rose-600 transition-colors font-medium">Kontakt</a>
            </div>

            {/* Contact Info */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-rose-600" />
                <span className="text-gray-700 font-medium">+420 568 823 456</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-rose-600" />
                <span className="text-gray-700">Po-Pá 6:30-18:00</span>
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

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200 rounded-full opacity-30 blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200 rounded-full opacity-25 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Právě teď pečeme čerstvé dorty</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Domácí dorty
                <span className="block bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                  s láskou
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                Pečeme podle rodinných receptů babičky Marie už <strong>35 let</strong>. 
                Každý dort je jedinečný a vytvořený speciálně pro vás.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-rose-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-5 w-5 text-rose-500 mr-2" />
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">35+</div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 font-medium">let tradice</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-pink-500 mr-2" />
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">5000+</div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 font-medium">spokojených zákazníků</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-orange-200/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="h-5 w-5 text-orange-500 mr-2" />
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">100%</div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 font-medium">ruční výroba</div>
                </div>
              </div>
              
              {/* Google Reviews */}
              <div className="flex items-center justify-start gap-4 mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-yellow-200/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">4.9/5</span>
                    <span className="text-sm text-gray-600 font-medium">(127 recenzí Google)</span>
                  </div>
                </div>
              </div>
              
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#objednavka" 
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                  <Heart className="h-5 w-5" />
                  Objednat dort
                </a>
                <a 
                  href="#dorty" 
                  className="bg-white/80 backdrop-blur-sm text-gray-800 px-8 py-4 rounded-2xl font-semibold hover:bg-white transition-all border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 text-lg"
                >
                  <span>👀</span>
                  Prohlédnout nabídku
                </a>
              </div>
            </div>
            
            {/* Right content - Image showcase */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Main large image */}
                <div className="col-span-2 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop" 
                    alt="Hlavní dort cukrárny"
                    className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-2xl"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full">
                    <span className="text-sm font-semibold text-rose-600">Bestseller 🔥</span>
                  </div>
                </div>
                
                {/* Two smaller images */}
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&h=200&fit=crop" 
                    alt="Svatební dort"
                    className="w-full h-32 md:h-40 object-cover rounded-2xl shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  <div className="absolute bottom-2 left-2 text-white text-sm font-medium">Svatební</div>
                </div>
                
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&h=200&fit=crop" 
                    alt="Ovocný dort"
                    className="w-full h-32 md:h-40 object-cover rounded-2xl shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  <div className="absolute bottom-2 left-2 text-white text-sm font-medium">Ovocný</div>
                </div>
              </div>
              
              {/* Floating testimonial */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 max-w-xs hidden lg:block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    JN
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Jana Nováková</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  "Nejlepší dort, co jsem kdy měla! Překonal všechna očekávání."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fotky dortů */}
      <section id="dorty" className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Naše speciality
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Každý dort pečeme s láskou podle rodinných receptů babičky Marie
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="group">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden transform group-hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=300&fit=crop"
                    alt="Čokoládový dort s malinami"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Bestseller
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Babiččin čokoládový sen</h3>
                  <p className="text-gray-600 mb-4">Třípatrový dort s belgickou čokoládou, čerstvými malinami a mascarpone krémem</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-rose-600">od 890 Kč</span>
                    <span className="text-sm text-gray-500">6-8 osob</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden transform group-hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&h=300&fit=crop"
                    alt="Svatební dort"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Svatební
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Růžový sen</h3>
                  <p className="text-gray-600 mb-4">Elegantní svatební dort s vanilkovým krémem, čerstvými růžemi a zlatými detaily</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-rose-600">od 2 490 Kč</span>
                    <span className="text-sm text-gray-500">20+ osob</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden transform group-hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&h=300&fit=crop"
                    alt="Ovocný dort"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Sezonní
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Letní zahrada</h3>
                  <p className="text-gray-600 mb-4">Osvěžující dort s jogurtovým krémem a sezonním ovocem z našeho kraje</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-rose-600">od 690 Kč</span>
                    <span className="text-sm text-gray-500">6-8 osob</span>
                  </div>
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
              Ceník našich specialit
            </h2>
            <p className="text-xl text-gray-600">
              Transparentní ceny • Žádné skryté poplatky
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-rose-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🎂</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Dorty na objednávku</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Malý dort</span>
                    <div className="text-sm text-gray-600">6-8 osob • základní dekorace</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">690 - 890 Kč</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-pink-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Střední dort</span>
                    <div className="text-sm text-gray-600">10-15 osob • pokročilá dekorace</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">1 290 - 1 690 Kč</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Velký dort</span>
                    <div className="text-sm text-gray-600">20+ osob • prémiová dekorace</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">2 190 - 2 990 Kč</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border-2 border-rose-200">
                  <div>
                    <span className="font-semibold text-gray-800">Svatební dort</span>
                    <div className="text-sm text-gray-600">individuální konzultace</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">od 2 490 Kč</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-rose-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🧁</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Denní nabídka</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Zákusky</span>
                    <div className="text-sm text-gray-600">tradiční české speciality</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">42 - 68 Kč</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-pink-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Cupcakes</span>
                    <div className="text-sm text-gray-600">s krémovou polevou</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">45 Kč</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Cheesecake</span>
                    <div className="text-sm text-gray-600">New York style</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">75 Kč</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl">
                  <div>
                    <span className="font-semibold text-gray-800">Tiramisu</span>
                    <div className="text-sm text-gray-600">babiččin originální recept</div>
                  </div>
                  <span className="text-xl font-bold text-rose-600">85 Kč</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontaktní formulář */}
      <section id="objednavka" className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Objednejte si dort snů
              </h2>
              <p className="text-xl text-gray-600">
                Vyplňte formulář a my vám do 4 hodin zavoláme s nabídkou
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
                          className="w-full px-4 py-4 border-2 border-rose-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          placeholder="Jana Nováková"
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
                          className="w-full px-4 py-4 border-2 border-rose-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all"
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
                          className="w-full px-4 py-4 border-2 border-rose-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          placeholder="jana@email.cz"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-3" htmlFor="date">
                          Kdy dort potřebujete? *
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          required
                          className="w-full px-4 py-4 border-2 border-rose-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all"
                          value={formData.date}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-3" htmlFor="message">
                        Popište nám váš vysněný dort *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="w-full px-4 py-4 border-2 border-rose-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-400 transition-all resize-none"
                        placeholder="Chtěla bych čokoládový dort na 50. narozeniny pro 12 osob. Měl by být s malinami a nápisem 'Všechno nejlepší'. Barva dekorace růžová..."
                        value={formData.message}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold py-5 px-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
                    >
                      <Heart className="h-5 w-5" />
                      Odeslat objednávku
                    </button>
                  </form>
                </div>
                
                <div className="bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500 p-8 lg:p-12 flex items-center">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-6">Proč si vybrat nás?</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Star className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Rodinná tradice</h4>
                          <p className="text-white/90 text-sm">35 let zkušeností v rodinném podniku</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Heart className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Ruční výroba</h4>
                          <p className="text-white/90 text-sm">Každý dort pečeme s láskou ručně</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Regionální suroviny</h4>
                          <p className="text-white/90 text-sm">Používáme jen kvalitní místní ingredience</p>
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

      {/* Otevírací doba a kontakt */}
      <section id="kontakt" className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Návštivte nás
            </h2>
            <p className="text-xl text-gray-600">
              Najdete nás v centru Třebíče • Parkování zdarma před obchodem
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-rose-100">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Otevírací doba</h3>
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                  <span className="font-medium text-gray-700">Pondělí - Pátek</span>
                  <span className="font-bold text-rose-600">6:30 - 18:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-xl">
                  <span className="font-medium text-gray-700">Sobota</span>
                  <span className="font-bold text-rose-600">7:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                  <span className="font-medium text-gray-700">Neděle</span>
                  <span className="font-bold text-rose-600">8:00 - 14:00</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-rose-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Adresa</h3>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="font-bold text-gray-800 mb-1">Karlovo náměstí 15</p>
                  <p className="text-gray-600">674 01 Třebíč</p>
                  <p className="text-sm text-gray-500 mt-2">u radnice, naproti kavárně Slavia</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>🚗 Parkování zdarma před obchodem</p>
                  <p>🚌 Zastávka "Třebíč, náměstí" - 50m</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-rose-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Kontakt</h3>
              <div className="space-y-4">
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-rose-600" />
                    <span className="font-bold text-gray-800">+420 568 823 456</span>
                  </div>
                  <p className="text-sm text-gray-600">volejte denně 6:30-18:00</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-rose-600" />
                    <span className="font-bold text-gray-800">info@ubabicky-trebic.cz</span>
                  </div>
                  <p className="text-sm text-gray-600">odpovídáme do 4 hodin</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>IČO: 45123789</p>
                  <p>Jednatelka: Marie Svobodová</p>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl mb-6">
              <span className="text-2xl">🧁</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Cukrárna U Babičky</h3>
            <p className="text-gray-400 mb-6">Rodinná tradice • Třebíč • Od roku 1987</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8 text-sm">
              <div>
                <h4 className="font-semibold mb-3 text-rose-400">Provozovna</h4>
                <p className="text-gray-300">Karlovo náměstí 15</p>
                <p className="text-gray-300">674 01 Třebíč</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-rose-400">Kontakt</h4>
                <p className="text-gray-300">+420 568 823 456</p>
                <p className="text-gray-300">info@ubabicky-trebic.cz</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-rose-400">Otevřeno</h4>
                <p className="text-gray-300">Po-Pá: 6:30-18:00</p>
                <p className="text-gray-300">So-Ne: 7:00-16:00</p>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-500 text-sm">
                © 2024 Cukrárna U Babičky • Všechna práva vyhrazena • IČO: 45123789
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CukrarnaPage