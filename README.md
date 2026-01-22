# IB Test Manager

A comprehensive web application for managing and accessing International Baccalaureate (IB) past papers and audio files through Google Drive integration.

## 🚀 Live Demo

[Deployed on Cloudflare Workers](https://ib-test-manager.org/)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [APIs & Integrations](#apis--integrations)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- **Structured Paper Selector**: Step-by-step interface to find IB papers
- **Smart Search**: Intelligent parsing of user queries for paper requests
- **Multi-Format Support**: PDF papers and MP3 audio files
- **Real-time File Access**: Direct integration with Google Drive
- **Responsive Design**: Works on desktop and mobile devices

### Advanced Features
- **Dynamic Subject Loading**: Automatically loads available subjects based on year/month/group
- **Audio File Support**: Language B and ab_initio audio files
- **Case-Insensitive Search**: Flexible subject name matching
- **File Type Detection**: Automatic PDF vs audio file handling
- **Secure File Viewing**: Protected file access through secure API endpoints

## 🛠 Tech Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **React 19.0.0** - UI library with hooks and components
- **CSS3** - Custom styling with CSS Grid and Flexbox
- **Responsive Design** - Mobile-first approach

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Cloudflare Workers** - Edge computing platform
- **OpenNext.js** - Next.js optimization for Cloudflare
- **Custom Rate Limiter** - In-memory request throttling
- **Streaming Proxy** - Secure file streaming service

### APIs & Services
- **Google Drive API v3** - File storage and retrieval
- **Google Service Account** - Authentication and authorization
- **Cloudflare Workers** - Serverless hosting

### Development Tools
- **TypeScript 5.8.3** - Type safety and development experience
- **Wrangler 4.22.0** - Cloudflare Workers CLI
- **ES Modules** - Modern JavaScript module system

## 🔌 APIs & Integrations

### Google Drive API v3
**Purpose**: Primary file storage and retrieval system

**Key Operations**:
- File listing and search functionality
- File metadata retrieval
- File content download
- Advanced search capabilities

**Security Implementation**:
- Service account authentication with JWT tokens
- Secure credential management through environment variables
- Rate limiting and error handling
- Input validation and sanitization

### Cloudflare Workers
**Purpose**: Serverless hosting and edge computing

**Features Used**:
- **Edge Computing**: Global distribution for low latency
- **Request Handling**: HTTP request/response processing
- **Environment Variables**: Secure configuration management
- **Static Assets**: Optimized file serving

### Next.js API Routes
**Purpose**: Backend API endpoints

**Security Features**:
- Input validation and sanitization
- Rate limiting implementation
- Secure file access with authentication
- Error handling without exposing sensitive information

## 📁 Project Structure

```
ib-test-manager/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── proxy-pdf/            # Secure file proxy
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page
│   └── Chatbot.js                # Chatbot component
├── components/                   # React components
│   ├── StructuredPaperSelector.js
│   ├── StructuredPaperSelector.css
│   ├── Header.js
│   └── Footer.js
├── lib/                          # Backend logic
│   ├── rate-limiter.js           # Custom rate limiting
│   ├── google-drive-file-service.js # Drive service logic
│   └── Google_drives_ervice.js   # Service base class
├── public/                       # Static assets
│   ├── logo.png
└── package.json                  # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud Platform account
- Cloudflare account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Moon0002/IB-Test-Manager.git
cd ib-test-manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local file with your Google Drive service account credentials
# Copy from .env.example and fill in your values
# Never commit this file to version control
```

4. **Run development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 🔐 Environment Variables

### Required Variables
```env
# Google Drive Service Account credentials
# Set these securely in Cloudflare Workers dashboard
# Never commit these values to version control
TARGET_FOLDER_ID=your_google_drive_folder_id
GOOGLE_TYPE=service_account
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_AUTH_URI=your_auth_uri
GOOGLE_TOKEN_URI=your_token_uri
GOOGLE_AUTH_PROVIDER_X509_CERT_URL=your_cert_url
GOOGLE_CLIENT_X509_CERT_URL=your_client_cert_url
GOOGLE_UNIVERSE_DOMAIN=googleapis.com
```

### Security Notes
- **Never commit environment variables to version control**
- **Use Cloudflare Workers Secrets for production deployment**
- **Rotate credentials regularly**
- **Use least-privilege access principles**

## 🚀 Deployment

### Cloudflare Workers Deployment

1. **Build the application**
```bash
npm run build
```

2. **Deploy to Cloudflare**
```bash
npm run deploy
```

3. **Set environment variables in Cloudflare Dashboard**
   - Go to Cloudflare Workers Dashboard
   - Select your worker
   - Go to Settings > Variables
   - Add all required environment variables

### Manual Deployment Steps

1. **Configure Wrangler**
```bash
npx wrangler login
```

2. **Set up environment variables securely**
```bash
# Use Cloudflare Workers Secrets for production
npx wrangler secret put TARGET_FOLDER_ID
npx wrangler secret put GOOGLE_PRIVATE_KEY
# ... set other secrets as needed
```

3. **Deploy with OpenNext**
```bash
npm run deploy
```

4. **Verify deployment**
```bash
npx wrangler tail
```

## 🧪 Testing

### Local Testing
```bash
# Run development server
npm run dev
```

## 🔧 Development

### Key Technologies Implemented

#### **Google Drive API Integration**
- **Service Account Authentication**: JWT-based auth with Google
- **File Search & Retrieval**: Advanced querying and filtering
- **MIME Type Handling**: PDF and audio file support
- **Folder Navigation**: Dynamic folder structure traversal

#### **Next.js App Router**
- **API Routes**: Serverless backend endpoints
- **Dynamic Imports**: Code splitting and optimization
- **Middleware**: Request processing and validation
- **Static Generation**: Optimized build output

#### **React Hooks & State Management**
- **useState**: Component state management
- **useEffect**: Side effects and lifecycle
- **useRef**: DOM references and persistence
- **Custom Hooks**: Reusable logic extraction

#### **CSS Grid & Flexbox**
- **Responsive Layout**: Mobile-first design
- **Grid Systems**: Complex layout structures
- **Flexbox**: Component alignment and spacing
- **CSS Variables**: Theme and consistency

#### **File Processing & Parsing**
- **Regex Patterns**: Filename parsing and extraction
- **String Manipulation**: Subject and level extraction
- **Case-Insensitive Matching**: Flexible search capabilities
- **Error Handling**: Robust error management

## 📊 Performance Optimizations

### **Caching Strategy**
- **API Response Caching**: Reduced Google Drive API calls
- **Static Asset Optimization**: Compressed and minified files
- **Edge Caching**: Cloudflare global distribution

### **Code Splitting**
- **Dynamic Imports**: Lazy loading of components
- **Route-based Splitting**: Optimized bundle sizes
- **Tree Shaking**: Unused code elimination

### **Database Optimization**
- **Efficient Queries**: Optimized Google Drive API calls
- **Batch Operations**: Reduced API request count
- **Error Handling**: Graceful failure management

## 🛡 Security Features

### **Input Validation**
- **Sanitization**: XSS and injection prevention
- **Type Checking**: Runtime type validation
- **Length Limits**: Input size restrictions
- **Regex Validation**: Pattern-based input filtering

### **File Access Control**
- **Secure Endpoints**: Protected file access with authentication
- **MIME Type Validation**: File type verification
- **Service Account Security**: JWT-based authentication
- **Rate Limiting**: API abuse prevention

### **Environment Security**
- **Secret Management**: Secure credential storage via Cloudflare Workers Secrets
- **Environment Isolation**: Development vs production separation
- **Access Control**: Restricted API access with proper permissions
- **Credential Rotation**: Regular security key updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security Best Practices

### **For Developers**
- Never commit API keys or credentials to version control
- Use environment variables for all sensitive configuration
- Implement proper input validation and sanitization
- Use HTTPS for all communications
- Regularly update dependencies and rotate credentials

### **For Deployment**
- Use Cloudflare Workers Secrets for production credentials
- Enable proper CORS policies
- Implement rate limiting and abuse prevention
- Monitor for suspicious activity
- Keep security headers up to date

### **For Users**
- The application uses secure authentication methods
- File access is protected and validated
- No personal data is stored or transmitted unnecessarily

## 🙏 Acknowledgments

- **Google Drive API** for file storage and retrieval
- **Cloudflare Workers** for serverless hosting
- **Next.js** for the React framework
---