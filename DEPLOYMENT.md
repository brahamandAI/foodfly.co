# 🚀 FoodFly Deployment Guide

This guide will help you deploy FoodFly to various hosting platforms.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Payment gateway credentials verified
- [ ] Admin credentials changed from defaults
- [ ] Application tested in production build locally

## 🌐 Hosting Platforms

### 1. Vercel (Recommended)

**Why Vercel?**
- Built for Next.js applications
- Automatic deployments from Git
- Built-in environment variable management
- Free tier available

**Steps:**
1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and sign up
3. Click "New Project" and import your GitHub repository
4. Configure environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodfly
   JWT_SECRET=your-production-jwt-secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
5. Deploy!

### 2. Netlify

**Steps:**
1. Build your application locally:
   ```bash
   npm run build
   npm run export
   ```
2. Upload the `out` folder to Netlify
3. Configure environment variables in Netlify dashboard
4. Set up continuous deployment from your Git repository

### 3. Railway

**Steps:**
1. Push code to GitHub
2. Connect Railway to your repository
3. Add environment variables
4. Deploy automatically

### 4. Heroku

**Steps:**
1. Install Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Account**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**: Choose a free tier cluster
3. **Create Database User**: Add username/password
4. **Whitelist IP**: Add your application's IP (or 0.0.0.0/0 for development)
5. **Get Connection String**: Copy the connection URI
6. **Update Environment**: Set `MONGODB_URI` to your connection string

### Local MongoDB (Development)

```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod

# Use in .env.local
MONGODB_URI=mongodb://localhost:27017/foodfly
```

## 💳 Payment Gateway Setup

### Razorpay Configuration

1. **Create Account**: Visit [Razorpay](https://razorpay.com)
2. **Get Credentials**:
   - Test Mode: Use for development
   - Live Mode: Use for production
3. **Configure Webhooks** (Optional):
   - URL: `https://your-domain.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`

### Environment Variables
```env
# Test Mode
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=test_secret_xxxxx

# Live Mode (Production)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=live_secret_xxxxx
```

## 🔒 Security Considerations

### JWT Secret
Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Admin Credentials
Change default admin credentials after deployment:
1. Login to admin panel
2. Go to settings
3. Update email and password
4. Or update directly in database

### Environment Variables
Never commit `.env.local` or `.env.production` files to Git.

## 🔧 Build Configuration

### Next.js Configuration
Update `next.config.js` for production:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker/containerized deployments
  images: {
    domains: ['your-image-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

### Package.json Scripts
Ensure you have these scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/foodfly
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 📊 Monitoring & Analytics

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user analytics

### Performance Monitoring
- Vercel Analytics (if using Vercel)
- New Relic
- DataDog

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Add deployment steps here
```

## 🆘 Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version (18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**Database Connection**
- Verify MongoDB URI
- Check network connectivity
- Ensure database user has proper permissions

**Environment Variables**
- Verify all required variables are set
- Check for typos in variable names
- Ensure no trailing spaces

**Payment Gateway**
- Verify Razorpay credentials
- Check webhook URLs
- Test with Razorpay's test mode first

### Getting Help
- Check application logs
- Monitor database connections
- Review payment gateway logs
- Test API endpoints individually

---

**Ready to deploy? 🚀**

Choose your hosting platform and follow the steps above. Remember to test thoroughly before going live! 