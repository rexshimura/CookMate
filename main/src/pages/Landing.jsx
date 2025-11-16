import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Sparkles, Clock, Heart, Users, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange-600" />
          <span className="text-2xl font-bold text-gray-800">CookMateAI</span>
        </div>
        <div className="flex space-x-4">
          <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            Login
          </Link>
          <Link
            to="/home"
            className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Personal AI
            <span className="text-orange-600"> Kitchen Assistant</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your cooking experience with AI-powered recipe suggestions,
            personalized meal planning, and step-by-step guidance. Never wonder
            "what's for dinner?" again.
          </p>

          <div className="flex justify-center space-x-4 mb-16">
            <Link
              to="/home"
              className="px-8 py-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all transform hover:scale-105 flex items-center space-x-2 text-lg font-semibold"
            >
              <span>Start Cooking</span>
              <ChefHat className="h-5 w-5" />
            </Link>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 rounded-full hover:border-gray-400 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">5 min</h3>
                <p className="text-gray-600">Average recipe discovery time</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <Users className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">10K+</h3>
                <p className="text-gray-600">Recipes generated daily</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <Heart className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">95%</h3>
                <p className="text-gray-600">User satisfaction rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Smart Cooking Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to become a better cook, powered by artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Recipe Generation
              </h3>
              <p className="text-gray-600">
                Get personalized recipes based on your available ingredients, dietary preferences, and cooking skill level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Step-by-Step Guidance
              </h3>
              <p className="text-gray-600">
                Follow detailed cooking instructions with timers, tips, and techniques tailored to your experience.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Save & Organize
              </h3>
              <p className="text-gray-600">
                Build your personal digital cookbook with favorite recipes and cooking notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of home cooks who are discovering the joy of AI-assisted cooking
          </p>
          <Link
            to="/home"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-orange-600 rounded-full hover:bg-gray-50 transition-all transform hover:scale-105 text-lg font-semibold"
          >
            <span>Start Your Cooking Journey</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-xl font-bold">CookMateAI</span>
          </div>
          <p className="text-gray-400">
            Your AI-powered kitchen companion • Making cooking accessible to everyone
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;