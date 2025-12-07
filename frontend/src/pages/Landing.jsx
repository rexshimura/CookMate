import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Sparkles, ArrowRight, Clock, Leaf, BookOpen, CheckCircle2, Menu, X } from 'lucide-react';
import ScrollToTopButton from "./Components/Utility/ScrollToTopButton.jsx";

// 1. Define the 5 different scenarios
const demoScenarios = [
  {
    user: "I have chicken breast, spinach, garlic, and heavy cream.",
    aiTitle: "Creamy Garlic Spinach Chicken",
    steps: ["Sear chicken until golden", "Sauté garlic and spinach", "Simmer with cream for 5 mins"]
  },
  {
    user: "I have eggs, sourdough bread, ripe avocados, and lime.",
    aiTitle: "Zesty Avocado Toast & Poached Egg",
    steps: ["Toast sourdough until crispy", "Mash avocado with lime juice", "Top with soft poached egg"]
  },
  {
    user: "I have ground beef, kidney beans, canned tomatoes, and onions.",
    aiTitle: "Classic 30-Minute Chili",
    steps: ["Brown beef with diced onions", "Add tomatoes and kidney beans", "Simmer with spices for 20 mins"]
  },
  {
    user: "I have firm tofu, broccoli, soy sauce, and ginger.",
    aiTitle: "Ginger Soy Tofu Stir-Fry",
    steps: ["Press and cube firm tofu", "Stir-fry broccoli on high heat", "Toss in savory ginger soy glaze"]
  },
  {
    user: "I have pasta, fresh basil, garlic cloves, and olive oil.",
    aiTitle: "Garlic Basil Aglio e Olio",
    steps: ["Boil pasta until al dente", "Sizzle sliced garlic in olive oil", "Toss pasta with oil and basil"]
  }
];

