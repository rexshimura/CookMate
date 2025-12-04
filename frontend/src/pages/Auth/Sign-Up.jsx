import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Mail, Lock, User, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; 
import { useNavigate } from "react-router-dom";


export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Display Name
      await updateProfile(user, {
        displayName: name
      });

      // 3. Create User Document in Firestore (Create 'users' collection)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        favorites: []
      });

      navigate("/home"); 

    } catch (error) {
      console.error("Signup Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please try signing in instead.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.stone.400)_1px,transparent_0)] [background-size:24px_24px]"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-32 right-16 w-40 h-40 bg-gradient-to-br from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute bottom-32 left-16 w-40 h-40 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

      <div className="relative z-10">
        <div className="absolute top-6 left-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-stone-500 hover:text-orange-600 transition-all duration-200 text-sm font-medium group hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Link>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center items-center gap-3 mb-6 animate-fadeIn">
            <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-200/50 overflow-hidden group">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <ChefHat className="w-7 h-7 text-white relative z-10" />
            </div>
            <div className="relative">
              <span className="text-3xl font-bold gradient-text tracking-tight">CookMate</span>
              <Sparkles className="absolute -top-1 -right-2 w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-stone-900 tracking-tight mb-2">Create your account</h2>
            <p className="text-stone-600">Start your AI-powered cooking journey today</p>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gradient-to-b from-white/80 via-stone-50/80 to-stone-100/80 backdrop-blur-xl py-10 px-8 shadow-2xl shadow-stone-900/10 border border-stone-200/60 sm:rounded-3xl sm:px-12 relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-3xl hover:shadow-stone-900/15">
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
            
            {/* Accent border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-t-3xl" />

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium animate-fadeIn">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="animate-slideUp">
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-stone-400 group-focus-within:text-orange-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-stone-200/60 rounded-2xl leading-6 bg-white/50 backdrop-blur-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 hover:border-stone-300 focus:scale-[1.02] hover:scale-[1.01]"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="animate-slideUp delay-75">
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Email address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-stone-400 group-focus-within:text-orange-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-stone-200/60 rounded-2xl leading-6 bg-white/50 backdrop-blur-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 hover:border-stone-300 focus:scale-[1.02] hover:scale-[1.01]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="animate-slideUp delay-150">
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-orange-500 transition-colors duration-200" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-stone-200/60 rounded-2xl leading-6 bg-white/50 backdrop-blur-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 hover:border-stone-300 focus:scale-[1.02] hover:scale-[1.01]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="animate-slideUp delay-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center gap-3 py-4 px-6 border border-transparent rounded-2xl shadow-2xl shadow-orange-200/50 text-white font-bold text-base bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-3xl hover:shadow-orange-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                >
                  {/* Button shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center animate-slideUp delay-250">
              <div className="text-sm text-stone-600">
                Already have an account?{' '}
                <Link 
                  to="/signin" 
                  className="font-bold text-orange-600 hover:text-orange-500 transition-all duration-200 hover:underline relative group"
                >
                  Log in
                  <div className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}