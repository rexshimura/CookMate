const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.userId = 'mock-user-id';
  req.user = { uid: 'mock-user-id', email: 'test@example.com' };
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'CookMate Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// AI Routes (simplified for testing)
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

async function callHuggingFace(prompt) {
  // First try with the original model
  try {
    console.log("🤖 Trying Hugging Face API with Mistral model...");
    const response = await axios.post(
      'https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.2',
      { 
        inputs: prompt, 
        parameters: { 
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        } 
      },
      { 
        headers: { 
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.length > 0) {
      return response.data[0].generated_text.trim();
    }
    return null;
  } catch (error) {
    console.warn("⚠️ Primary HF model failed:", error.response?.status, error.response?.data?.error || error.message);
    
    // Fallback to a different, more reliable model
    try {
      console.log("🤖 Trying fallback model (Zephyr)...");
      const fallbackResponse = await axios.post(
        'https://router.huggingface.co/HuggingFaceH4/zephyr-7b-beta',
        { 
          inputs: prompt, 
          parameters: { 
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false
          } 
        },
        { 
          headers: { 
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );
      
      if (fallbackResponse.data && fallbackResponse.data.length > 0) {
        return fallbackResponse.data[0].generated_text.trim();
      }
    } catch (fallbackError) {
      console.warn("⚠️ Fallback model also failed:", fallbackError.response?.status);
    }
    
    // If both fail, throw a specific error
    throw new Error(`AI service unavailable: ${error.response?.status} ${error.response?.data?.error || error.message}`);
  }
}

// Content detection function
function isOffTopic(message) {
  const lowerMessage = message.toLowerCase();
  
  // Off-topic keywords that should be redirected
  const offTopicKeywords = [
    'politics', 'religion', 'sports', 'gaming', 'technology', 'programming', 
    'coding', 'software', 'apps', 'movies', 'music', 'entertainment', 
    'celebrities', 'relationships', 'dating', 'work', 'job', 'school',
    'math', 'science', 'history', 'news', 'stocks', 'investing',
    'weather', 'news', 'sports', 'football', 'basketball', 'soccer',
    'video games', 'music', 'movies', 'tv shows', 'netflix', 'youtube',
    'cars', 'sports cars', 'travel', 'vacation', 'hotels', 'flights',
    'fitness', 'workout', 'exercise', 'gym', 'dating', 'love', 'dating',
    'shopping', 'fashion', 'clothing', 'makeup', 'hair', 'beauty',
    'cars', 'driving', 'traffic', 'road', 'highway', 'train', 'plane'
  ];
  
  // Check if message contains off-topic keywords
  return offTopicKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Conversational cooking topics detection
function isCookingConversation(message) {
  const lowerMessage = message.toLowerCase();
  
  const cookingTopics = [
    'kitchen', 'cook', 'chef', 'recipe', 'ingredient', 'taste', 'flavor',
    'restaurant', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'snack',
    'seasoning', 'spice', 'herb', 'sauce', 'baking', 'frying', 'grilling',
    'boiling', 'steaming', 'roasting', 'stir fry', 'marinate', 'grill',
    'oven', 'stove', 'pan', 'pot', 'knife', 'cutting', 'chopping',
    'fresh', 'organic', 'local', 'farm', 'market', 'grocery', 'store',
    'healthy', 'diet', 'vegetarian', 'vegan', 'gluten free', 'low carb',
    'comfort food', 'home cooking', 'family recipe', 'tradition',
    'cooking tips', 'cooking time', 'prep', 'preparation'
  ];
  
  return cookingTopics.some(topic => lowerMessage.includes(topic));
}

// Mock chat responses for development fallback
function generateMockChatResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Extended greeting variations (15 responses)
  const greetings = [
    "Hello! I'm CookMate, your AI cooking assistant. What delicious ingredients do you have today?",
    "Hi there! Ready to cook up something amazing? What ingredients are you working with?",
    "Hey! I'm here to help you create some culinary magic. What do you have in your pantry?",
    "Welcome to CookMate! I'm excited to help you discover new recipes. What ingredients do you have available?",
    "Good to see you! Let's create something delicious together. What's in your kitchen?",
    "Greetings, fellow food lover! I'm CookMate, your personal kitchen companion. What culinary adventure shall we embark on today?",
    "Hey there, chef-in-training! Ready to transform simple ingredients into spectacular dishes? What treasures do you have in your kitchen?",
    "Welcome to the world of delicious possibilities! I'm CookMate, your AI cooking buddy. What ingredients are you excited to work with?",
    "Hi, food enthusiast! I'm here to make your cooking journey more exciting. What ingredients have caught your attention today?",
    "Hey! Ready to whip up something wonderful? I'm CookMate, your recipe-generating AI friend. What do you have on hand?",
    "Hello, kitchen explorer! I'm CookMate, and I'm absolutely thrilled to help you create something amazing. What's in your culinary arsenal?",
    "Good day! I'm CookMate, your personal chef assistant. Ready to turn ordinary ingredients into extraordinary meals? What do you have?",
    "Hi there, future master chef! I'm CookMate, and I live for the magic of cooking. What delicious ingredients shall we work with today?",
    "Hey! Welcome to your kitchen playground. I'm CookMate, your AI cooking companion. What culinary creation are you dreaming of?",
    "Greetings, fellow food lover! I'm CookMate, here to help you discover the joy of cooking. What ingredients are you most excited about?"
  ];
  
  // Extended purpose and introduction responses (20 responses)
  const purposeResponses = [
    "I'm CookMate, your personal AI kitchen assistant! My purpose is to help you discover amazing recipes based on whatever ingredients you have. Whether you're a beginner cook or a seasoned chef, I'm here to make cooking fun and accessible.",
    "Think of me as your cooking companion! I specialize in turning your available ingredients into delicious, practical recipes. I can suggest dishes based on what you have, accommodate dietary preferences, and even help you get creative with simple ingredients.",
    "I'm an AI cooking assistant designed to make meal planning easier! I can create recipes using ingredients you already have, suggest cooking techniques, and help you make the most of your kitchen. What would you like to cook today?",
    "I'm here to be your sous chef! My job is to help you create delicious meals from whatever ingredients are available. I love turning everyday staples into exciting dishes. What sounds good to you?",
    "I'm CookMate, your digital culinary guide! My mission is to eliminate the 'what should I cook?' dilemma by transforming your available ingredients into mouth-watering recipe suggestions. I'm here to make every meal an adventure!",
    "Consider me your kitchen confidant! I'm passionate about helping you discover new flavors, master cooking techniques, and create memorable dining experiences. I believe everyone deserves access to delicious, home-cooked meals.",
    "I'm your personal recipe curator! I sift through the endless possibilities of ingredients and flavors to hand-pick the perfect recipes for your specific situation. No matter what you have, I'll help you make something extraordinary.",
    "I'm an AI designed specifically for food enthusiasts! Whether you're meal prepping for the week, planning a dinner party, or just looking for a quick weeknight meal, I'm here to guide you toward culinary success.",
    "I'm CookMate, your ingredient whisperer! I understand how different foods work together and can suggest combinations that might surprise you. I love helping people discover new favorites from their existing pantry.",
    "I'm your cooking mentor and recipe detective! I help bridge the gap between what you have and what you crave. Together, we'll create dishes that satisfy your taste buds and impress your dinner guests.",
    "Think of me as your personal chef de partie! I specialize in making cooking accessible, enjoyable, and delicious. From simple weeknight dinners to complex culinary projects, I'm here to guide you every step of the way.",
    "I'm CookMate, your flavor architect! I build recipes like architectural blueprints, carefully considering how each ingredient contributes to the final masterpiece. Let's design something delicious together!",
    "I'm your culinary adventure partner! I love helping people step outside their comfort zones and try new cuisines, techniques, or flavor combinations. What culinary territory shall we explore today?",
    "I'm an AI cooking coach dedicated to empowering home cooks! I provide not just recipes, but also the confidence and knowledge to make them truly yours. Every dish you create should reflect your unique taste and style.",
    "I'm CookMate, your kitchen problem solver! Whether you're facing ingredient shortages, dietary restrictions, or just cooking fatigue, I'm here to offer creative solutions that keep mealtime exciting and stress-free.",
    "I'm your recipe matchmaker! I carefully pair ingredients with cooking methods to create perfectly balanced, flavorful dishes. Think of me as your personal culinary matchmaker, bringing together the perfect combinations.",
    "I'm an AI food stylist and recipe creator! I believe food should be both delicious and beautiful. I'll help you create dishes that taste amazing and look restaurant-quality, making everyday meals feel special.",
    "I'm CookMate, your cooking confidence builder! I provide step-by-step guidance, ingredient substitutions, and cooking tips to ensure your success in the kitchen. No more guessing – just delicious results!",
    "I'm your personal recipe remix artist! I take classic dishes and give them fresh twists using whatever ingredients you have. Let's reinvent traditional favorites and discover exciting new flavor profiles together.",
    "I'm CookMate, your kitchen time-saver! I focus on efficient recipes that don't compromise on flavor. Whether you need quick weeknight meals or meal prep options, I'll help you maximize your time and taste satisfaction."
  ];
  
  // Extended free service responses (15 responses)
  const freeResponses = [
    "I'm completely free to use! I don't charge anything for recipe suggestions or cooking advice. My goal is to help everyone discover the joy of cooking, regardless of their budget. Just tell me what ingredients you have, and I'll get started!",
    "Absolutely! I'm a free AI assistant, so you can use me as much as you want without any limits. I believe great cooking should be accessible to everyone. What ingredients are you thinking of using?",
    "Yes, I'm completely free! No subscriptions, no premium features, just helpful cooking advice whenever you need it. I'm here to make cooking enjoyable and accessible. What delicious dish can we create together?",
    "I'm 100% free to use! I don't have any hidden costs or premium tiers. My purpose is to help people cook better with what they have. What ingredients do you have on hand?",
    "Completely free, no strings attached! I believe everyone deserves access to great cooking guidance. Whether you're looking for quick weeknight meals or elaborate weekend projects, I'm here to help without any cost. What culinary adventure shall we plan?",
    "I'm a completely free resource for all your cooking needs! No hidden fees, no premium accounts, just pure cooking assistance. I'm passionate about making cooking accessible and enjoyable for everyone. What recipe discovery awaits us today?",
    "Absolutely free and always available! I don't have any payment plans or subscription tiers. My mission is to democratize cooking knowledge and help people create amazing meals. What shall we cook up?",
    "Free as can be! I'm here to be your personal cooking consultant without any cost or commitment. I love helping people explore new flavors and techniques. What cooking challenge can we tackle together?",
    "I'm completely free to use, and I always will be! I believe great cooking shouldn't come with a price tag. Whether you're a beginner or an expert, I'm here to support your culinary journey. What shall we cook up?",
    "Free forever, with no limitations! I don't have any payment plans or subscription requirements. I'm designed to be your reliable cooking companion whenever you need inspiration or guidance. What recipe shall we explore?",
    "I'm absolutely free with no hidden costs or premium features! My purpose is to inspire people to cook more and cook better. I think the world needs more home cooks creating delicious meals. What ingredients are calling your name?",
    "Completely free and always here for you! I don't have any paywalls or subscription requirements. I'm designed to be your reliable cooking companion whenever you need inspiration or guidance. What recipe shall we explore?",
    "I'm free and always will be! No charges, no fees, just pure cooking assistance. I exist to make cooking more enjoyable and accessible for everyone. What delicious adventure shall we plan?",
    "Totally free with no premium tiers or special features! I believe cooking knowledge should be shared freely. My goal is to help you become more confident and creative in the kitchen. What ingredients do you have that need some cooking magic?",
    "Free to use as much as you want! I don't have any usage limits or payment requirements. I think everyone deserves access to great cooking advice, whether they're cooking for one or a crowd. What delicious adventure shall we plan?"
  ];
  
  // Recipe-related responses
  const recipeResponses = [
    "I'd love to help you create a recipe! Just tell me what ingredients you have, and I'll suggest a tasty dish. What do you have in your kitchen?",
    "Sounds like you're ready for some recipe magic! Share what ingredients you're working with, and I'll craft something delicious for you.",
    "Perfect! I live for creating recipes. Let me know what ingredients you have available, and I'll suggest some mouth-watering options.",
    "Great timing! I'm excited to help you discover a new recipe. What ingredients do you have that we can turn into something amazing?"
  ];
  
  // Extended conversation continuation responses (30 responses)
  const conversationResponses = [
    "That's interesting! As your cooking assistant, I'm here to help you create amazing dishes. Tell me what ingredients you have, and I'll suggest some delicious recipes. What's in your kitchen?",
    "I love chatting about cooking! While I'm happy to talk, I excel at creating personalized recipes. What ingredients are you working with today?",
    "I'm all about making cooking fun and accessible! What delicious ingredients do you have that we could turn into something special?",
    "Cooking is such a wonderful topic! I can chat about techniques, ingredients, or we can dive right into creating a recipe. What sounds good to you?",
    "I'm here to make cooking enjoyable! Whether you want recipe suggestions, cooking tips, or just want to talk food, I'm your AI kitchen assistant. What ingredients do you have?",
    "I enjoy our conversation! But I have to say, I'm at my best when I'm creating recipes. What ingredients do you have available that we could turn into something delicious?",
    "That's a great point! I'm passionate about helping people explore the wonderful world of cooking. What ingredients do you have that could become something amazing?",
    "I love engaging in food conversations! There's always something new to discover about flavors and techniques. What culinary topic interests you most?",
    "Food is such a universal language! I believe every conversation about cooking leads to delicious possibilities. What ingredients are calling your name today?",
    "That's fascinating! I love hearing different perspectives on cooking and food. What's your favorite thing about being in the kitchen?",
    "I appreciate our chat about food! I'm here to help you turn your cooking curiosity into concrete recipes. What ingredients do you have ready for action?",
    "Cooking conversations are the best kind! They always lead to exciting culinary possibilities. What recipe adventure are you in the mood for?",
    "That's a wonderful observation! I love how food connects us all in such meaningful ways. What cooking inspiration are you feeling today?",
    "I find food discussions endlessly inspiring! They remind me why I love helping people create amazing meals. What delicious discovery shall we make?",
    "That's really insightful! Every cooking conversation has the potential to lead to something delicious. What ingredients do you have that we could transform?",
    "I love exploring food topics with fellow cooking enthusiasts! There's always something new to learn. What culinary direction interests you most?",
    "That's a great perspective! Food has this amazing ability to bring people together. What cooking goal are you working toward today?",
    "I'm always excited to discuss all things culinary! Every conversation could spark the next great recipe idea. What's on your cooking mind?",
    "That's an interesting thought! Food philosophy and practical cooking go hand in hand. What cooking principle do you find most important?",
    "I enjoy our food-focused chat! It reinforces why I'm so passionate about helping people cook better. What recipe challenge can I help you tackle?",
    "That's a wonderful way to think about cooking! I'm here to help turn your food thoughts into actual dishes. What ingredients are ready for transformation?",
    "I love connecting with people who share a passion for cooking! Every conversation deepens that love. What cooking exploration excites you most?",
    "That's beautifully put! Food really is one of life's greatest pleasures and simplest joys. What culinary experience are you hoping to create?",
    "I find our cooking conversation so engaging! It reminds me of why recipe creation is such a rewarding adventure. What delicious path shall we explore?",
    "That's a thoughtful way to view cooking! I'm here to help you bring those cooking thoughts to life. What ingredients do you have for our culinary experiment?",
    "I appreciate your interest in cooking topics! These discussions always lead to exciting recipe possibilities. What flavor adventure are you craving?",
    "That's a great insight! Every cooking conversation opens up new culinary possibilities. What ingredients do you have that could become a masterpiece?",
    "I love talking food with people who appreciate the art of cooking! What cooking technique or ingredient are you most curious about?",
    "That's an excellent point! Food conversations have a special way of sparking creativity. What recipe idea or cooking challenge is calling to you?",
    "I enjoy our culinary discussion! It reinforces my belief that everyone can create amazing food. What cooking inspiration shall we channel into a recipe?"
  ];
  
  // Specific ingredient responses
  const chickenResponses = [
    "Great choice! Chicken is so versatile. You can make anything from crispy chicken parmesan to healthy chicken salad. What other ingredients do you have to go with it?",
    "Chicken is a fantastic protein! From quick weeknight dinners to weekend special meals. What kind of dish are you in the mood for?",
    "Classic chicken! There are endless possibilities - grilled, baked, stir-fried, or in a cozy soup. What other ingredients do you have available?",
    "Chicken is always a winner! Whether you want something comfort food-style or light and healthy. What ingredients would you like to pair it with?"
  ];
  
  const pastaResponses = [
    "Pasta is a fantastic base for many meals! From simple aglio e olio to rich carbonara, the possibilities are endless. What kind of sauce are you in the mood for?",
    "Pasta is such a comfort food! You can go classic with marinara, creamy with alfredo, or hearty with meat sauces. What sounds appetizing to you?",
    "Love pasta! It's incredibly versatile and quick to prepare. What other ingredients do you have for the sauce or toppings?",
    "Perfect choice! Pasta dishes can be as simple or complex as you want. What style are you thinking - Italian classic, Asian-inspired, or something creative?"
  ];
  
  const riceResponses = [
    "Rice is a wonderful foundation for so many dishes! Whether you want fried rice, pilaf, or something more exotic, I'm here to help. What proteins or vegetables do you have?",
    "Rice is such a staple! You can make it into anything from a quick stir-fry base to a fancy pilaf. What other ingredients would you like to add?",
    "Rice is incredibly versatile! Perfect for everything from comfort food fried rice to elegant risotto-style dishes. What sounds good to you?",
    "Great choice! Rice is the base for so many delicious meals. What ingredients do you have that would go well with rice?"
  ];
  
  // Helper function to get random response
  function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Main response logic
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return getRandomResponse(greetings);
  }
  
  if (lowerMessage.includes('purpose') || lowerMessage.includes('what are you') || lowerMessage.includes('who are you')) {
    return getRandomResponse(purposeResponses);
  }
  
  if (lowerMessage.includes('free') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('pay')) {
    return getRandomResponse(freeResponses);
  }
  
  if (lowerMessage.includes('recipe')) {
    return getRandomResponse(recipeResponses);
  }
  
  if (lowerMessage.includes('chicken')) {
    return getRandomResponse(chickenResponses);
  }
  
  if (lowerMessage.includes('pasta')) {
    return getRandomResponse(pastaResponses);
  }
  
  if (lowerMessage.includes('rice')) {
    return getRandomResponse(riceResponses);
  }
  
  // Extended off-topic redirect responses (25 responses)
  const offTopicResponses = [
    "I appreciate your curiosity, but I'm specifically designed to help with cooking and recipes! Let's focus on what delicious dish we can create together. What ingredients do you have in your kitchen?",
    "That's an interesting topic, but my specialty is cooking! I love talking about recipes, ingredients, and kitchen adventures. What culinary creation can we work on today?",
    "I'd love to chat about that, but I'm programmed to be your cooking companion! I excel at recipe suggestions, ingredient combinations, and cooking tips. What would you like to cook?",
    "Great question! But I'm here to be your personal chef assistant. I can help with meal planning, recipe creation, or cooking techniques. What's cooking in your kitchen?",
    "While I'd love to discuss that topic, I specialize in cooking and culinary adventures! Let me help you create something amazing in the kitchen. What ingredients do you have available?",
    "I wish I could help with that, but I'm designed specifically for cooking and recipe assistance! I'm passionate about food, ingredients, and making delicious meals. What would you like to cook up?",
    "That's a fascinating topic, but my brain is tuned exclusively for culinary adventures! I love helping people discover new recipes and cooking techniques. What ingredients are calling your name today?",
    "I find that really interesting, but my expertise lies in the wonderful world of cooking! I'm here to be your kitchen consultant and recipe advisor. What's the next delicious dish you'd like to explore?",
    "That's a great question, but I'm really focused on helping people create amazing meals! I live for the magic that happens when ingredients transform into delicious dishes. What are you thinking of cooking?",
    "I appreciate the thought-provoking question, but I'm designed as your culinary companion! My passion is helping people make the most of their ingredients. What recipe adventure shall we go on together?",
    "That would be interesting to discuss, but I'm here to be your personal cooking coach! I specialize in meal planning, recipe creation, and kitchen inspiration. What culinary challenge can I help you solve?",
    "While I'd love to dive into that topic, my programming is all about cooking and food! I love sharing recipe ideas, cooking tips, and flavor combinations. What ingredients do you have that we could turn into something spectacular?",
    "That's a really good question, but I'm specifically built to be your kitchen assistant! I excel at transforming whatever ingredients you have into mouth-watering recipes. What culinary creation are you imagining?",
    "I find that quite intriguing, but I'm passionate about everything food-related! I'm here to help you become more confident and creative in the kitchen. What delicious discovery shall we make together?",
    "That's an interesting perspective, but my specialty is definitely the culinary arts! I love helping people explore new flavors and cooking techniques. What's cooking on your mind today?",
    "I'd enjoy exploring that topic, but I'm really tuned into cooking and recipe sharing! I believe the best conversations happen over great food. What ingredients are you most excited to work with?",
    "That's a fascinating angle, but I'm laser-focused on helping people create amazing dishes! I love being part of people's cooking journeys. What recipe would you like to discover?",
    "I appreciate the thoughtful question, but I'm really here to be your personal chef advisor! My purpose is to make cooking more enjoyable and accessible. What culinary masterpiece can we craft together?",
    "That's quite thought-provoking, but my passion lies in the world of flavors and cooking! I live for helping people discover new ingredients and cooking methods. What food adventure calls to you?",
    "That's really interesting, but I'm designed specifically for culinary conversations! I love helping people transform simple ingredients into extraordinary meals. What recipe challenge can I help you tackle?",
    "I'd be curious about that too, but my expertise is in cooking and recipe development! I believe food has the power to bring joy and satisfaction. What delicious experiment shall we try in your kitchen?",
    "That's a great topic, but I'm really here to be your cooking companion! I specialize in meal planning and recipe inspiration. What ingredients are you most excited to combine into something amazing?",
    "I find that quite engaging, but my focus is on all things culinary! I love sharing cooking tips, recipe ideas, and helping people become better cooks. What cooking goal shall we work toward today?",
    "That's an intriguing subject, but I'm passionately dedicated to the art of cooking! I live for the moment when someone discovers a new favorite recipe. What culinary discovery are you hoping to make?",
    "That would be wonderful to discuss, but I'm specifically programmed to help with cooking and recipes! I believe every meal can be an adventure. What ingredients are calling to you from your kitchen?"
  ];
  
  // Extended detailed cooking responses (30 responses)
  const detailedCookingResponses = [
    "I absolutely love cooking conversations! There's always something new to discover in the kitchen. Tell me, are you more of a spontaneous cook or do you follow recipes? I find the best dishes often come from a mix of both!",
    "You know, cooking is like an art form! Every ingredient tells a story, and combining them creatively is what makes magic happen. What's been your most memorable cooking experience lately?",
    "Cooking is such a personal journey! Some people love quick weeknight meals, others enjoy the process of elaborate weekend cooking. What style of cooking resonates most with you?",
    "I find cooking so fascinating - it's both science and creativity combined! The way different flavors interact and complement each other never ceases to amaze me. What flavors do you typically gravitate toward?",
    "There's something so satisfying about creating something delicious from raw ingredients! It's like a form of alchemy in your kitchen. What's your go-to comfort food when you want to feel cozy?",
    "Cooking has this wonderful way of bringing people together! Whether it's a family recipe passed down through generations or discovering new flavor combinations. What's the most meaningful meal you've ever cooked?",
    "Cooking is such a beautiful expression of love and care! I believe every meal is an opportunity to nourish not just the body, but also the soul. What's a dish that brings you the most joy to prepare?",
    "I love how cooking can transport you to different cultures and memories! Each recipe is like a passport to somewhere new. What's the most exotic or unique cuisine you've ever attempted?",
    "There's something incredibly meditative about cooking! The rhythm of chopping, the sizzle of the pan, the aromas developing - it's pure mindfulness. Do you find cooking relaxing or energizing?",
    "Cooking is such a powerful way to express creativity and personality! Every chef adds their own signature touch to dishes. What's your signature cooking style or your go-to 'secret ingredient'?",
    "I find cooking to be one of life's greatest pleasures and simplest luxuries! There's nothing quite like the satisfaction of a well-executed meal. What's your most prized cooking achievement to date?",
    "Cooking connects us to our ancestors and traditions in such a beautiful way! Food preserves culture and heritage across generations. Do you have any family recipes that hold special meaning for you?",
    "The kitchen is truly where chemistry meets art! The transformation of raw ingredients into something delicious is nothing short of magical. What's the most surprising flavor combination you've discovered?",
    "Cooking is so much more than just following instructions - it's about understanding ingredients, timing, and intuition! What's a cooking technique that you've mastered and feel confident about?",
    "There's something deeply therapeutic about the entire cooking process! From shopping for ingredients to the final plating. What part of cooking do you find most enjoyable or satisfying?",
    "I love how cooking can be both incredibly simple and surprisingly complex! A perfect egg can be as satisfying as a complex soufflé. What simple dish do you make better than anyone else you know?",
    "Cooking is such a universal language of love and hospitality! It doesn't matter where you come from - good food brings people together. What's your favorite way to show care through cooking?",
    "The best cooks are perpetual students! There's always something new to learn about ingredients, techniques, and flavor profiles. What's the most valuable cooking lesson you've learned recently?",
    "Cooking is where science meets comfort! Understanding why certain ingredients work together helps create consistently delicious results. What cooking 'aha moment' changed your approach to food?",
    "There's something incredibly rewarding about cooking for others! The joy on someone's face when they taste something you've created is priceless. Who do you most love to cook for and why?",
    "Cooking is such a wonderful way to experiment and play! The kitchen is your laboratory where you can test theories and create new combinations. What wild cooking experiment turned out surprisingly well?",
    "I believe cooking is one of the most fundamental acts of self-care and self-expression! Taking time to nourish yourself properly is an act of love. What cooking habit makes you feel most fulfilled?",
    "The art of seasoning is what separates good cooks from great ones! Understanding salt, acid, fat, and heat transforms everything. What's your philosophy about seasoning and flavor balance?",
    "Cooking is where creativity meets tradition! You can honor classic techniques while adding your own modern twist. What's your favorite way to put a personal spin on traditional recipes?",
    "There's something so grounding about cooking with your hands! The tactile experience of kneading dough, chopping vegetables, or mixing batter is incredibly satisfying. What's your favorite hands-on cooking technique?",
    "Cooking is such a powerful tool for wellness! Preparing your own food gives you control over ingredients and nutrition. What's your approach to balancing flavor with health considerations?",
    "The aroma of cooking is one of life's greatest pleasures! From the first whiff of sautéing garlic to the final golden crust. What cooking aroma makes you feel most at home?",
    "I love how cooking can be both practical and aspirational! You can make a simple pasta night special or create an elaborate feast. What's your philosophy about everyday cooking versus special occasions?",
    "Cooking is truly an adventure that happens right in your own kitchen! Every meal is a new opportunity for discovery and delight. What culinary adventure are you most excited to embark on next?"
  ];
  
  // Extended light cooking conversations (25 responses)
  const lightCookingConversations = [
    "I love talking food! What's your current kitchen obsession? Are you discovering new cuisines lately, or perfecting classic dishes?",
    "Cooking conversations are my favorite! Are you a morning person who loves elaborate breakfasts, or more of a simple grab-and-go person?",
    "Food talk always gets me excited! Are you someone who plans meals for the week, or do you prefer cooking based on what looks good that day?",
    "I enjoy chatting about all things culinary! Are you currently crushing any particular cooking technique, or maybe working on a signature dish?",
    "You know what I love? When people get passionate about their food preferences! Are you more of a traditionalist who loves classic combinations, or do you enjoy experimental fusion cooking?",
    "Cooking is such a personal expression! What's been your biggest cooking win lately? Maybe discovering a new favorite ingredient or mastering a challenging technique?",
    "I'm always curious about people's cooking habits! Do you consider yourself a spontaneous cook who follows their taste buds, or more of a meal-planning maestro?",
    "Food moods are so interesting! Are you someone who craves familiar comfort foods, or are you constantly seeking new and exciting flavors to try?",
    "Kitchen personalities are fascinating! Are you the type who follows recipes religiously, or do you love to improvise and make it your own?",
    "I love hearing about people's food journeys! What's the most memorable dish you've ever made, whether it was a success or a delicious disaster?",
    "Cooking styles are so personal! Are you someone who enjoys the process as much as the result, or are you all about getting that perfect final dish?",
    "Flavor preferences are like fingerprints - completely unique! What's one ingredient you can't live without in your kitchen?",
    "I'm always amazed by how people approach cooking! Do you like to cook solo and get into your own zone, or do you prefer cooking with others for company and collaboration?",
    "Cooking confidence is such a journey! What's one cooking skill you're most proud of having mastered?",
    "Food memories are the best kind! Is there a particular dish that instantly transports you back to a special time or place?",
    "Kitchen organization can be so telling! Are you someone who has everything meticulously planned and organized, or do you embrace a more chaotic creative process?",
    "I love learning about people's food preferences! Are you someone who sticks to a few reliable favorites, or are you constantly trying new ingredients and combinations?",
    "Cooking challenges can be so rewarding! What's the most ambitious dish you've ever attempted, and how did it turn out?",
    "Seasonal cooking is so wonderful! Do you love adapting your cooking to whatever's fresh and available, or do you have year-round staples?",
    "Food presentation can be so much fun! Do you pay a lot of attention to how your dishes look, or are you all about the taste experience?",
    "I'm curious about cooking habits! Are you someone who enjoys cooking as a way to unwind after a long day, or do you see it more as a necessary task?",
    "Cooking techniques can be so varied! What's your favorite cooking method - the steady rhythm of stovetop cooking, or the hands-off magic of the oven?",
    "Kitchen gadgets can be love or hate relationships! Is there any kitchen tool you absolutely can't live without, or one you wish you'd never bought?",
    "Food storage and leftovers can be an art form! Are you someone who hates food waste and loves turning leftovers into new meals, or do you prefer cooking fresh each time?",
    "Cooking inspiration can come from anywhere! Do you get your best recipe ideas from cookbooks, food blogs, restaurants you've visited, or just from what you happen to have on hand?"
  ];
  
  // Check for off-topic content first
  if (isOffTopic(message)) {
    return getRandomResponse(offTopicResponses);
  }
  
  // Check for more detailed cooking conversations
  if (isCookingConversation(message) || 
      lowerMessage.includes('tell me about') || 
      lowerMessage.includes('what do you think') ||
      lowerMessage.includes('your opinion') ||
      lowerMessage.includes('experience') ||
      lowerMessage.includes('story') ||
      lowerMessage.includes('favorite') ||
      lowerMessage.includes('opinion')) {
    return getRandomResponse(detailedCookingResponses);
  }
  
  // Light cooking conversations
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('tell me')) {
    return getRandomResponse(lightCookingConversations);
  }
  
  // Default response with some variation
  return getRandomResponse(conversationResponses);
}

// Chat endpoint
app.post('/api/ai/chat', mockAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    let aiReply;
    
    try {
      const prompt = `<s>[INST] You are CookMate, a helpful and friendly AI kitchen assistant. 
      User: ${message}
      Assistant: [/INST]`;
      
      aiReply = await callHuggingFace(prompt);
      console.log("✅ AI chat response generated");
    } catch (aiError) {
      console.log("🤖 Using mock chat response due to AI service issue");
      aiReply = generateMockChatResponse(message);
    }
    
    const response = {
      message: aiReply,
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({ response });
  } catch (error) {
    console.error("❌ Chat failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mock AI recipe generator for development fallback
function generateMockRecipe(ingredients, dietaryPreferences) {
  const ingredient = ingredients[0] || 'ingredient';
  const mockRecipes = {
    chicken: {
      title: "Classic Chicken Dish",
      ingredients: ["2 lbs chicken breast", "1 cup chicken broth", "2 cloves garlic", "1 onion", "Salt and pepper to taste"],
      instructions: [
        "Season chicken with salt and pepper",
        "Heat oil in a large pan over medium-high heat", 
        "Brown chicken on both sides",
        "Add garlic and onion, cook until fragrant",
        "Pour in chicken broth, reduce heat and simmer for 25 minutes",
        "Serve hot over rice or vegetables"
      ],
      cookingTime: "35 minutes",
      servings: "4",
      difficulty: "Easy"
    },
    rice: {
      title: "Perfect Rice Pilaf", 
      ingredients: ["1 cup white rice", "2 cups chicken broth", "1/2 onion", "2 tbsp butter", "Salt to taste"],
      instructions: [
        "Rinse rice until water runs clear",
        "Melt butter in saucepan over medium heat",
        "Add diced onion, cook until translucent",
        "Add rice, toast for 2 minutes",
        "Add broth and salt, bring to boil",
        "Reduce heat, cover and simmer for 18 minutes",
        "Let rest 5 minutes, then fluff with fork"
      ],
      cookingTime: "25 minutes",
      servings: "4", 
      difficulty: "Easy"
    },
    pasta: {
      title: "Simple Pasta with Sauce",
      ingredients: ["8 oz pasta", "2 cups marinara sauce", "2 cloves garlic", "2 tbsp olive oil", "Fresh basil", "Parmesan cheese"],
      instructions: [
        "Bring large pot of salted water to boil",
        "Cook pasta according to package directions",
        "Heat olive oil in large pan over medium heat",
        "Add minced garlic, cook 30 seconds",
        "Add marinara sauce, simmer 5 minutes",
        "Drain pasta, add to sauce",
        "Toss with fresh basil and parmesan"
      ],
      cookingTime: "20 minutes",
      servings: "2",
      difficulty: "Easy"
    }
  };
  
  // Find best match or create generic recipe
  let selectedRecipe = mockRecipes.chicken; // default
  for (const [key, recipe] of Object.entries(mockRecipes)) {
    if (ingredient.toLowerCase().includes(key)) {
      selectedRecipe = recipe;
      break;
    }
  }
  
  // Customize ingredients to include user's input
  selectedRecipe.ingredients = [...selectedRecipe.ingredients];
  if (!selectedRecipe.ingredients.some(ing => ing.toLowerCase().includes(ingredient.toLowerCase()))) {
    selectedRecipe.ingredients.unshift(`2 cups ${ingredient}`);
  }
  
  return selectedRecipe;
}

// Generate Recipe endpoint with smart ingredient extraction
app.post('/api/ai/generate-recipe', mockAuth, async (req, res) => {
  try {
    const { userMessage, ingredients: providedIngredients, dietaryPreferences, recipeType } = req.body;
    
    console.log("🔍 Recipe request:", { userMessage, providedIngredients, dietaryPreferences });
    
    // Handle both old format (ingredients array) and new format (userMessage)
    let ingredients = providedIngredients;
    
    if (userMessage && (!ingredients || ingredients.length === 0)) {
      console.log("🔍 Extracting ingredients from user message:", userMessage);
      
      // Smart ingredient extraction from user message
      const ingredientPatterns = [
        // Common cooking ingredients
        /\b(chicken|beef|pork|lamb|turkey|fish|salmon|shrimp|tuna|tofu|eggs?)\b/gi,
        /\b(rice|pasta|noodles|spaghetti|macaroni|bread|flour|oats|quinoa)\b/gi,
        /\b(potato|tomato|onion|garlic|pepper|bell pepper|carrot|celery|lettuce|spinach|kale|cucumber)\b/gi,
        /\b(mushroom|zucchini|eggplant|broccoli|cauliflower|green beans|peas|corn)\b/gi,
        /\b(cheese|mozzarella|parmesan|cheddar|milk|cream|butter|yogurt|sour cream)\b/gi,
        /\b(oil|olive oil|vegetable oil|canola oil|sesame oil)\b/gi,
        /\b(salt|pepper|garlic powder|onion powder|paprika|cumin|oregano|thyme|basil)\b/gi,
        /\b(sugar|honey|maple syrup|brown sugar)\b/gi,
        /\b(lemon|lime|orange|apple|banana|berries|grapes)\b/gi,
        /\b(vanilla|almond|coconut|chocolate|cocoa)\b/gi
      ];
      
      const foundIngredients = new Set();
      ingredientPatterns.forEach(pattern => {
        const matches = userMessage.match(pattern);
        if (matches) {
          matches.forEach(match => foundIngredients.add(match.toLowerCase()));
        }
      });
      
      console.log("🔍 Found ingredients:", Array.from(foundIngredients));
      
      // Also look for ingredient lists with numbers (like "1 cup flour, 2 eggs")
      const listPattern = /\b\d+\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pound|lbs?|oz|ounce|ounces)\s+([a-zA-Z\s]+)/gi;
      const listMatches = userMessage.match(listPattern);
      if (listMatches) {
        listMatches.forEach(match => {
          const cleanMatch = match.replace(/^\d+\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pound|lbs?|oz|ounce|ounces)\s+/i, '').trim();
          if (cleanMatch.length > 2) foundIngredients.add(cleanMatch.toLowerCase());
        });
      }
      
      ingredients = Array.from(foundIngredients);
      console.log("🔍 Final ingredients array:", ingredients);
    }
    
    // If no specific ingredients found, create a general recipe
    if (!ingredients || ingredients.length === 0) {
      console.log("🔍 No ingredients found, creating general recipe");
      
      const generalIngredients = ['chicken', 'rice', 'onion', 'garlic', 'tomato'];
      const recipeData = generateMockRecipe(generalIngredients, dietaryPreferences);
      
      return res.status(200).json({ 
        message: 'Recipe generated successfully (general suggestion)',
        recipe: recipeData,
        detectedIngredients: generalIngredients,
        note: "I created a general recipe since you didn't specify ingredients. Tell me what you have, and I'll make something specific for you!"
      });
    }

    let recipeData;
    
    try {
      const prompt = `<s>[INST] You are CookMate, a world-class chef. Create a delicious recipe using these ingredients: ${ingredients.join(', ')}.
      ${dietaryPreferences ? `Dietary preferences: ${dietaryPreferences}.` : ''}
      ${recipeType ? `Recipe type: ${recipeType}.` : ''}
      
      Create a complete, appetizing recipe that makes good use of these ingredients.
      
      IMPORTANT: Provide the response in valid JSON format with the following structure:
      {
        "title": "Recipe Name",
        "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
        "instructions": ["Step 1 description", "Step 2 description"],
        "cookingTime": "e.g. 30 minutes",
        "servings": "e.g. 4",
        "difficulty": "Easy/Medium/Hard"
      }
      Do not add any text outside the JSON object.
      [/INST]`;

      const generatedText = await callHuggingFace(prompt);

      if (!generatedText) {
        throw new Error("No response from AI");
      }

      // Parse the response
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = generatedText.substring(jsonStart, jsonEnd + 1);
        recipeData = JSON.parse(jsonString);
      } else {
        throw new Error("Invalid JSON format");
      }
      
      console.log("✅ AI Recipe generated successfully");
      
    } catch (aiError) {
      console.log("🤖 Using mock recipe fallback due to AI service issue");
      recipeData = generateMockRecipe(ingredients, dietaryPreferences);
    }
    
    res.status(200).json({ 
      message: 'Recipe generated successfully',
      recipe: recipeData,
      detectedIngredients: ingredients
    });

  } catch (error) {
    console.error("❌ Recipe generation failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Suggest Ingredients endpoint
app.post('/api/ai/suggest-ingredients', mockAuth, async (req, res) => {
  try {
    const { availableIngredients } = req.body;
    
    const prompt = `<s>[INST] I have these ingredients: ${availableIngredients.join(', ')}. 
    Suggest 3 additional ingredients that would go well with them to make a complete meal.
    Output ONLY a comma-separated list of ingredients. Example: "Garlic, Olive Oil, Basil"
    [/INST]`;
    
    const suggestionText = await callHuggingFace(prompt);
    
    const suggestions = suggestionText ? suggestionText.split(',').map(s => s.trim()) : ['Garlic', 'Olive Oil', 'Salt'];
    
    res.status(200).json({ 
      suggestions,
      message: 'Ingredient suggestions generated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock user endpoints
app.get('/api/users/profile', mockAuth, (req, res) => {
  res.status(200).json({ 
    user: {
      uid: req.userId,
      email: 'test@example.com',
      displayName: 'Test User',
      plan: 'free',
      favorites: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CookMate Backend API running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/ai/chat - AI chat`);
  console.log(`   POST /api/ai/generate-recipe - Generate recipe`);
  console.log(`   POST /api/ai/suggest-ingredients - Suggest ingredients`);
  console.log(`   GET  /api/users/profile - Get user profile`);
});

module.exports = app;