export default function CookMateLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 2. State to hold the current scenario
  const [currentScenario, setCurrentScenario] = useState(demoScenarios[0]);

  // 3. Effect to randomize on mount (refresh)
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * demoScenarios.length);
    setCurrentScenario(demoScenarios[randomIndex]);
  }, []);

  // --- Scroll Handler ---
  const scrollToSection = (sectionId) => {
    setIsMobileMenuOpen(false); // Close the mobile menu (if open)
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 font-sans text-stone-800 relative overflow-hidden">

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>

      {/* --- Navigation --- */}
      <nav className="fixed w-full z-50 bg-gradient-to-r from-white/80 via-stone-50/80 to-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-xl shadow-stone-900/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <ChefHat className="w-6 h-6 text-white relative z-10" />
              </div>
              <span className="text-xl font-bold tracking-tight text-stone-900">CookMate</span>
            </div>

            {/* Desktop Navigation - Updated with links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-bold text-stone-600 hover:text-orange-600 transition-colors duration-200"
              >
                Features
              </button>
              <Link
                to="/signin"
                className="relative px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 overflow-hidden group shadow-lg shadow-orange-200/50 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors duration-200">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gradient-to-b from-white via-stone-50 to-stone-100 border-b border-stone-200/60 backdrop-blur-xl px-4 py-4 space-y-3 shadow-2xl">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-stone-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 rounded-xl transition-all duration-200"
              >
                Features
              </button>

              <Link
                to="/signin"
                className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200"
              >
                Sign In
              </Link>
          </div>
        )}
      </nav>

      {/* --- Hero Section (How it Works) --- */}
      {/* min-h-screen: Ensures it takes full height on mobile/desktop.
          flex items-center: Centers content vertically.
          pt-24: Padding for mobile to account for fixed navbar.
      */}
      <main id="how-it-works" className="min-h-screen flex items-center pt-24 pb-16 md:pt-0 md:pb-0 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-100 via-orange-200 to-red-100 border border-orange-200/60 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-orange-200/30">
                <Sparkles className="w-3 h-3" />
                <span>AI-Powered Kitchen Assistant</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-stone-900 mb-6 leading-[1.1]">
                The smartest way to cook with <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
                  what you have.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-stone-500 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Don't know what to cook? Just tell CookMate what ingredients are in your fridge, and our AI will generate delicious recipes instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a href="/home" className="relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold text-lg hover:from-orange-700 hover:to-red-700 shadow-2xl shadow-orange-200/50 hover:shadow-3xl hover:shadow-orange-300/50 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  Get Started!
                  <ArrowRight className="w-5 h-5 relative z-10" />
                </a>
                <div className="flex items-center gap-3 text-sm font-medium text-stone-500 bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-stone-200/60">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-red-500 shadow-sm" />)}
                  </div>
                  <span>Joined by 10,000+ cooks</span>
                </div>
              </div>
            </div>

            {/* Simulated App UI (Visual) */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-amber-200 to-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

              <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 border border-stone-200/60 rounded-3xl shadow-2xl shadow-stone-900/10 backdrop-blur-xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-r from-white/90 to-stone-50/90 backdrop-blur-sm border-b border-stone-200/60 p-4 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-500"></div>
                  <div className="ml-auto text-xs font-bold text-stone-600">COOKMATE AI</div>
                </div>

                <div className="p-6 space-y-4 bg-gradient-to-b from-white/80 to-stone-50/80 min-h-[380px] backdrop-blur-sm">

                  {/* AI Message */}
                  <div className="flex gap-3 animate-fadeIn">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center flex-shrink-0 border border-orange-200/60">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl rounded-tl-none p-3 text-sm text-stone-600 max-w-[80%] border border-stone-200/60">
                      Hello! What ingredients do you have today?
                    </div>
                  </div>

                  {/* User Message (Dynamic) */}
                  <div className="flex flex-row-reverse gap-3 animate-slideUp">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center flex-shrink-0 text-white text-xs shadow-lg shadow-stone-200/50">You</div>
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl rounded-tr-none p-3 text-sm max-w-[80%] shadow-lg shadow-orange-200/50">
                      {currentScenario.user}
                    </div>
                  </div>

                  {/* AI Response (Dynamic Recipe) */}
                  <div className="flex gap-3 animate-slideUp delay-100">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center flex-shrink-0 border border-orange-200/60">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl rounded-tl-none p-4 text-sm text-stone-600 max-w-[90%] shadow-lg shadow-stone-200/50 border border-stone-200/60">
                      <p className="font-bold text-stone-800 mb-2">{currentScenario.aiTitle}</p>
                      <div className="space-y-2">
                        {currentScenario.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      <button className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors">View Full Recipe →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Features Grid --- */}
      <section id="features" className="py-20 bg-gradient-to-b from-white via-stone-50 to-stone-100 border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
          </div>
          
          <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
            <h2 className="text-3xl font-bold text-stone-900 mb-4 tracking-wide">Why use CookMate?</h2>
            <p className="text-stone-500 leading-relaxed">Turn available ingredients into delicious meals with AI-powered recipes, interactive guides, and smart insights. Stop worrying about what to cook. Let our advanced AI handle the meal planning so you can enjoy the food.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <FeatureCard
              icon={<Leaf className="w-6 h-6 text-green-600" />}
              title="Reduce Food Waste"
              desc="Use up every ingredient in your fridge. CookMate finds recipes for exactly what you have on hand."
              color="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100"
              borderColor="border-green-200/60"
              shadowColor="shadow-green-200/30"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-orange-600" />}
              title="Save Time"
              desc="No more endless scrolling through recipe blogs. Get precise instructions instantly without the backstory."
              color="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
              borderColor="border-orange-200/60"
              shadowColor="shadow-orange-200/30"
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6 text-blue-600" />}
              title="Learn New Skills"
              desc="Discover new cuisines and cooking techniques tailored to your skill level and preferences."
              color="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100"
              borderColor="border-blue-200/60"
              shadowColor="shadow-blue-200/30"
            />
          </div>
        </div>
      </section>

      <ScrollToTopButton/>

      {/* --- Footer --- */}
      <footer className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-400 py-16 border-t border-stone-700/60 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-stone-700/60 pb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200/50">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">CookMate</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed">Your personal AI kitchen assistant. Making home cooking accessible, fun, and delicious for everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>© 2024 CookMate AI. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, borderColor, shadowColor }) {
  return (
    <div className={`relative p-8 rounded-2xl border ${borderColor} hover:border-orange-300 hover:shadow-2xl ${shadowColor}/50 transition-all group bg-gradient-to-b from-white/80 to-stone-50/80 backdrop-blur-xl overflow-hidden hover:scale-[1.02] duration-300`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
      
      <div className={`relative w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/50 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-3 relative z-10 tracking-wide">{title}</h3>
      <p className="text-stone-500 leading-relaxed relative z-10">{desc}</p>
    </div>
  );
}