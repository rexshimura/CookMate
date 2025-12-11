import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Mail, Calendar,
  Globe, User, Activity, Edit2, Scale, Moon,
  WheatOff, Ban, Flame, Utensils, Check, X,
  ChevronRight
} from 'lucide-react';

export default function AccountProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("Rex Shimura");

  // Static Data
  const user = {
    email: "rex@example.com",
    joinedDate: "December 2023",
    avatar: "RS",
  };

  const preferences = {
    nationalities: [
      { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
      { code: 'JP', name: 'Japan', flag: '🇯🇵' }
    ],
    age: 25,
    ageLabel: "Young Adult",
    gender: "Male",
    allergies: ["Peanuts", "Shellfish"],
    dislikes: ["Cilantro", "Raisins"],
    diets: [
      { label: 'Weight Loss', icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Halal', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
    ],
    tastes: [
      { label: 'Spicy', icon: Flame, theme: 'red' },
      { label: 'Savory', icon: Utensils, theme: 'yellow' }
    ]
  };

  const handleSaveName = () => {
    setIsEditing(false);
    // Logic to save name would go here
  };

  return (
    <div className="min-h-screen bg-stone-50/30 font-sans pb-20 md:pb-0">

      {/* Top Nav */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="p-2 -ml-2 hover:bg-stone-50 rounded-full transition-colors text-stone-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-stone-800">My Profile</h1>
          </div>
          <button className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-orange-100 to-orange-50"></div>

          <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 md:pt-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {user.avatar}
            </div>

            <div className="text-center md:text-left flex-1 space-y-2 mb-1 w-full md:w-auto">
              {isEditing ? (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-2xl md:text-3xl font-bold text-stone-800 bg-transparent border-b-2 border-orange-200 focus:border-orange-500 outline-none px-1 w-full md:w-auto text-center md:text-left"
                    autoFocus
                  />
                </div>
              ) : (
                <h2 className="text-2xl md:text-3xl font-bold text-stone-800">{displayName}</h2>
              )}

              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-stone-500 text-sm">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="hidden md:block w-1 h-1 bg-stone-300 rounded-full"></div>
                <div className="flex items-center gap-1.5 text-stone-400">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user.joinedDate}</span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveName}
                  className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Column: Personal Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm h-full">
               <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                 <User className="w-4 h-4" /> Personal Details
               </h3>
               <ul className="space-y-6">
                 <li className="flex flex-col gap-2">
                   <span className="text-stone-500 text-sm flex items-center gap-2 font-medium">Nationality</span>
                   <div className="flex flex-wrap gap-2">
                     {preferences.nationalities.map(n => (
                       <div key={n.code} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl border border-stone-100">
                         <span className="text-xl">{n.flag}</span>
                         <span className="text-sm font-semibold text-stone-700">{n.name}</span>
                       </div>
                     ))}
                   </div>
                 </li>

                 <div className="h-px bg-stone-100 w-full"></div>

                 <li className="flex items-center justify-between">
                   <span className="text-stone-500 text-sm font-medium">Gender</span>
                   <span className="font-bold text-stone-800 bg-stone-50 px-3 py-1 rounded-lg border border-stone-100">
                     {preferences.gender}
                   </span>
                 </li>

                 <li className="flex items-center justify-between">
                   <span className="text-stone-500 text-sm font-medium">Age Group</span>
                   <div className="text-right">
                     <div className="font-bold text-stone-800">{preferences.age}</div>
                     <div className="text-xs text-stone-400 font-medium">{preferences.ageLabel}</div>
                   </div>
                 </li>
               </ul>
            </div>
          </div>

          {/* Right Column: Food Preferences */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  Food Preferences
                </h3>
                <button
                  onClick={() => navigate('/preferences')}
                  className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  Update Preferences
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Dietary Goals */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Dietary Goals</h4>
                  <div className="flex flex-wrap gap-3">
                    {preferences.diets.map((diet, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-stone-100 ${diet.bg} ${diet.color}`}>
                        <div className="bg-white p-1.5 rounded-full shadow-sm">
                          <diet.icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm">{diet.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Taste Profile */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Taste Profile</h4>
                  <div className="flex flex-wrap gap-3">
                    {preferences.tastes.map((taste, idx) => {
                       const themeColors = {
                          yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
                          red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                       }[taste.theme];
                       return (
                         <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${themeColors.bg} ${themeColors.border} ${themeColors.text}`}>
                            <taste.icon className="w-4 h-4" />
                            <span className="font-bold text-sm">{taste.label}</span>
                         </div>
                       );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Allergies */}
                  <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100">
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                      <WheatOff className="w-4 h-4" />
                      <span className="font-bold text-sm">Allergies</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.allergies.length > 0 ? preferences.allergies.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white text-red-700 text-xs font-bold rounded-lg border border-red-100 shadow-sm">
                          {tag}
                        </span>
                      )) : <span className="text-xs text-red-400 italic">None</span>}
                    </div>
                  </div>

                  {/* Dislikes */}
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                    <div className="flex items-center gap-2 mb-3 text-stone-600">
                      <Ban className="w-4 h-4" />
                      <span className="font-bold text-sm">Dislikes</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.dislikes.length > 0 ? preferences.dislikes.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white text-stone-600 text-xs font-bold rounded-lg border border-stone-200 shadow-sm">
                          {tag}
                        </span>
                      )) : <span className="text-xs text-stone-400 italic">None</span>}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}