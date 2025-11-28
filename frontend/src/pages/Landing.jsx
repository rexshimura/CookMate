import React, { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">

      {/* --- Navigation --- */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-200">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-stone-900">CookMate</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a
                href="/signin"
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 rounded-full hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200 transition-all transform hover:-translate-y-0.5"
              >
                Sign In
              </a>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-100 px-4 py-4 space-y-3">
             <button className="block w-full text-left px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg">How it works</button>
              <button className="block w-full text-left px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg">Features</button>
              <a href="/signin" className="block w-full px-4 py-2 text-sm font-semibold text-center text-white bg-orange-600 rounded-lg">Sign In</a>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <main className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3 h-3" />
                <span>AI-Powered Kitchen Assistant</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-stone-900 mb-6 leading-[1.1]">
                The smartest way to cook with <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                  what you have.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-stone-500 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Don't know what to cook? Just tell CookMate what ingredients are in your fridge, and our AI will generate delicious recipes instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a href="/home" className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">Get Started!
                  <ArrowRight className="w-5 h-5" />
                </a>
                <div className="flex items-center gap-2 text-sm font-medium text-stone-500">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200" />)}
                  </div>
                  <span>Joined by 10,000+ cooks</span>
                </div>
              </div>
            </div>

            {/* Simulated App UI (Visual) */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="absolute top-0 right-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

              <div className="relative bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="ml-auto text-xs font-bold text-stone-400">COOKMATE AI</div>
                </div>

                <div className="p-6 space-y-4 bg-white min-h-[380px]"> {/* Added min-height to prevent layout jump */}

                  {/* AI Message */}
                  <div className="flex gap-3 animate-fadeIn">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="bg-stone-100 rounded-2xl rounded-tl-none p-3 text-sm text-stone-600 max-w-[80%]">
                      Hello! What ingredients do you have today?
                    </div>
                  </div>

                  {/* User Message (Dynamic) */}
                  <div className="flex flex-row-reverse gap-3 animate-slideUp">
                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0 text-white text-xs">You</div>
                    <div className="bg-orange-600 text-white rounded-2xl rounded-tr-none p-3 text-sm max-w-[80%]">
                      {currentScenario.user}
                    </div>
                  </div>

                  {/* AI Response (Dynamic Recipe) */}
                  <div className="flex gap-3 animate-slideUp delay-100">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="bg-stone-100 rounded-2xl rounded-tl-none p-4 text-sm text-stone-600 max-w-[90%] shadow-sm border border-stone-100">
                      <p className="font-bold text-stone-800 mb-2">{currentScenario.aiTitle}</p>
                      <div className="space-y-2">
                        {currentScenario.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      <button className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-700">View Full Recipe →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Features Grid --- */}
      <section className="py-20 bg-white border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">Why use CookMate?</h2>
            <p className="text-stone-500">Stop worrying about what to cook. Let our advanced AI handle the meal planning so you can enjoy the food.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Leaf className="w-6 h-6 text-green-600" />}
              title="Reduce Food Waste"
              desc="Use up every ingredient in your fridge. CookMate finds recipes for exactly what you have on hand."
              color="bg-green-50"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6 text-orange-600" />}
              title="Save Time"
              desc="No more endless scrolling through recipe blogs. Get precise instructions instantly without the backstory."
              color="bg-orange-50"
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6 text-blue-600" />}
              title="Learn New Skills"
              desc="Discover new cuisines and cooking techniques tailored to your skill level and preferences."
              color="bg-blue-50"
            />
          </div>
        </div>
      </section>

      <ScrollToTopButton/>

      {/* --- Footer --- */}
      <footer className="bg-stone-900 text-stone-400 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-stone-800 pb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="w-6 h-6 text-orange-500" />
                <span className="text-xl font-bold text-white">CookMate</span>
              </div>
              <p className="max-w-xs text-sm">Your personal AI kitchen assistant. Making home cooking accessible, fun, and delicious for everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>© 2024 CookMate AI. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="p-8 rounded-2xl border border-stone-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 transition-all group bg-white">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}