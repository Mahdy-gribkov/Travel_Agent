# 🚀 Quick Setup Guide

## Get Started in 5 Minutes

### 1. Clone and Install
```bash
git clone https://github.com/Mahdy-gribkov/Travel_Agent.git
cd Travel_Agent
npm install
```

### 2. Create Environment File
Create a `.env.local` file in the project root:

```env
# Minimal setup for development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Add your API keys for full functionality
# FIREBASE_PROJECT_ID=your-firebase-project-id
# GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
# PINECONE_API_KEY=your_pinecone_api_key_here
```

### 3. Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## What You'll See

- **Dashboard** - Main interface with mock data
- **Chat Interface** - AI chat (will show placeholder responses without API keys)
- **Itineraries** - Travel planning with sample itineraries
- **Theme Toggle** - Switch between light/dark modes
- **Responsive Design** - Works on all devices

## Features That Work Without API Keys

✅ **UI/UX** - Complete interface with design system  
✅ **Theme Toggle** - Light/dark mode switching  
✅ **Responsive Design** - Mobile, tablet, desktop layouts  
✅ **Navigation** - All pages and routing  
✅ **Mock Data** - Sample itineraries and content  
✅ **Internationalization** - English/Hebrew support  

## Features That Need API Keys

🔑 **AI Chat** - Requires Google Gemini API key  
🔑 **Vector Search** - Requires Pinecone API key  
🔑 **Database** - Requires Firebase configuration  
🔑 **External APIs** - Requires Google Maps, Weather APIs  

## Getting API Keys (Optional)

### For AI Chat Features:
1. **Google Gemini AI**: [Get API Key](https://makersuite.google.com/app/apikey)
2. **Pinecone**: [Sign up](https://www.pinecone.io/) for vector database
3. **LangChain**: [Sign up](https://www.langchain.com/) for AI agent tracing

### For Database:
1. **Firebase**: [Create project](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Generate service account key

### For External Features:
1. **Google Maps**: [Get API Key](https://console.cloud.google.com/)
2. **OpenWeather**: [Get API Key](https://openweathermap.org/api)

## Troubleshooting

### CSS Not Loading?
- Restart the dev server: `npm run dev`
- Clear browser cache
- Check browser console for errors

### API Errors?
- The app uses mock data when API keys are missing
- Check `.env.local` file exists
- Verify environment variables are correct

### Build Errors?
- Make sure Node.js version is 18+
- Run `npm install` again
- Check for TypeScript errors

## Next Steps

1. **Explore the UI** - Test all the interface features
2. **Add API Keys** - Get full AI functionality
3. **Customize** - Modify the design system
4. **Deploy** - Follow the deployment guide

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup
- Look at [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for API details

---

**The app is ready to run! Start with the basic setup and add API keys as needed.** 🧳✈️
