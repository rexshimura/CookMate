# CookMate - Your AI Kitchen Assistant

CookMate is a web development application featuring AI technology designed to assist users in discovering and generating personalized recipes based on available ingredients or specific requests. It offers a responsive, chat-style interface that allows natural language interaction with an AI cooking assistant.

## Features

- **Interactive Chat Interface**  
  A clean, responsive chat UI where users communicate naturally with the AI assistant.

- **Dual Recipe Discovery Modes**  
  - Ingredient-Based: Input available ingredients to get personalized recipe suggestions.  
  - Recipe Request: Ask directly for specific recipes or cooking ideas.

- **Step-by-Step Recipe Generation**  
  The AI provides complete, easy-to-follow recipes including ingredient lists and instructions.

- **Recipe Saving and Management**  
  Logged-in users can save favorite recipes to a personal digital cookbook.

- **Dietary Preference Support**  
  Recipes can be filtered and personalized based on dietary restrictions such as vegetarian, gluten-free, or low-carb.

## Technology Stack

- **Frontend:**  
  React.js (with Vite), Tailwind CSS, Lucide Icons

- **Backend:**  
  Node.js with Express, Flask (optional)

- **AI Service:**  
  Hugging Face Inference API leveraging large language models like Mistral-7B or Llama

- **Database:**  
  Firebase Firestore for saving user recipes and preferences

- **Version Control:**  
  Git & GitHub

## AI Component

- Utilizes pre-trained large language models (LLMs) optimized for text generation and instruction-following.
- Core functions include recipe generation and personalization based on natural language input and dietary needs.
- Powered primarily by the Hugging Face Inference API to leverage powerful open-source AI models without the complexity of training.

## Deployment

- Hosted on the Firebase platform for an integrated full-stack solution.
- Frontend React application served via Firebase Hosting.
- Backend Express.js API deployed as Cloud Functions for Firebase for scalability and secure management.

## Installation and Setup

1. Clone the repository:

`git clone <repository-url>`
`cd cookmate`


2. Install dependencies for frontend and backend:

`cd frontend`
`npm install


3. Configure environment variables:
- Setup Firebase project and Firebase Firestore.
- Add Firebase configuration and API keys for Hugging Face Inference API to environment files.

4. Run the development servers:
- Frontend:
  ```
  npm run dev
  ```
- Backend:
  ```
  npm start
  ```

5. For production deployment, deploy the frontend to Firebase Hosting and backend to Firebase Cloud Functions.

## Usage

- Access the web app through your browser.
- Use the chat interface to enter ingredients or recipe requests.
- View AI-generated recipes step-by-step.
- Register and log in to save favorite recipes to your personal cookbook.
- Set dietary preferences to receive tailored recipe suggestions.

## Contributors

- John Paul P. Mahilom  
- John Mark P. Magdasal

## License

This project is licensed under the MIT License RavenLabs Development.

---

This README provides an overview of CookMate's features, technology stack, AI integration, and instructions for installation, setup, and usage.

