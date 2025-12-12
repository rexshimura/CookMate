const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Middleware to verify Firebase Auth tokens
const verifyAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // For real Firebase authentication
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}; 

// 1. Get User Profile
router.get('/profile', verifyAuthToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Update User Profile
router.put('/profile', verifyAuthToken, async (req, res) => {
  try {
    const updates = req.body; // e.g. { displayName: "Chef John" }

    // .update() only changes the fields provided, leaves others alone
    await db.collection('users').doc(req.userId).update(updates);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Update User Personalization Survey
router.put('/personalization', verifyAuthToken, async (req, res) => {
  try {
    const {
      nationality,
      age,
      gender,
      allergies,
      isVegan,
      isDiabetic,
      isDiet, // Changed from isOnDiet to match frontend
      isMuslim,
      isLactoseFree,
      isHighCalorie,
      prefersSalty,
      prefersSpicy,
      prefersSweet,
      prefersSour,
      dislikedIngredients
    } = req.body;

    // List of countries with well-known cuisines and recipes for validation
    const validCountries = [
      // Asia
      'China', 'Japan', 'South Korea', 'Vietnam', 'Thailand', 'India', 'Indonesia', 'Malaysia', 'Philippines', 'Singapore',
      'Pakistan', 'Iran', 'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Afghanistan',
      'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos', 'Kazakhstan', 'Uzbekistan', 'Georgia', 'Armenia',
      
      // Europe
      'Italy', 'France', 'Spain', 'Portugal', 'Greece', 'Germany', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
      'Poland', 'Czech Republic', 'Hungary', 'Slovakia', 'Slovenia', 'Croatia', 'Serbia', 'Romania', 'Bulgaria', 'Russia',
      'Ukraine', 'Belarus', 'Moldova', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Iceland', 'United Kingdom', 'Ireland',
      'Luxembourg', 'Monaco', 'Vatican City', 'San Marino',
      
      // Americas
      'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Peru', 'Chile', 'Venezuela', 'Ecuador',
      'Guatemala', 'Cuba', 'Jamaica', 'Dominican Republic', 'Honduras', 'Nicaragua', 'Panama', 'Bolivia', 'Uruguay', 'Paraguay',
      'Belize', 'El Salvador', 'Costa Rica',
      
      // Africa
      'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Nigeria', 'Kenya', 'Ethiopia', 'Ghana', 'Tanzania', 'Uganda', 'Sudan',
      'Libya', 'Senegal', 'Ivory Coast', 'Cameroon', 'Burkina Faso', 'Zimbabwe', 'Zambia', 'Angola', 'DR Congo', 'Congo',
      'Gabon', 'Equatorial Guinea', 'Cabo Verde', 'Sao Tome and Principe', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia',
      'Benin', 'Togo', 'Niger', 'Chad', 'Central African Republic', 'Djibouti', 'Eritrea', 'Somalia', 'Seychelles', 'Comoros',
      'Madagascar', 'Malawi', 'Mozambique', 'Namibia', 'Botswana', 'Eswatini', 'Lesotho', 'Burundi', 'Rwanda', 'Mauritius',
      'Mauritania',
      
      // Oceania
      'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu', 'New Caledonia', 'Samoa', 'Tonga',
      'Tuvalu', 'Nauru', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Palau',
      
      // Caribbean
      'Haiti', 'Barbados', 'Grenada', 'Saint Vincent and the Grenadines', 'Saint Lucia', 'Saint Kitts and Nevis', 'Dominica',
      'Antigua and Barbuda', 'Bahamas'
    ];

    // Validation
    const updates = {};

    if (nationality && typeof nationality === 'string' && nationality.trim().length > 0) {
      const normalizedNationality = nationality.trim();
      // Check if it's a valid country (case-insensitive)
      const isValidCountry = validCountries.some(country =>
        country.toLowerCase() === normalizedNationality.toLowerCase()
      );
      if (isValidCountry) {
        updates.nationality = normalizedNationality;
      } else {
        return res.status(400).json({ error: `Invalid nationality. Please enter a valid country name. Valid countries include: ${validCountries.slice(0, 10).join(', ')}...` });
      }
    }

    if (age !== undefined) {
      const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
      if (typeof ageNum === 'number' && ageNum > 0 && ageNum < 150) {
        updates.age = ageNum;
      }
    }

    if (gender && typeof gender === 'string' && gender.trim().length > 0) {
      updates.gender = gender.trim();
    }

    if (Array.isArray(allergies)) {
      updates.allergies = allergies.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
    }

    if (typeof isVegan === 'boolean') {
      updates.isVegan = isVegan;
    }

    if (typeof isDiabetic === 'boolean') {
      updates.isDiabetic = isDiabetic;
    }

    if (typeof isDiet === 'boolean') {
      updates.isDiet = isDiet;
    }

    if (typeof isMuslim === 'boolean') {
      updates.isMuslim = isMuslim;
    }

    if (typeof isLactoseFree === 'boolean') {
      updates.isLactoseFree = isLactoseFree;
    }

    if (typeof isHighCalorie === 'boolean') {
      updates.isHighCalorie = isHighCalorie;
    }

    if (typeof prefersSalty === 'boolean') {
      updates.prefersSalty = prefersSalty;
    }

    if (typeof prefersSpicy === 'boolean') {
      updates.prefersSpicy = prefersSpicy;
    }

    if (typeof prefersSweet === 'boolean') {
      updates.prefersSweet = prefersSweet;
    }

    if (typeof prefersSour === 'boolean') {
      updates.prefersSour = prefersSour;
    }

    if (Array.isArray(dislikedIngredients)) {
      updates.dislikedIngredients = dislikedIngredients.filter(item => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
    }

    // Update the user document
    await db.collection('users').doc(req.userId).update(updates);

    res.status(200).json({
      message: 'Personalization survey updated successfully',
      updatedFields: Object.keys(updates)
    });
  } catch (error) {
    console.error('Personalization update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// 4. Get User Personalization Data
router.get('/personalization', verifyAuthToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Return only personalization fields
    const personalizationData = {
      nationality: userData.nationality || '',
      age: userData.age || null,
      gender: userData.gender || '',
      allergies: userData.allergies || [],
      isVegan: userData.isVegan || false,
      isDiabetic: userData.isDiabetic || false,
      isDiet: userData.isDiet || false, // Changed from isOnDiet to match frontend
      isMuslim: userData.isMuslim || false,
      isLactoseFree: userData.isLactoseFree || false,
      isHighCalorie: userData.isHighCalorie || false,
      prefersSalty: userData.prefersSalty || false,
      prefersSpicy: userData.prefersSpicy || false,
      prefersSweet: userData.prefersSweet || false,
      prefersSour: userData.prefersSour || false,
      dislikedIngredients: userData.dislikedIngredients || []
    };

    res.status(200).json({ personalization: personalizationData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy favorites endpoints were removed in favor of the unified collections API.
// Favorites are now handled in backend/functions/src/routes/collections.js via
// /api/collections/favorites and related collection recipe endpoints to keep a
// single source of truth that matches the frontend useFavorites hook.

module.exports = router;