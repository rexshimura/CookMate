const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// 1. Config
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_MODEL_URL = "https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

async function callHuggingFace(prompt) {
  try {
    const response = await axios.post(
      HF_MODEL_URL,
      { 
        inputs: prompt, 
        parameters: { max_new_tokens: 512, temperature: 0.7, return_full_text: false } 
      },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data[0]?.generated_text?.trim() || "";
  } catch (error) {
    console.error("AI Error:", error.message);
    return null;
  }
}

// 2. Chat Route
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // --- KEY FIX: Build History String Correctly ---
    // This turns the array into a script: "User: Hi\nAssistant: Hello\nUser: Rice..."
    const conversationContext = (history || [])
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `<s>[INST] You are CookMate, a helpful AI chef.
    
    YOUR JOB:
    1. If the user lists ingredients (e.g. "I have rice, eggs"), suggest 2-3 short dish ideas. DO NOT give the full recipe yet.
    2. If the user picks a dish (e.g. "Fried rice"), give the full recipe instructions.
    3. Keep it simple and helpful. Do not be overly philosophical.

    HISTORY:
    ${conversationContext}
    
    User: ${message}
    Assistant: [/INST]`;
    
    const aiReply = await callHuggingFace(prompt);
    
    res.status(200).json({ 
      response: { message: aiReply || "I'm thinking... say that again?", timestamp: new Date() } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// We can remove the other complex routes for now to keep it simple
module.exports = router;