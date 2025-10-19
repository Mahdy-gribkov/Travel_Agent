# vAI Travel Agent - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the vAI Travel Agent application to production. The application is built with Next.js 14, TypeScript, Firebase, and integrates with various AI services.

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Google Cloud Platform account
- Pinecone account for vector database
- LangChain account for AI agent tracing
- Domain name and SSL certificate (for production)

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Required Environment Variables

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
NEXTAUTH_URL=https://your-domain.com

# External APIs (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

### Optional Environment Variables

```env
# Development/Staging
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
ANALYTICS_ID=your_analytics_id_here

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (if needed for future features)

### 2. Generate Service Account

1. Go to Project Settings > Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Extract the required values for environment variables

### 3. Firestore Security Rules

Update your Firestore rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    // In production, implement proper security rules
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Firestore Indexes

Deploy the indexes defined in `firestore.indexes.json`:

```bash
firebase deploy --only firestore:indexes
```

## Pinecone Setup

### 1. Create Pinecone Account

1. Sign up at [Pinecone](https://www.pinecone.io/)
2. Create a new project
3. Create an index named `vaitravel-production`

### 2. Configure Index

- **Dimensions**: 768 (for Gemini embeddings)
- **Metric**: cosine
- **Pods**: 1 (for development), scale as needed for production

## Google Cloud Platform Setup

### 1. Enable APIs

Enable the following APIs in your GCP project:
- Google Maps JavaScript API
- Google Maps Places API
- Google Maps Directions API
- Google Maps Geocoding API

### 2. Create API Keys

1. Go to APIs & Services > Credentials
2. Create API keys for each service
3. Restrict keys to your domain and required APIs

## LangChain Setup

### 1. Create LangChain Account

1. Sign up at [LangChain](https://www.langchain.com/)
2. Create a new project
3. Get your API key

### 2. Configure Tracing

Set up tracing to monitor AI agent performance and tool usage.

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Set `NODE_ENV=production`

3. **Custom Domain**
   - Add your domain in Vercel dashboard
   - Configure DNS records

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```bash
   # Create Dockerfile
   cat > Dockerfile << EOF
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   EOF
   
   # Build image
   docker build -t vai-travel-agent .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local vai-travel-agent
   ```

### Option 3: Traditional Server

1. **Server Requirements**
   - Ubuntu 20.04+ or similar
   - Node.js 18+
   - PM2 for process management
   - Nginx for reverse proxy

2. **Deployment Steps**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/Travel_Agent.git
   cd Travel_Agent
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "vai-travel-agent" -- start
   pm2 save
   pm2 startup
   ```

## Nginx Configuration

Create `/etc/nginx/sites-available/vai-travel-agent`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL Certificate

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Migration

### 1. Run Pinecone Migration

```bash
# Install dependencies
npm install

# Run migration script
npm run migrate:pinecone
```

### 2. Verify Data

Check that documents are properly indexed in Pinecone dashboard.

## Monitoring and Logging

### 1. Application Monitoring

- Set up Sentry for error tracking
- Configure Google Analytics
- Monitor Firebase usage

### 2. Server Monitoring

- Set up server monitoring (e.g., New Relic, DataDog)
- Monitor CPU, memory, and disk usage
- Set up alerts for critical metrics

### 3. Log Management

```bash
# PM2 logs
pm2 logs vai-travel-agent

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Performance Optimization

### 1. Caching

- Enable Redis for session storage
- Configure CDN for static assets
- Implement API response caching

### 2. Database Optimization

- Monitor Firestore usage and costs
- Optimize queries and indexes
- Consider data archiving strategies

### 3. Image Optimization

- Use Next.js Image component
- Implement WebP format
- Configure proper caching headers

## Security Checklist

- [ ] Environment variables are secure
- [ ] API keys are restricted to required domains
- [ ] Firestore security rules are properly configured
- [ ] SSL certificate is valid and auto-renewing
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] Error messages don't expose sensitive information

## Backup Strategy

### 1. Database Backups

```bash
# Firestore backup
gcloud firestore export gs://your-backup-bucket/firestore-backup

# Pinecone backup (if supported)
# Check Pinecone documentation for backup options
```

### 2. Application Backups

- Regular code backups via Git
- Environment variable backups (encrypted)
- Configuration file backups

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

2. **Runtime Errors**
   - Verify environment variables
   - Check Firebase connection
   - Monitor application logs

3. **Performance Issues**
   - Monitor database queries
   - Check API rate limits
   - Optimize images and assets

### Debug Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs vai-travel-agent

# Restart application
pm2 restart vai-travel-agent

# Check Nginx status
sudo systemctl status nginx

# Test SSL certificate
openssl s_client -connect your-domain.com:443
```

## Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Monitor security advisories
- [ ] Review and rotate API keys
- [ ] Check SSL certificate expiration
- [ ] Monitor database usage and costs
- [ ] Review application logs for errors

### Updates

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm ci

# Build and restart
npm run build
pm2 restart vai-travel-agent
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test API connections
4. Review this documentation
5. Contact support team

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Firebase project set up and tested
- [ ] Pinecone index created and populated
- [ ] SSL certificate installed and working
- [ ] Domain DNS configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Security checklist completed
- [ ] Performance testing completed
- [ ] Error handling tested
- [ ] API rate limits configured
- [ ] CORS settings verified
- [ ] Database indexes optimized
- [ ] CDN configured (if applicable)
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on deployment process
