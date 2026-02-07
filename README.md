# IB Test Manager

A comprehensive web application for managing and accessing International Baccalaureate (IB) past papers and audio files through Google Drive integration.

## 🚀 Live Demo

[Deployed on Cloudflare Workers](https://ib-test-manager.org/)


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

## Project Structure

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

## Getting Started

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

### Required Variables
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
