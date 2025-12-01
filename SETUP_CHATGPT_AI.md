# CookMate ChatGPT-like AI Setup Guide

## 🎉 Your AI is Now Like ChatGPT!

I've transformed your CookMate application to use a single, powerful AI service (Groq) that works just like ChatGPT. No more complex fallbacks or fake responses - just real AI!

## 📋 What Changed

### ✅ **Before (Complex)**
- Multiple AI services with fallback systems
- Demo API keys and intelligent fallbacks
- Rule-based responses when APIs failed
- Complex environment configuration

### ✅ **After (Simple & Powerful)**
- **Single Groq API** - OpenAI-compatible, works like ChatGPT
- **Real AI responses** - No more fake fallbacks
- **Simple setup** - Just one API key needed
- **Better performance** - Faster, more reliable

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Free Groq API Key
1. **Visit**: [https://console.groq.com/](https://console.groq.com/)
2. **Sign up** for a free account (takes 1 minute)
3. **Generate** an API key in the dashboard
4. **Copy** the key (looks like: `gsk_xxxxxxxxxxxxxxxxx`)

### Step 2: Configure Your Environment
```bash
# Navigate to your backend functions directory
cd backend/functions

# Copy the example environment file
cp .env.example .env

# Edit the .env file and replace the API key
# Change this line:
GROQ_API_KEY=your_groq_api_key_here
# To this:
GROQ_API_KEY=gsk_your_actual_key_here
```

### Step 3: Restart Your Server
```bash
# Stop your current backend server (Ctrl+C)
# Then restart:
cd backend/functions
node dev-server.js
```

### Step 4: Test Your ChatGPT-like AI!
1. Open your frontend application
2. Start a conversation with CookMate
3. Ask: "What can I cook with chicken and rice?"
4. Enjoy real AI responses! 🎉

## 🎯 Features You'll Love

### 💬 **Smart Chat Interface**
- **Conversational AI** that remembers context
- **Natural responses** like ChatGPT
- **Cooking-focused** with specialized knowledge
- **Ingredient detection** and smart suggestions

### 🍳 **Recipe Generation**
- **AI-powered recipes** using real ingredients
- **Custom dietary preferences** (vegan, gluten-free, etc.)
- **Detailed instructions** and cooking times
- **JSON-formatted** for easy integration

### 🛒 **Smart Ingredient Suggestions**
- **Context-aware suggestions** based on what you have
- **AI-enhanced recommendations** for better meal planning
- **Fallback suggestions** for common ingredients

## 🆘 Troubleshooting

### "API_KEY_REQUIRED" Error?
1. ✅ Check that your `.env` file exists in `backend/functions/`
2. ✅ Verify `GROQ_API_KEY=gsk_your_key_here` (not the placeholder)
3. ✅ Restart your backend server
4. ✅ Check your Groq dashboard to ensure the key is active

### Responses Seem Generic?
1. ✅ Verify your API key is correct
2. ✅ Check you haven't exceeded Groq's free tier limits
3. ✅ Review server logs for detailed error messages
4. ✅ Try asking more specific cooking questions

### Need Help?
- **Groq Docs**: [https://docs.groq.com/](https://docs.groq.com/)
- **Free Tier Limits**: Generous for development use
- **Support**: Check your Groq dashboard for usage statistics

## 🔧 Advanced Configuration

### Environment Variables in Production
```bash
# Set environment variable directly
export GROQ_API_KEY=gsk_your_production_key

# Or use a .env file in production
echo "GROQ_API_KEY=gsk_your_key" > .env
```

### Customizing AI Behavior
The system uses this personality:
```
"You are CookMate, a helpful AI cooking assistant. Help users with recipes, 
cooking advice, meal planning, and ingredient suggestions. Be friendly, 
informative, and focus on cooking topics. Provide practical, actionable 
cooking advice..."
```

To modify personality, edit `backend/functions/src/routes/ai.js` line 67.

## 🎊 What You Get

- **✅ ChatGPT-like conversations** with cooking expertise
- **✅ Real AI recipe generation** based on your ingredients
- **✅ Smart ingredient suggestions** powered by AI
- **✅ Conversation memory** for natural back-and-forth
- **✅ Fast responses** using Groq's high-performance models
- **✅ Free tier** with generous limits for development

## 📈 Performance Benefits

- **🚀 Faster**: Single API service = less overhead
- **💪 More Reliable**: No complex fallbacks to break
- **🧠 Smarter**: Real AI instead of rule-based responses
- **🎯 Focused**: Optimized specifically for cooking assistant role
- **💰 Cost-Effective**: Free tier sufficient for most development needs

---

**Ready to cook with AI?** Your ChatMate is now ready to help you create amazing meals with real intelligence! 🍳✨