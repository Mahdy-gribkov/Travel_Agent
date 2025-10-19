# vAI Travel Agent

An intelligent AI-powered travel planning application built with Next.js 14, TypeScript, Firebase, and advanced AI technologies.

## 🚀 Features

### Core Functionality
- **AI-Powered Travel Planning**: Intelligent itinerary generation using Google Gemini AI
- **Real-time Chat Interface**: Interactive chat with AI agent for travel assistance
- **Vector Search**: Advanced RAG (Retrieval Augmented Generation) with Pinecone
- **Multi-language Support**: English and Hebrew with RTL support
- **Responsive Design**: Modern UI with dark/light theme support

### AI Agent Capabilities
- **Travel Guide Search**: Find relevant travel information and guides
- **Itinerary Management**: Create, update, and manage travel itineraries
- **Weather Information**: Get current weather data for destinations
- **Flight Information**: Search and compare flight options
- **Place Recommendations**: Discover attractions, restaurants, and activities
- **Budget Planning**: Calculate travel costs and budget estimates

### Technical Features
- **TypeScript Strict Mode**: Full type safety and error prevention
- **Comprehensive Testing**: Unit, integration, and E2E tests
- **Accessibility**: WCAG compliant with ARIA labels and keyboard navigation
- **Performance Optimized**: Fast loading with Next.js 14 optimizations
- **Security**: API key authentication and rate limiting

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **next-themes** - Theme management
- **next-intl** - Internationalization

### Backend & Services
- **Firebase Firestore** - NoSQL database
- **Google Gemini AI** - Large language model
- **Pinecone** - Vector database for RAG
- **LangChain** - AI agent framework
- **MCP (Model Context Protocol)** - Agent logging and session management

### External APIs
- **Google Maps API** - Places, directions, and geocoding
- **OpenWeather API** - Weather information
- **Flight APIs** - Flight search and booking

### Development & Testing
- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore
- Google Cloud Platform account
- Pinecone account
- LangChain account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Travel_Agent.git
cd Travel_Agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=vaitravel-production

# AI Agent Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_api_key_here
LANGCHAIN_PROJECT=vaitravel-agent

# Application Security
APP_API_KEY=your_secure_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
Travel_Agent/
├── app/                    # Next.js App Router
│   ├── (app)/             # Main application routes
│   ├── (auth)/            # Authentication routes (removed)
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat interface components
│   ├── itinerary/         # Itinerary components
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── providers/         # Context providers
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── design-tokens/     # Design system tokens
│   ├── error-handling/    # Error handling utilities
│   ├── firebase/          # Firebase configuration
│   ├── middleware/        # Middleware functions
│   ├── monitoring/        # Monitoring utilities
│   ├── performance/       # Performance utilities
│   ├── security/          # Security utilities
│   ├── testing/           # Test utilities
│   └── validations/       # Validation schemas
├── services/              # Business logic services
│   ├── ai/                # AI-related services
│   ├── external/          # External API services
│   └── *.service.ts       # Core services
├── types/                 # TypeScript type definitions
├── __tests__/             # Unit and integration tests
├── e2e/                   # End-to-end tests
└── docs/                  # Documentation
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API route and service integration testing
- **E2E Tests**: Full user journey testing with Playwright
- **Accessibility Tests**: WCAG compliance testing
- **Performance Tests**: Load and performance testing

## 🎨 Design System

The application uses a comprehensive design system with:

### Design Tokens
- **Colors**: Primary, secondary, semantic color palettes
- **Typography**: Font families, sizes, weights, and spacing
- **Spacing**: Consistent spacing scale
- **Shadows**: Elevation and depth
- **Breakpoints**: Responsive design breakpoints

### Components
- **Buttons**: Primary, secondary, and variant styles
- **Inputs**: Form inputs with validation states
- **Cards**: Content containers with consistent styling
- **Modals**: Overlay components for user interaction

### Themes
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy-on-eyes dark interface
- **System Theme**: Automatic theme switching

## 🌍 Internationalization

### Supported Languages
- **English (en)**: Default language
- **Hebrew (he)**: Full RTL support

### RTL Support
- Automatic text direction detection
- RTL-aware CSS utilities
- Proper layout adjustments for Hebrew text

## 🔒 Security

### Authentication
- API key-based authentication
- Rate limiting and DDoS protection
- Input validation and sanitization

### Data Protection
- Environment variable security
- Secure API key management
- CORS configuration
- Error message sanitization

## 📊 Performance

### Optimization Features
- **Next.js 14**: Latest performance optimizations
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting
- **Caching**: Strategic caching implementation
- **Bundle Analysis**: Bundle size monitoring

### Monitoring
- **Performance Metrics**: Core Web Vitals tracking
- **Error Tracking**: Comprehensive error monitoring
- **Usage Analytics**: User behavior tracking

## 🚀 Deployment

### Production Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t vai-travel-agent .

# Run container
docker run -p 3000:3000 --env-file .env.local vai-travel-agent
```

## 📚 API Documentation

### Core Endpoints

#### Chat API
- `POST /api/chat` - Create new chat session
- `GET /api/chat/[id]` - Get chat session
- `POST /api/chat/[id]/messages` - Send message

#### Itinerary API
- `GET /api/itineraries` - List user itineraries
- `POST /api/itineraries` - Create new itinerary
- `GET /api/itineraries/[id]` - Get specific itinerary
- `PUT /api/itineraries/[id]` - Update itinerary
- `DELETE /api/itineraries/[id]` - Delete itinerary

#### AI Search API
- `GET /api/ai/search` - Search travel content
- `POST /api/ai/chat` - AI chat endpoint
- `POST /api/ai/itinerary` - Generate itinerary

#### External APIs
- `GET /api/countries` - Country information
- `GET /api/places` - Places search
- `GET /api/flights` - Flight search
- `GET /api/directions` - Directions
- `GET /api/weather` - Weather information

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for code quality
- **Prettier**: Consistent code formatting
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear code documentation

### Commit Convention

```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Security Guide](docs/SECURITY_GUIDE.md)
- [Performance Guide](docs/PERFORMANCE_GUIDE.md)

### Getting Help
- Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Review existing [Issues](https://github.com/your-username/Travel_Agent/issues)
- Create a new issue for bugs or feature requests

### Community
- Join our Discord server
- Follow us on Twitter
- Star the repository if you find it helpful

## 🗺️ Roadmap

### Upcoming Features
- [ ] Multi-user collaboration
- [ ] Advanced itinerary sharing
- [ ] Real-time travel updates
- [ ] Mobile app development
- [ ] Voice interface integration
- [ ] Advanced AI recommendations

### Performance Improvements
- [ ] Edge computing optimization
- [ ] Advanced caching strategies
- [ ] Database query optimization
- [ ] Image and asset optimization

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language understanding
- **Pinecone** for vector database capabilities
- **LangChain** for AI agent framework
- **Next.js Team** for the amazing framework
- **Vercel** for deployment platform
- **Open Source Community** for various dependencies

---

**Built with ❤️ for travelers worldwide**