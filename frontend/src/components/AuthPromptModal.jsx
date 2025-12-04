import React from 'react';
import { X, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthPromptModal = ({ isOpen, onClose, message = 'To save recipes to your favorites or collections, please sign in to your account or create a new one.' }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/signin');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"
        onClick={handleMaybeLater}
      />
      <div className="relative bg-gradient-to-b from-white via-stone-50 to-stone-100 rounded-2xl shadow-2xl shadow-stone-900/20 border border-stone-200/60 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-200/60 shadow-lg shadow-orange-200/30">
          <LogIn className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-xl font-bold text-stone-800 mb-3 tracking-wide">Sign In Required</h3>
        <p className="text-stone-600 mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignIn}
            className="relative w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-semibold overflow-hidden group hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              Sign In
            </span>
          </button>
          <button
            onClick={handleSignUp}
            className="relative w-full px-6 py-3 bg-gradient-to-r from-stone-100 to-stone-200 text-stone-700 rounded-2xl hover:from-stone-200 hover:to-stone-300 transition-all duration-300 font-semibold overflow-hidden group hover:scale-105 border border-stone-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative z-10">Create Account</span>
          </button>
          <button
            onClick={handleMaybeLater}
            className="text-stone-500 hover:text-stone-700 font-medium transition-colors mt-2"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;