import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserPersonalization } from '../../utils/api';
import {
  ChefHat, Globe, User, Heart, Utensils, Flame,
  ArrowRight, ArrowLeft, X, Check, Search,
  Baby, School, UserCircle, Briefcase, Glasses, UserPlus,
  HelpCircle, CheckCircle2, Moon,
  Candy, Citrus, Mars, Venus, ChevronLeft, ChevronRight,
  WheatOff, Ban, Scale, Activity, Milk, TrendingUp, Plus
} from 'lucide-react';

// --- Data Constants ---

const COUNTRIES = [
  // Asia
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  
  // Europe
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  
  // Americas
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  
  // Africa
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  
  // Oceania
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  
  // Caribbean
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
];

const AGE_CATEGORIES = [
  { min: 0, max: 4, label: 'Baby', icon: Baby },
  { min: 5, max: 13, label: 'Kid', icon: School },
  { min: 14, max: 17, label: 'Teen', icon: User },
  { min: 18, max: 25, label: 'Young Adult', icon: UserCircle },
  { min: 26, max: 35, label: 'Middle Aged', icon: Briefcase },
  { min: 36, max: 59, label: 'Adult', icon: UserPlus },
  { min: 60, max: 120, label: 'Senior', icon: Glasses },
];

const GENDERS = [
  { id: 'male', label: 'Male', icon: Mars },
  { id: 'female', label: 'Female', icon: Venus },
  { id: 'others', label: 'Other', icon: Heart },
  { id: 'pnts', label: 'Prefer Not to Say', icon: HelpCircle },
];

// --- Helper Components ---

const HorizontalAgePicker = ({ value, onChange }) => {
  const containerRef = useRef(null);
  const ITEM_WIDTH = 80;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = (value - 1) * ITEM_WIDTH;
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const index = Math.round(scrollLeft / ITEM_WIDTH);
      const newValue = index + 1;

      if (newValue >= 1 && newValue <= 100 && newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const scrollBy = (amount) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: amount * ITEM_WIDTH, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto group select-none">
       {/* Arrows */}
       <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur shadow-sm border border-gray-100 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-all active:scale-95 hidden md:flex"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur shadow-sm border border-gray-100 p-2 rounded-full text-gray-500 hover:text-orange-600 transition-all active:scale-95 hidden md:flex"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Picker Window */}
      <div className="relative h-24 md:h-28 bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
        {/* Center Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-full bg-white border-x-2 border-orange-500/20 z-10 pointer-events-none shadow-sm opacity-80"></div>

        {/* Numbers */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide flex items-center"
          style={{ paddingLeft: 'calc(50% - 40px)', paddingRight: 'calc(50% - 40px)' }}
        >
          {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    left: (num - 1) * ITEM_WIDTH,
                    behavior: 'smooth'
                  });
                  onChange(num);
                }
              }}
              className={`flex-shrink-0 w-[80px] h-full flex items-center justify-center snap-center transition-all duration-300 cursor-pointer ${
                num === value 
                  ? 'text-4xl md:text-5xl font-black text-orange-600 scale-110 z-20' 
                  : Math.abs(num - value) <= 2
                      ? 'text-xl md:text-2xl text-gray-300 font-bold' 
                      : 'text-base md:text-lg text-gray-200 opacity-30'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TagInput = ({ tags, onAdd, onRemove, placeholder, icon: Icon, colorClass = "orange" }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  const activeColor = colorClass === "red" ? "ring-red-500" : "ring-orange-500";
  const tagBg = colorClass === "red" ? "bg-red-50 text-red-700 border-red-100" : "bg-orange-50 text-orange-700 border-orange-100";
  const btnColor = colorClass === "red" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600";

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="relative group">
        <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors`} />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-12 pr-14 py-3 md:py-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ${activeColor} focus:ring-opacity-20 transition-all text-base shadow-sm`}
        />

        {/* Mobile-friendly Add Button */}
        <button
          onClick={handleSendClick}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white shadow-sm transition-all active:scale-95 ${btnColor} ${!input.trim() ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {tags.map((tag, idx) => (
            <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${tagBg} animate-fade-in`}>
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:bg-black/5 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2 md:py-4 text-gray-400 text-xs md:text-sm italic">
          No items added yet. Type above and press +
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---

