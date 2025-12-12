import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { getUserProfile, updateUserProfile, updateUserPersonalization } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeft, Settings, Mail, Calendar,
  Globe, User, Activity, Edit2, Scale, Moon,
  WheatOff, Ban, Flame, Utensils, Check, X,
  ChevronRight, Loader2, Plus, Save, Edit3
} from 'lucide-react';

export default function AccountProfile() {
  const { updateUserProfile: updateAuthUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal state for editing preferences
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesForm, setPreferencesForm] = useState({
    nationality: '',
    age: null,
    gender: '',
    allergies: [],
    dislikedIngredients: [],
    isVegan: false,
    isDiabetic: false,
    isDiet: false,
    isMuslim: false,
    isLactoseFree: false,
    isHighCalorie: false,
    prefersSalty: false,
    prefersSpicy: false,
    prefersSweet: false,
    prefersSour: false
  });
  const [preferencesSaving, setPreferencesSaving] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated before making API call
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError('Please sign in to view your profile');
          return;
        }
        
        const userData = await getUserProfile();
        const userProfile = userData.user;
        
        // Set display name (prefer displayName, fallback to email)
        setDisplayName(userProfile.displayName || userProfile.email || "");
        
        // Set user data
        setUser({
          email: userProfile.email || "",
          joinedDate: userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          }) : "",
          avatar: userProfile.displayName ? userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : userProfile.email ? userProfile.email[0].toUpperCase() : "U"
        });
        
        // Set preferences from personalization data (stored directly in user document)
        const personalization = {
          nationality: userProfile.nationality,
          age: userProfile.age,
          gender: userProfile.gender,
          allergies: userProfile.allergies,
          isVegan: userProfile.isVegan,
          isDiabetic: userProfile.isDiabetic,
          isDiet: userProfile.isDiet, // Changed from isOnDiet to match backend
          isMuslim: userProfile.isMuslim,
          isLactoseFree: userProfile.isLactoseFree,
          isHighCalorie: userProfile.isHighCalorie,
          prefersSalty: userProfile.prefersSalty,
          prefersSpicy: userProfile.prefersSpicy,
          prefersSweet: userProfile.prefersSweet,
          prefersSour: userProfile.prefersSour,
          dislikedIngredients: userProfile.dislikedIngredients || userProfile.dislikes
        };
        setPreferences({
          nationalities: personalization.nationality ? [{
            code: 'XX', // We don't have country codes, using placeholder
            name: personalization.nationality,
            flag: getCountryFlag(personalization.nationality)
          }] : [],
          age: personalization.age || null,
          ageLabel: personalization.age ? getAgeLabel(personalization.age) : "",
          gender: personalization.gender || "",
          allergies: personalization.allergies || [],
          dislikes: personalization.dislikedIngredients || [],
          diets: [
            ...(personalization.isVegan ? [{ label: 'Vegan', icon: Scale, color: 'text-green-600', bg: 'bg-green-50' }] : []),
            ...(personalization.isDiabetic ? [{ label: 'Diabetic', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' }] : []),
            ...(personalization.isDiet ? [{ label: 'Weight Loss', icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50' }] : []),
            ...(personalization.isMuslim ? [{ label: 'Halal', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' }] : []),
            ...(personalization.isLactoseFree ? [{ label: 'Lactose Free', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' }] : []),
            ...(personalization.isHighCalorie ? [{ label: 'Weight Gain', icon: Scale, color: 'text-red-600', bg: 'bg-red-50' }] : [])
          ],
          tastes: [
            ...(personalization.prefersSpicy ? [{ label: 'Spicy', icon: Flame, theme: 'red' }] : []),
            ...(personalization.prefersSalty ? [{ label: 'Savory', icon: Utensils, theme: 'yellow' }] : []),
            ...(personalization.prefersSweet ? [{ label: 'Sweet', icon: Utensils, theme: 'pink' }] : []),
            ...(personalization.prefersSour ? [{ label: 'Sour', icon: Utensils, theme: 'lime' }] : [])
          ]
        });
      } catch (err) {
        console.error('❌ [AccountProfile] Failed to fetch user profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth.currentUser]);

  // Helper functions
  const getCountryFlag = (countryName) => {
    // Simple country flag mapping
    const flagMap = {
      'Philippines': '🇵🇭',
      'Japan': '🇯🇵',
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽'
    };
    return flagMap[countryName] || '🌍';
  };

  const getAgeLabel = (age) => {
    if (age < 18) return 'Minor';
    if (age < 30) return 'Young Adult';
    if (age < 50) return 'Adult';
    return 'Senior';
  };

  // Preferences modal handlers
  const openPreferencesModal = () => {
    // Initialize form with current preferences
    setPreferencesForm({
      nationality: preferences?.nationalities?.[0]?.name || '',
      age: preferences?.age || null,
      gender: preferences?.gender || '',
      allergies: preferences?.allergies || [],
      dislikedIngredients: preferences?.dislikes || [],
      isVegan: preferences?.diets?.some(d => d.label === 'Vegan') || false,
      isDiabetic: preferences?.diets?.some(d => d.label === 'Diabetic') || false,
      isDiet: preferences?.diets?.some(d => d.label === 'Weight Loss') || false,
      isMuslim: preferences?.diets?.some(d => d.label === 'Halal') || false,
      isLactoseFree: preferences?.diets?.some(d => d.label === 'Lactose Free') || false,
      isHighCalorie: preferences?.diets?.some(d => d.label === 'Weight Gain') || false,
      prefersSalty: preferences?.tastes?.some(t => t.label === 'Savory') || false,
      prefersSpicy: preferences?.tastes?.some(t => t.label === 'Spicy') || false,
      prefersSweet: preferences?.tastes?.some(t => t.label === 'Sweet') || false,
      prefersSour: preferences?.tastes?.some(t => t.label === 'Sour') || false
    });
    setShowPreferencesModal(true);
  };

  const handlePreferencesChange = (field, value) => {
    setPreferencesForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAllergy = (allergy) => {
    if (allergy && !preferencesForm.allergies.includes(allergy)) {
      setPreferencesForm(prev => ({ ...prev, allergies: [...prev.allergies, allergy] }));
    }
  };

  const handleRemoveAllergy = (allergy) => {
    setPreferencesForm(prev => ({ ...prev, allergies: prev.allergies.filter(a => a !== allergy) }));
  };

  const handleAddDislike = (dislike) => {
    if (dislike && !preferencesForm.dislikedIngredients.includes(dislike)) {
      setPreferencesForm(prev => ({ ...prev, dislikedIngredients: [...prev.dislikedIngredients, dislike] }));
    }
  };

  const handleRemoveDislike = (dislike) => {
    setPreferencesForm(prev => ({ ...prev, dislikedIngredients: prev.dislikedIngredients.filter(d => d !== dislike) }));
  };

  const savePreferences = async () => {
    try {
      setPreferencesSaving(true);
      console.log('Submitting preferences form:', preferencesForm);
      await updateUserPersonalization({
        ...preferencesForm,
        dislikedIngredients: preferencesForm.dislikedIngredients
      });
      
      // Update local state to reflect changes
      setPreferences(prev => ({
        ...prev,
        nationalities: preferencesForm.nationality ? [{
          code: 'XX',
          name: preferencesForm.nationality,
          flag: getCountryFlag(preferencesForm.nationality)
        }] : [],
        age: preferencesForm.age,
        ageLabel: preferencesForm.age ? getAgeLabel(preferencesForm.age) : "",
        gender: preferencesForm.gender,
        allergies: preferencesForm.allergies,
        dislikes: preferencesForm.dislikedIngredients,
        diets: [
          ...(preferencesForm.isVegan ? [{ label: 'Vegan', icon: Scale, color: 'text-green-600', bg: 'bg-green-50' }] : []),
          ...(preferencesForm.isDiabetic ? [{ label: 'Diabetic', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' }] : []),
          ...(preferencesForm.isDiet ? [{ label: 'Weight Loss', icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50' }] : []),
          ...(preferencesForm.isMuslim ? [{ label: 'Halal', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' }] : []),
          ...(preferencesForm.isLactoseFree ? [{ label: 'Lactose Free', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' }] : []),
          ...(preferencesForm.isHighCalorie ? [{ label: 'Weight Gain', icon: Scale, color: 'text-red-600', bg: 'bg-red-50' }] : [])
        ],
        tastes: [
          ...(preferencesForm.prefersSpicy ? [{ label: 'Spicy', icon: Flame, theme: 'red' }] : []),
          ...(preferencesForm.prefersSalty ? [{ label: 'Savory', icon: Utensils, theme: 'yellow' }] : []),
          ...(preferencesForm.prefersSweet ? [{ label: 'Sweet', icon: Utensils, theme: 'pink' }] : []),
          ...(preferencesForm.prefersSour ? [{ label: 'Sour', icon: Utensils, theme: 'lime' }] : [])
        ]
      }));
      
      setShowPreferencesModal(false);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleSaveName = async () => {
    try {
      setSaving(true);
      
      // Use the useAuth hook's updateUserProfile function which updates both Firestore and Firebase Auth
      await updateAuthUserProfile({ displayName });
      
      // Update local state to reflect the change immediately
      setDisplayName(displayName);
      
      // Update the user state to trigger sidebar update
      setUser(prev => ({ ...prev, displayName }));
      
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
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
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="text-red-600 text-sm font-semibold">Error loading profile</div>
            <div className="text-red-500 text-xs mt-1">{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-stone-600" />
              <span className="text-stone-600 font-medium">Loading profile...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-orange-100 to-orange-50"></div>

              <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 md:pt-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-white shrink-0">
                  {user?.avatar || "U"}
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
                    <h2 className="text-2xl md:text-3xl font-bold text-stone-800">{displayName || "User"}</h2>
                  )}

                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-stone-500 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span>{user?.email || "No email"}</span>
                    </div>
                    <div className="hidden md:block w-1 h-1 bg-stone-300 rounded-full"></div>
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {user?.joinedDate || "Unknown"}</span>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2 text-stone-400 hover:bg-stone-100 rounded-xl transition-colors"
                      disabled={saving}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
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
          </>
        )}

        {!loading && (
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
                       {preferences?.nationalities?.length > 0 ? (
                         preferences.nationalities.map(n => (
                           <div key={n.code} className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl border border-stone-100">
                             <span className="text-xl">{n.flag}</span>
                             <span className="text-sm font-semibold text-stone-700">{n.name}</span>
                           </div>
                         ))
                       ) : (
                         <span className="text-xs text-stone-400 italic">Not specified</span>
                       )}
                     </div>
                   </li>

                   <div className="h-px bg-stone-100 w-full"></div>

                   <li className="flex items-center justify-between">
                     <span className="text-stone-500 text-sm font-medium">Gender</span>
                     <span className="font-bold text-stone-800 bg-stone-50 px-3 py-1 rounded-lg border border-stone-100">
                       {preferences?.gender || "Not specified"}
                     </span>
                   </li>

                   <li className="flex items-center justify-between">
                     <span className="text-stone-500 text-sm font-medium">Age Group</span>
                     <div className="text-right">
                       <div className="font-bold text-stone-800">{preferences?.age || "-"}</div>
                       <div className="text-xs text-stone-400 font-medium">{preferences?.ageLabel || "Not specified"}</div>
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
                    onClick={openPreferencesModal}
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
                      {preferences?.diets?.length > 0 ? (
                        preferences.diets.map((diet, idx) => (
                          <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-stone-100 ${diet.bg} ${diet.color}`}>
                            <div className="bg-white p-1.5 rounded-full shadow-sm">
                              <diet.icon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">{diet.label}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">No dietary goals set</span>
                      )}
                    </div>
                  </div>

                  {/* Taste Profile */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Taste Profile</h4>
                    <div className="flex flex-wrap gap-3">
                      {preferences?.tastes?.length > 0 ? (
                        preferences.tastes.map((taste, idx) => {
                           const themeColors = {
                              yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
                              red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                              orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
                              pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
                              lime: { bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-200' }
                           }[taste.theme];
                           
                           // Fallback to default colors if themeColors is undefined
                           const colors = themeColors || { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200' };
                           
                           return (
                             <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${colors.bg} ${colors.border} ${colors.text}`}>
                                <taste.icon className="w-4 h-4" />
                                <span className="font-bold text-sm">{taste.label}</span>
                             </div>
                           );
                        })
                      ) : (
                        <span className="text-xs text-stone-400 italic">No taste preferences set</span>
                      )}
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
                        {preferences?.allergies?.length > 0 ? preferences.allergies.map(tag => (
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
                        {preferences?.dislikes?.length > 0 ? preferences.dislikes.map(tag => (
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
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-100">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg">Edit Preferences</h3>
                    <p className="text-stone-500 text-sm">Update your dietary and taste preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Nationality */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2">Nationality</label>
                <input
                  type="text"
                  value={preferencesForm.nationality}
                  onChange={(e) => handlePreferencesChange('nationality', e.target.value)}
                  placeholder="e.g., Philippines, Japan, United States"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2">Age</label>
                <input
                  type="number"
                  value={preferencesForm.age || ''}
                  onChange={(e) => handlePreferencesChange('age', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 25"
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2">Gender</label>
                <select
                  value={preferencesForm.gender}
                  onChange={(e) => handlePreferencesChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Other</option>
                  <option value="pnts">Prefer not to say</option>
                </select>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2">Allergies</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Peanuts, Shellfish..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddAllergy(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling;
                        handleAddAllergy(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferencesForm.allergies.map((allergy, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-full border border-red-200">
                        <span className="text-sm font-semibold">{allergy}</span>
                        <button
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="hover:bg-red-200 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {preferencesForm.allergies.length === 0 && (
                      <span className="text-stone-400 text-sm italic">No allergies added</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Disliked Ingredients */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2">Disliked Ingredients</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Cilantro, Raisins..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddDislike(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling;
                        handleAddDislike(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferencesForm.dislikedIngredients.map((dislike, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-stone-50 text-stone-700 rounded-full border border-stone-200">
                        <span className="text-sm font-semibold">{dislike}</span>
                        <button
                          onClick={() => handleRemoveDislike(dislike)}
                          className="hover:bg-stone-200 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {preferencesForm.dislikedIngredients.length === 0 && (
                      <span className="text-stone-400 text-sm italic">No disliked ingredients added</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-3">Dietary Preferences</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'isVegan', label: 'Vegan' },
                    { key: 'isDiabetic', label: 'Diabetic' },
                    { key: 'isDiet', label: 'Weight Loss' },
                    { key: 'isMuslim', label: 'Halal' },
                    { key: 'isLactoseFree', label: 'Lactose Free' },
                    { key: 'isHighCalorie', label: 'Weight Gain' }
                  ].map((diet) => (
                    <label key={diet.key} className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesForm[diet.key]}
                        onChange={(e) => handlePreferencesChange(diet.key, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-white border-stone-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-stone-700">{diet.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Taste Preferences */}
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-3">Taste Preferences</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'prefersSpicy', label: 'Spicy', theme: 'red' },
                    { key: 'prefersSalty', label: 'Savory', theme: 'yellow' },
                    { key: 'prefersSweet', label: 'Sweet', theme: 'pink' },
                    { key: 'prefersSour', label: 'Sour', theme: 'lime' }
                  ].map((taste) => (
                    <label key={taste.key} className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesForm[taste.key]}
                        onChange={(e) => handlePreferencesChange(taste.key, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-white border-stone-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-stone-700">{taste.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-6 py-3 text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                disabled={preferencesSaving}
                className="flex items-center gap-3 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {preferencesSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}