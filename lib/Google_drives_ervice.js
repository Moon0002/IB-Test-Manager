import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Module-level cache to persist across all API routes
let globalInstance = null;
let globalInitialized = false;
let globalAccessToken = null;

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.accessToken = globalAccessToken; // Use global token
    this.initialized = globalInitialized; // Use global state
  }

  // Getter for access token to ensure we always have the latest global token
  get accessToken() {
    return globalAccessToken || this._accessToken;
  }

  set accessToken(token) {
    this._accessToken = token;
    globalAccessToken = token; // Update global state
  }

  // Singleton instance
  static getInstance() {
    if (!globalInstance) {
      globalInstance = new GoogleDriveService();
    }
    return globalInstance;
  }

  // Initialize the Google Drive API client
  async initialize() {
    // Return immediately if already initialized globally
    if (globalInitialized) {
      console.log('✅ [Cache] Google Drive API already initialized globally, skipping');
      this.initialized = true;
      this.accessToken = globalAccessToken;
      return true;
    }

    try {
      console.log('🔍 Starting Google Drive API initialization...');
      
      // Check if we have service account credentials
      if (this.hasServiceAccountCredentials()) {
        console.log('🔍 Using service account authentication...');
        await this.initializeWithServiceAccount();
        
        // Update global state
        globalInitialized = true;
        this.initialized = true;
        
        console.log('✅ Google Drive API initialized successfully');
        return true;
      } else {
        throw new Error('Service account credentials not found. Please check your environment variables.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive API:', error.message);
      return false;
    }
  }

  // Check if the service is already initialized
  isInitialized() {
    return globalInitialized;
  }

  // Check if all required service account environment variables are present
  hasServiceAccountCredentials() {
    const requiredVars = [
      'GOOGLE_TYPE',
      'GOOGLE_PROJECT_ID',
      'GOOGLE_PRIVATE_KEY_ID',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_AUTH_URI',
      'GOOGLE_TOKEN_URI',
      'GOOGLE_AUTH_PROVIDER_X509_CERT_URL',
      'GOOGLE_CLIENT_X509_CERT_URL',
      'GOOGLE_UNIVERSE_DOMAIN'
    ];
    
    // Only log missing credentials to reduce noise
    let allPresent = true;
    
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        console.log(`❌ ${varName}: Missing`);
        allPresent = false;
      }
    });
    
    if (allPresent) {
      console.log('✅ All service account credentials present');
    }
    return allPresent;
  }

  // Initialize with service account (recommended for automation)
  async initializeWithServiceAccount() {
    // Create credentials object from environment variables
    const credentials = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle newlines in private key
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
    };

    // Validate that all required fields are present
    if (!credentials.type || !credentials.project_id || !credentials.private_key || !credentials.client_email) {
      throw new Error('Missing required Google service account credentials in environment variables. Please check GOOGLE_TYPE, GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, and GOOGLE_CLIENT_EMAIL.');
    }

    // Get access token using service account
    await this.getServiceAccountToken(credentials);
  }

  // Get access token using service account JWT
  async getServiceAccountToken(credentials) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const oneHour = 60 * 60;
      
      // Create JWT header
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };
      
      // Create JWT payload
      const payload = {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: credentials.token_uri,
        exp: now + oneHour,
        iat: now
      };
      
      // Create JWT
      const jwt = await this.createJWT(header, payload, credentials.private_key);
      
      // Exchange JWT for access token
      const tokenResponse = await fetch(credentials.token_uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      
      console.log('✅ Service account token obtained successfully');
    } catch (error) {
      console.error('❌ Failed to get service account token:', error.message);
      throw error;
    }
  }

  // Create JWT token using Web Crypto API (available in Cloudflare Workers)
  async createJWT(header, payload, privateKey) {
    try {
      // Encode header and payload
      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      
      // Create the data to sign
      const data = `${encodedHeader}.${encodedPayload}`;
      
      // Convert PEM private key to CryptoKey
      const cryptoKey = await this.pemToCryptoKey(privateKey);
      
      // Sign the data
      const signature = await crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        cryptoKey,
        new TextEncoder().encode(data)
      );
      
      // Encode the signature
      const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      
      // Return the complete JWT
      return `${data}.${encodedSignature}`;
    } catch (error) {
      console.error('❌ Error creating JWT:', error.message);
      throw new Error(`Failed to create JWT: ${error.message}`);
    }
  }

  // Convert PEM private key to CryptoKey
  async pemToCryptoKey(pemKey) {
    try {
      // Remove PEM headers and decode base64
      const pemHeader = '-----BEGIN PRIVATE KEY-----';
      const pemFooter = '-----END PRIVATE KEY-----';
      
      if (!pemKey.includes(pemHeader) || !pemKey.includes(pemFooter)) {
        throw new Error('Invalid PEM format. Expected BEGIN/END PRIVATE KEY markers.');
      }
      
      const base64Key = pemKey
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s/g, '');
      
      const binaryKey = atob(base64Key);
      const keyData = new Uint8Array(binaryKey.length);
      for (let i = 0; i < binaryKey.length; i++) {
        keyData[i] = binaryKey.charCodeAt(i);
      }
      
      // Import as RSA private key
      return await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      );
    } catch (error) {
      console.error('❌ Error converting PEM to CryptoKey:', error.message);
      throw new Error(`Failed to convert PEM key: ${error.message}`);
    }
  }


  // Make authenticated request to Google Drive API
  async makeRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available. Please initialize the service first.');
    }

    const url = `https://www.googleapis.com/drive/v3${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  // Get all files from Google Drive
  async getAllFiles(folderId = null, pageSize = 1000) {
    try {
      let query = 'trashed=false';
      if (folderId) {
        query = `'${folderId}' in parents and trashed=false`;
      }
      
      const params = new URLSearchParams({
        q: query,
        pageSize: pageSize.toString(),
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents)',
        orderBy: 'name'
      });
      
      const response = await this.makeRequest(`/files?${params}`);
      return response.files || [];
    } catch (error) {
      console.error('❌ Error fetching files:', error.message);
      return [];
    }
  }

  // Get file details
  async getFileDetails(fileId) {
    try {
      const response = await this.makeRequest(`/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink`);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching file details for ${fileId}:`, error.message);
      return null;
    }
  }

  // Get file content (for downloading/streaming)
  async getFileContent(fileId) {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available. Please initialize the service first.');
      }

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Drive API error: ${response.status} ${errorText}`);
      }

      return response.arrayBuffer();
    } catch (error) {
      console.error(`❌ Error fetching file content for ${fileId}:`, error.message);
      return null;
    }
  }






  // Search for files by query with pagination support
  async searchFiles(query, folderId = null) {
    try {
      let searchQuery = query;
      if (folderId) {
        searchQuery = `${query} and '${folderId}' in parents`;
      }

      const allFiles = [];
      let pageToken = null;
      let hasMoreResults = true;

      while (hasMoreResults) {
        const params = new URLSearchParams({
          q: searchQuery,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents)',
          orderBy: 'name',
          pageSize: 1000 // Use maximum page size to minimize API calls
        });

        if (pageToken) {
          params.append('pageToken', pageToken);
        }

        const response = await this.makeRequest(`/files?${params}`);
        
        if (response.files && response.files.length > 0) {
          allFiles.push(...response.files);
        }

        // Check if there are more pages
        pageToken = response.nextPageToken;
        hasMoreResults = !!pageToken;
      }

      console.log(`🔍 Search completed: Found ${allFiles.length} files for query: ${query}`);
      return allFiles;
    } catch (error) {
      console.error('❌ Error searching files:', error.message);
      return [];
    }
  }

  // Rename a file in Google Drive
  async renameFile(fileId, newName) {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available. Please initialize the service first.');
      }

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Drive API error: ${response.status} ${errorText}`);
      }

      const updatedFile = await response.json();
      return updatedFile;
    } catch (error) {
      console.error(`❌ Error renaming file ${fileId}:`, error.message);
      throw error;
    }
  }

}

export default GoogleDriveService;