export default function AccountPreferences() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [formData, setFormData] = useState({
    nationalities: [],
    age: 25,
    gender: '',
    allergies: [],
    dislikedIngredients: [],
    isVegan: false,
    isDiet: false,
    isMuslim: false,
    isDiabetic: false,
    isLactoseFree: false,
    isHighCalorie: false,
    preferSalty: false,
    preferSpicy: false,
    preferSweet: false,
    preferSour: false,
  });

  const getAgeCategory = (age) => AGE_CATEGORIES.find(c => age >= c.min && age <= c.max) || AGE_CATEGORIES[AGE_CATEGORIES.length - 1];
  const currentAgeCat = getAgeCategory(formData.age);

  // --- Logic ---

  const handleValidation = (currentStep) => {
    switch(currentStep) {
      case 1: return formData.nationalities.length > 0;
      case 2: return true;
      case 3: return formData.gender !== '';
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  };

  const nextStep = () => handleValidation(step) && setStep(s => Math.min(s + 1, 7));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation(7)) return;
    
    try {
      setIsLoading(true);
      
      // Prepare the data to send to the backend
      console.log('Submitting personalization data:', {
        nationality: formData.nationalities.length > 0 ? formData.nationalities[0].name : '',
        age: formData.age,
        gender: formData.gender,
        allergies: formData.allergies,
        dislikedIngredients: formData.dislikedIngredients,
        isVegan: formData.isVegan,
        isDiet: formData.isDiet,
        isMuslim: formData.isMuslim,
        isDiabetic: formData.isDiabetic,
        isLactoseFree: formData.isLactoseFree,
        isHighCalorie: formData.isHighCalorie,
        prefersSalty: formData.preferSalty,
        prefersSpicy: formData.preferSpicy,
        prefersSweet: formData.preferSweet,
        prefersSour: formData.preferSour
      });
      
      const personalizationData = {
        nationality: formData.nationalities.length > 0 ? formData.nationalities[0].name : '',
        age: formData.age,
        gender: formData.gender,
        allergies: formData.allergies,
        dislikedIngredients: formData.dislikedIngredients,
        isVegan: formData.isVegan,
        isDiet: formData.isDiet,
        isMuslim: formData.isMuslim,
        isDiabetic: formData.isDiabetic,
        isLactoseFree: formData.isLactoseFree,
        isHighCalorie: formData.isHighCalorie,
        prefersSalty: formData.preferSalty,
        prefersSpicy: formData.preferSpicy,
        prefersSweet: formData.preferSweet,
        prefersSour: formData.preferSour
      };
      
      // Save to backend
      await updateUserPersonalization(personalizationData);
      
      // Navigate to home
      navigate('/home');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Steps ---

  const Step1_Nationality = () => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const toggle = (country) => {
      setFormData(prev => {
        const exists = prev.nationalities.find(n => n.code === country.code);
        if (exists) return { ...prev, nationalities: prev.nationalities.filter(n => n.code !== country.code) };
        if (prev.nationalities.length >= 2) return prev;
        return { ...prev, nationalities: [...prev.nationalities, country] };
      });
      setSearch(''); setIsOpen(false);
    };

    return (
      <div className="flex flex-col h-full md:justify-center w-full max-w-lg mx-auto animate-fade-in">
        {/* Header - Pinned Top Center */}
        <div className="text-center mb-6 md:mb-8 pt-4 md:pt-0">
           <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-blue-600 rotate-3 transition-transform hover:rotate-6">
             <Globe className="w-7 h-7 md:w-8 md:h-8" />
           </div>
           <h3 className="text-xl md:text-2xl font-bold text-gray-900">Where are you from?</h3>
           <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2">Select up to 2 regions.</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-start md:justify-center space-y-4">
          <div className="relative z-50">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
              />
            </div>

            {isOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 md:max-h-60 overflow-y-auto z-50 p-2">
                {filtered.length > 0 ? filtered.map(c => {
                  const isSelected = formData.nationalities.some(n => n.code === c.code);
                  const disabled = !isSelected && formData.nationalities.length >= 2;
                  return (
                    <button
                      key={c.code}
                      disabled={disabled}
                      onClick={() => toggle(c)}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'} ${disabled ? 'opacity-40' : ''}`}
                    >
                      <span className="flex items-center gap-3 font-medium">
                        <span className="text-2xl">{c.flag}</span>
                        {c.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </button>
                  );
                }) : (
                  <div className="p-4 text-center text-gray-400 text-sm">No matches found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 min-h-[50px]">
            {formData.nationalities.map(nat => (
              <div key={nat.code} className="flex items-center gap-2 bg-blue-600 text-white pl-4 pr-2 py-2 rounded-full shadow-md animate-scale-in">
                <span className="text-lg">{nat.flag}</span>
                <span className="font-semibold text-sm">{nat.name}</span>
                <button
                  onClick={() => toggle(nat)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-1 ml-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Step2_Age = () => (
    <div className="flex flex-col h-full md:justify-center w-full max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-6 pt-0 md:pt-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">How old are you?</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">We use this to adjust nutritional recommendations.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 md:space-y-8">
        <div className="w-full">
          <HorizontalAgePicker
            value={formData.age}
            onChange={(val) => setFormData(p => ({ ...p, age: val }))}
          />
        </div>

        <div className="inline-flex items-center gap-4 bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100">
          <div className="p-2 bg-white rounded-xl shadow-sm text-orange-500">
            {React.createElement(currentAgeCat.icon, { size: 24 })}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Life Stage</div>
            <div className="text-lg font-bold text-gray-800">{currentAgeCat.label}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const Step3_Gender = () => (
    <div className="flex flex-col h-full md:justify-center w-full max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-6 pt-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">How do you identify?</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">Helping us personalize the conversation.</p>
      </div>

      <div className="flex-1 flex flex-col justify-start md:justify-center">
        {/* Forced 2 columns on mobile for Male/Female as requested */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4">
          {GENDERS.map(g => {
            const isSelected = formData.gender === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setFormData(p => ({ ...p, gender: g.id }))}
                className={`flex flex-col sm:flex-row items-center sm:gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-center sm:text-left group ${
                  isSelected 
                    ? 'border-orange-500 bg-orange-50 shadow-md' 
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors mb-2 sm:mb-0 ${
                   isSelected ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-orange-500'
                }`}>
                   <g.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1">
                  <span className={`block font-bold text-sm md:text-lg ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{g.label}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-orange-500 hidden sm:block ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const Step4_Allergies = () => (
    <div className="flex flex-col h-full md:justify-center w-full max-w-xl mx-auto animate-fade-in text-center">
      <div className="mb-6 pt-4">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-red-500 -rotate-3">
          <WheatOff className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Any Food Allergies?</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">We will strictly filter these out from recipes.</p>
      </div>

      <div className="flex-1 flex flex-col justify-start md:justify-center">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm text-left">
          <TagInput
            tags={formData.allergies}
            icon={Search}
            placeholder="e.g. Peanuts, Shellfish..."
            onAdd={(tag) => setFormData(p => ({ ...p, allergies: [...p.allergies, tag] }))}
            onRemove={(tag) => setFormData(p => ({ ...p, allergies: p.allergies.filter(t => t !== tag) }))}
            colorClass="red"
          />
        </div>
      </div>
    </div>
  );

  const Step5_Disliked = () => (
    <div className="flex flex-col h-full md:justify-center w-full max-w-xl mx-auto animate-fade-in text-center">
      <div className="mb-6 pt-4">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-gray-600 rotate-3">
          <Ban className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Disliked Ingredients</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">Things you prefer not to see in your meals.</p>
      </div>

      <div className="flex-1 flex flex-col justify-start md:justify-center">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm text-left">
          <TagInput
            tags={formData.dislikedIngredients}
            icon={Utensils}
            placeholder="e.g. Cilantro, Raisins..."
            onAdd={(tag) => setFormData(p => ({ ...p, dislikedIngredients: [...p.dislikedIngredients, tag] }))}
            onRemove={(tag) => setFormData(p => ({ ...p, dislikedIngredients: p.dislikedIngredients.filter(t => t !== tag) }))}
            colorClass="orange"
          />
        </div>
      </div>
    </div>
  );

  const Step6_Goals = () => (
    <div className="flex flex-col h-full md:justify-center w-full max-w-3xl mx-auto animate-fade-in text-center">
      <div className="mb-6 pt-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Dietary Needs</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">Select any lifestyles or medical requirements.</p>
      </div>

      <div className="flex-1 flex flex-col justify-start md:justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { key: 'isVegan', label: 'Vegan', sub: 'Plant-based', icon: Utensils, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            { key: 'isDiet', label: 'Weight Loss', sub: 'Low Calorie', icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { key: 'isMuslim', label: 'Halal', sub: 'Muslim Friendly', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
            { key: 'isDiabetic', label: 'Low Sugar', sub: 'Diabetic Friendly', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { key: 'isLactoseFree', label: 'Lactose Free', sub: 'No Dairy', icon: Milk, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
            { key: 'isHighCalorie', label: 'Weight Gain', sub: 'High Nutrient', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          ].map((item) => {
            const isActive = formData[item.key];
            return (
              <button
                key={item.key}
                onClick={() => setFormData(p => ({ ...p, [item.key]: !p[item.key] }))}
                className={`relative p-3 md:p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  isActive 
                    ? `bg-white ${item.border} shadow-lg scale-105 z-10` 
                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors mb-1 ${
                  isActive ? item.bg + ' ' + item.color : 'bg-gray-100 text-gray-400'
                }`}>
                  {isActive ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <item.icon className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <div className="text-center">
                  <span className={`block font-bold text-sm md:text-base ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.label}
                  </span>
                  <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wide ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.sub}
                  </span>
                </div>
                {isActive && (
                  <div className={`absolute inset-0 rounded-2xl border-2 ${item.border.replace('border', 'border')} opacity-50 pointer-events-none`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const Step7_Taste = () => (
    <div className="flex flex-col h-full md:justify-center w-full max-w-3xl mx-auto animate-fade-in text-center">
      <div className="mb-6 pt-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Taste Profile</h3>
        <p className="text-sm md:text-base text-gray-500 mt-1">What flavors excite your palate?</p>
      </div>

      <div className="flex-1 flex flex-col justify-start md:justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
           {[
             { id: 'preferSalty', label: 'Salty', desc: 'Savory & Umami', icon: Utensils, theme: 'yellow' },
             { id: 'preferSpicy', label: 'Spicy', desc: 'Hot & Fiery', icon: Flame, theme: 'red' },
             { id: 'preferSweet', label: 'Sweet', desc: 'Sugary Treats', icon: Candy, theme: 'pink' },
             { id: 'preferSour', label: 'Sour', desc: 'Tart & Tangy', icon: Citrus, theme: 'lime' },
           ].map((t) => {
             const active = formData[t.id];
             const themeColors = {
               yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-400', ring: 'bg-yellow-400' },
               red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-400', ring: 'bg-red-500' },
               pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-400', ring: 'bg-pink-400' },
               lime: { bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-400', ring: 'bg-lime-500' },
             }[t.theme];

             return (
               <button
                 key={t.id}
                 onClick={() => setFormData(p => ({ ...p, [t.id]: !p[t.id] }))}
                 className={`relative p-4 md:p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group overflow-hidden ${
                   active ? `bg-white ${themeColors.border} shadow-md` : 'bg-white border-gray-100 hover:border-gray-200'
                 }`}
               >
                 {active && <div className={`absolute inset-0 opacity-10 ${themeColors.bg.replace('50', '200')}`} />}

                 <div className="flex items-center gap-3 md:gap-4 relative z-10">
                   <div className={`p-2 md:p-3 rounded-xl transition-all ${active ? themeColors.bg + ' ' + themeColors.text : 'bg-gray-100 text-gray-400'}`}>
                      <t.icon className="w-5 h-5 md:w-6 md:h-6" />
                   </div>
                   <div className="text-left">
                      <span className={`block font-bold text-base md:text-lg ${active ? 'text-gray-900' : 'text-gray-600'}`}>{t.label}</span>
                      <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">{t.desc}</span>
                   </div>
                 </div>

                 <div className={`w-12 h-7 md:w-14 md:h-8 rounded-full relative transition-colors duration-300 shadow-inner z-10 ${active ? themeColors.ring : 'bg-gray-200'}`}>
                   <div className={`absolute top-1 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full shadow transition-transform duration-300 ${active ? 'translate-x-6 md:translate-x-7' : 'translate-x-1'}`} />
                 </div>
               </button>
             );
           })}
        </div>
      </div>
    </div>
  );

  // --- Main Layout ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-orange-50/50 flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-6 pb-2 md:py-8 shrink-0 z-20">
        <div className="flex justify-between items-center mb-4 md:mb-8">
          <div className="flex items-center gap-2 text-gray-900">
            <ChefHat className="w-7 h-7 md:w-8 md:h-8 text-orange-600" />
            <span className="font-bold text-lg md:text-xl tracking-tight">CookMate</span>
          </div>
          <div className="text-[10px] md:text-xs font-bold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
            STEP {step} OF 7
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1.5 md:gap-2 h-1.5">
          {[1,2,3,4,5,6,7].map(i => (
            <div
              key={i}
              className={`h-full rounded-full flex-1 transition-all duration-700 ease-out ${
                i <= step ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Area - Fixed Height / No Scroll Container */}
      <div className="flex-1 relative w-full max-w-4xl mx-auto px-4 md:px-6">
        <div className="absolute inset-0 px-4 md:px-6 py-2 md:py-8 overflow-y-auto scrollbar-hide">
          {step === 1 && <Step1_Nationality />}
          {step === 2 && <Step2_Age />}
          {step === 3 && <Step3_Gender />}
          {step === 4 && <Step4_Allergies />}
          {step === 5 && <Step5_Disliked />}
          {step === 6 && <Step6_Goals />}
          {step === 7 && <Step7_Taste />}
          {/* Spacer for fixed footer */}
          <div className="h-24 md:h-32"></div>
        </div>
      </div>

      {/* Footer / Navigation - Fixed Bottom */}
      <div className="w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 md:p-6 shrink-0 z-50 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex gap-3 md:gap-4 items-center">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center transition-all ${
              step === 1 
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={step < 7 ? nextStep : handleSubmit}
            disabled={!handleValidation(step) || isLoading}
            className={`flex-1 h-12 md:h-14 rounded-2xl font-bold text-base md:text-lg shadow-xl transition-all flex items-center justify-center gap-2 md:gap-3 ${
              !handleValidation(step) 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gray-900 text-white hover:bg-black hover:scale-[1.01] hover:shadow-2xl'
            }`}
          >
            {isLoading ? (
               <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <>
                 {step < 7 ? 'Continue' : 'Finish Profile'}
                 {step < 7 ? <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /> : <Check className="w-4 h-4 md:w-5 md:h-5" />}
               </>
            )}
          </button>
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => navigate('/home')}
            className="text-[10px] md:text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors uppercase tracking-wider"
          >
            Skip for now
          </button>
        </div>
      </div>

    </div>
  );
}