PROPONENTS:
John Paul P. Mahilom
John Mark P. Magdasal.
CookMate: Your AI Kitchen Assistant
A Web Development Application with AI
Technology Stack and Tools
Frontend: React.js (with Vite), Tailwind CSS, Lucide Icons
Backend: Node.js / Express, Flask (Option)
AI Service: Hugging Face Inference API
Database: Firebase Firestore (for saving user recipes and preferences)
Version Control: Git & GitHub
Outline of Main Features and Functionalities
Interactive Chat Interface: A clean, responsive chat-style UI where users can naturally
communicate with the AI assistant.
Dual Recipe Discovery Modes:
● Ingredient-Based: Users input their available ingredients (e.g., "I have chicken,
tomatoes, and onions") and receive personalized recipe suggestions.
● Recipe Request: Users can directly ask for specific recipes (e.g., "how to make chicken
adobo" or "a good vegetarian pasta").
Step-by-Step Recipe Generation: The AI will provide complete, easy-to-follow recipes, including
ingredient lists and cooking instructions.
Recipe Saving & Management: Logged-in users can save their favorite generated recipes to a
personal "digital cookbook" linked to their account.
Dietary Preference Support: The system will be able to adapt and filter recipes based on
user-specified dietary restrictions (e.g., "vegetarian," "gluten-free," "low-carb").
AI Component Description
● Machine Learning Model / Algorithm: We will utilize a pre-trained Large Language Model
(LLM) optimized for text generation and instruction-following.
● AI API or Service: Our primary tool will be the Hugging Face Inference API. This allows us
to leverage powerful open-source models (like Mistral-7B or Llama) without the cost and
complexity of training our own.
● Purpose and Function: The AI's core function is recipe generation and personalization. It
will interpret a user's natural language input (whether it's a list of ingredients or a direct
request) and generate a relevant, coherent, and useful recipe. It will also handle the
personalization by adjusting outputs based on dietary needs.
Deployment / Hosting Platform
We will deploy the entire full-stack application using the Firebase platform for a seamless,
integrated solution.
● Frontend (React Application): Firebase Hosting. This will serve our static React files
globally.
● Backend (Node.js API): Cloud Functions for Firebase. We will deploy our Express.js
application as a serverless function. This allows it to run securely, scale automatically,
and manage our environment variables (API keys) within the same Firebase project that
handles our database and hosting.