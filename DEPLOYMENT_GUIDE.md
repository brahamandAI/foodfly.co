# 🚀 Foodfly Deployment Guide

Complete guide for deploying Foodfly to various platforms with production-ready configurations.

## 📋 Pre-Deployment Checklist

### ✅ Environment Variables
Ensure all required environment variables are set:

```bash
# Required for all deployments
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### ✅ Build Test
```bash
npm run build
npm start
npm run health-check
```

---

## 🌟 Vercel Deployment (Recommended)

### 1. Quick Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/foodfly-app)

### 2. Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Environment Variables Setup
In Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/foodfly
JWT_SECRET = your-super-secure-jwt-secret-here
NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_live_xxxxx
RAZORPAY_KEY_SECRET = your_live_secret
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
NODE_ENV = production
```

### 4. Custom Domain
1. Go to Vercel Dashboard → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

---

## 🐳 Docker Deployment

### 1. Build and Run Locally

```bash
# Build the image
docker build -t foodfly-app .

# Run with environment file
docker run -p 3000:3000 --env-file .env.production foodfly-app
```

### 2. Docker Compose (Recommended)

```bash
# Update docker-compose.yml with your values
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Production Docker Compose

```yaml
version: '3.8'

services:
  foodfly-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/test"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - foodfly-app
    restart: unless-stopped
```

---

## 🌐 Netlify Deployment

### 1. Build Settings
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Deploy Command
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod
```

---

## 🖥️ VPS/Server Deployment

### 1. Server Setup (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/foodfly-app.git
cd foodfly-app

# Install dependencies
npm ci --only=production

# Create production environment file
cp env.example .env.production
# Edit .env.production with your values

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/foodfly
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

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

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 MongoDB Setup

### 1. MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Add database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/foodfly`

### 2. Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Connection string
MONGODB_URI=mongodb://localhost:27017/foodfly
```

---

## 🔐 Security Configuration

### 1. Environment Variables Security

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Example secure configuration
JWT_SECRET=super-long-secure-random-string-minimum-32-characters
```

### 2. Razorpay Production Setup

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Generate Live API Keys
4. Update environment variables:
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

### 3. Admin Security

```bash
# Change default admin credentials after first login
# Login to /admin with:
# Email: admin@foodfly.com
# Password: password

# Then immediately change password in admin settings
```

---

## 🔄 CI/CD with GitHub Actions

### 1. Required GitHub Secrets

```
MONGODB_URI
JWT_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_APP_URL
VERCEL_TOKEN (for Vercel deployment)
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### 2. Automatic Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions.

---

## 🏥 Health Monitoring

### 1. Health Check Endpoints

```bash
# API Health
curl https://your-domain.com/api/test

# Application Health
curl https://your-domain.com/health
```

### 2. Monitoring Setup

```bash
# PM2 Monitoring
pm2 monit

# Application logs
pm2 logs foodfly-app

# System monitoring
sudo apt install htop
htop
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   npm run clean
   npm ci
   npm run build
   ```

2. **Database Connection Issues**
   - Check MONGODB_URI format
   - Verify network access to MongoDB
   - Check firewall settings

3. **Environment Variables Not Loading**
   - Verify .env file location
   - Check variable names (case-sensitive)
   - Restart application after changes

4. **Payment Gateway Issues**
   - Verify Razorpay credentials
   - Check API key environment (test vs live)
   - Monitor Razorpay dashboard for errors

### Support Resources

- 📧 Create GitHub Issue: [Link to your repo]
- 📖 Documentation: [Link to docs]
- 💬 Discord Community: [Link if available]

---

## 🎯 Performance Optimization

### 1. CDN Setup
- Use Vercel's built-in CDN
- Or configure Cloudflare for custom domains

### 2. Database Optimization
- Enable MongoDB Atlas Performance Advisor
- Add database indexes for frequently queried fields
- Monitor query performance

### 3. Application Monitoring
- Use Vercel Analytics
- Monitor Core Web Vitals
- Set up error tracking (Sentry)

---

**🚀 Ready for Production!**

Your Foodfly application is now ready for deployment. Choose the deployment method that best fits your needs and infrastructure.

---

*Last updated: [Current Date]* 