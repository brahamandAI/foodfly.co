# 🎤 Voice Assistant Setup Guide

## 🚀 Overview

FoodFly now includes an **AI-powered Voice Assistant** that allows users to order food naturally using voice commands. The assistant uses:

- **OpenAI Whisper** for speech-to-text
- **GPT-4** for intent recognition and conversational AI
- **OpenAI TTS** for text-to-speech responses
- **Real-time conversation management**

## 🔧 Backend Setup

### 1. Install Dependencies

The required dependencies are already added to `package.json`:

```bash
cd backend
npm install
```

### 2. Environment Variables

Add the following to your `backend/.env` file:

```env
# Required for Voice Assistant
OPENAI_API_KEY=your-openai-api-key-here

# Existing variables...
MONGODB_URI=mongodb://localhost:27017/foodfly
JWT_SECRET=your-jwt-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or log in
3. Create a new API key
4. Add it to your `.env` file

**Note:** You'll need credits in your OpenAI account for the voice features to work.

## 🎨 Frontend Setup

### 1. Install Dependencies

The required dependencies are already added to `package.json`:

```bash
cd frontend
npm install
```

### 2. Environment Variables

Add the following to your `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🎯 Voice Assistant Features

### 1. **Natural Voice Ordering**
- "I want to order some butter chicken"
- "Find me something spicy"
- "I'm hungry, what do you recommend?"

### 2. **Reorder Functionality**
- "Order my usual"
- "Repeat my last order"
- "Order that pizza from Domino's again"

### 3. **Smart Recommendations**
- "What's good for dinner?"
- "Show me popular items"
- "Find Chinese restaurants nearby"

### 4. **Conversational Flow**
- **User**: "I want pizza"
- **Assistant**: "Great! I found Pizza Palace nearby. What would you like to try?"
- **User**: "Margherita pizza, large"
- **Assistant**: "Added large Margherita pizza to your cart. Anything else?"

### 5. **Order Confirmation**
- **Assistant**: "You're about to order Chicken Biryani from Biryani Blues for ₹320. Confirm?"
- **User**: "Yes, confirm"
- **Assistant**: "Order placed! It'll be delivered in 25-30 minutes."

## 🎬 How to Use

### 1. **Access Voice Assistant**
- Click the microphone icon in the header
- Or use the voice button on any page

### 2. **Start Voice Order**
- Click the microphone button to start recording
- Speak naturally: "I want to order some food"
- Click stop when done speaking

### 3. **Listen to Response**
- The assistant will respond with voice and text
- Audio responses are automatically played
- You can replay responses using the speaker button

### 4. **Continue Conversation**
- Keep the conversation going naturally
- The assistant remembers context within the session
- No need to repeat information

## 🔧 API Endpoints

### Voice Routes (`/api/voice/`)

- `POST /speech-to-text` - Convert audio to text
- `POST /text-to-speech` - Convert text to audio
- `POST /process-command` - Process voice command with AI
- `POST /voice-to-order` - Complete voice-to-order flow
- `GET /response-audio/:sessionId` - Get audio response
- `GET /conversation/:sessionId` - Get conversation history
- `DELETE /conversation/:sessionId` - Clear conversation
- `POST /quick-commands` - Handle quick voice commands

## 🎨 UI Components

### 1. **VoiceAssistant Component**
- Full-screen voice interface
- Real-time conversation display
- Voice recording controls
- Audio playback controls

### 2. **Voice Button in Header**
- Always accessible microphone button
- Hover effects and tooltips
- Integration with main navigation

## 🔍 Voice Command Examples

### **Food Ordering**
- "Order butter chicken and naan"
- "I want a large pepperoni pizza"
- "Get me some biryani"

### **Restaurant Search**
- "Find Italian restaurants"
- "Show me restaurants near me"
- "What's good in Chinese food?"

### **Reordering**
- "Order again from my last order"
- "Repeat my usual order"
- "Order the same thing as yesterday"

### **Browsing**
- "Show me the menu"
- "What's popular here?"
- "Any vegetarian options?"

### **Cart Management**
- "Add to cart"
- "Remove from cart"
- "Show my cart"
- "Checkout"

## 🚀 Quick Start

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Application**:
   - Go to http://localhost:3000
   - Click the microphone icon in the header
   - Start speaking your order!

## 🎯 Browser Compatibility

- **Chrome**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅
- **Edge**: Full support ✅

**Note**: Microphone permissions are required for voice input.

## 🔧 Troubleshooting

### **"Failed to access microphone"**
- Check browser microphone permissions
- Ensure you're on HTTPS (or localhost)
- Try refreshing the page

### **"Failed to process voice command"**
- Check OpenAI API key is set correctly
- Verify you have OpenAI credits
- Check backend console for errors

### **Audio not playing**
- Check browser audio permissions
- Ensure volume is not muted
- Try different browser

### **Voice not being transcribed**
- Speak clearly and close to microphone
- Check for background noise
- Ensure microphone is working

## 🎉 Features in Action

The Voice Assistant provides a **truly hands-free food ordering experience**:

1. **Natural Language Processing**: Understands context and intent
2. **Memory**: Remembers conversation history
3. **Smart Suggestions**: Recommends based on preferences
4. **Real-time Feedback**: Immediate voice responses
5. **Action Integration**: Directly updates cart and places orders

## 🔮 Future Enhancements

- **Multi-language support**
- **Voice preferences and settings**
- **Integration with smart speakers**
- **Offline voice recognition**
- **Voice-based order tracking**

---

**Enjoy your new AI-powered food ordering experience! 🍕🤖**