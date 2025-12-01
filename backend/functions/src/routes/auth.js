const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase'); // Import db

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // 1. Create User in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // 2. Create User Document in Firestore
    // We use .doc(uid).set() to specify the ID exactly matching the Auth UID
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
      favorites: [] // Initialize empty favorites list
    });

    res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ... login and logout routes (Login is usually handled on Frontend)

module.exports = router;