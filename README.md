# 🍕 FoodFly - Modern Food Delivery Application

A comprehensive Next.js food delivery application with complete user and admin functionality, built for modern web deployment.

## 🌟 Features

### 🛍️ User Features
- **Complete Order Flow**: Browse menu → Add to cart → Checkout → Order tracking
- **Smart Cart Management**: Persistent cart with real-time updates
- **Multiple Payment Options**: Cash on Delivery, Online payments via Razorpay
- **Address Management**: Save multiple delivery addresses
- **Order History**: Track all past orders with status updates
- **Voice Assistant**: AI-powered voice commands for hands-free ordering
- **Smart Recommendations**: Personalized food suggestions

### 👨‍💼 Admin Features
- **Order Management**: View and update order status in real-time
- **Dashboard Analytics**: Overview of orders, revenue, and system metrics
- **User Management**: Monitor user activity and support

### 🔧 Technical Features
- **Unified Architecture**: Single Next.js application with API routes
- **JWT Authentication**: Secure user and admin authentication
- **Real-time Notifications**: Toast notifications and status updates
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **TypeScript**: Full type safety across the application
- **Local Storage Integration**: Offline cart persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- MongoDB database (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/foodfly-frontend-modified.git
   cd foodfly-frontend-modified
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/foodfly
   
   # JWT Secret (Generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Razorpay Configuration (Get from https://razorpay.com)
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Application URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3003
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - **User Interface**: http://localhost:3003
- **Admin Panel**: http://localhost:3003/admin
- **API Health Check**: http://localhost:3003/api/test

## 🔐 Authentication & Security

### Default Admin Credentials
For initial setup and testing:
- **Email**: `admin@foodfly.com`
- **Password**: `password`

> ⚠️ **Important**: Change these credentials before deploying to production!

## 💳 Payment Integration

### Razorpay Setup
1. Create account at [Razorpay](https://razorpay.com)
2. Get your Key ID and Key Secret from the dashboard
3. Add them to your `.env.local` file
4. Test with Razorpay's test credentials before going live

### Supported Payment Methods
- **Cash on Delivery (COD)**
- **Credit/Debit Cards**
- **Net Banking**
- **UPI Payments**

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on each push

### Environment Variables for Production
```env
# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodfly

# JWT Secret (Use a strong, unique secret)
JWT_SECRET=your-production-jwt-secret

# Razorpay (Use live credentials)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_live_secret

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📱 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/admin/login         # Admin login
```

### User Management
```
GET  /api/users/profile       # Get user profile
PUT  /api/users/profile       # Update user profile
GET  /api/users/addresses     # Get user addresses
POST /api/users/addresses     # Add new address
```

### Cart & Orders
```
GET    /api/cart              # Get user cart
POST   /api/cart              # Add item to cart
PUT    /api/cart/items/[id]   # Update cart item
DELETE /api/cart/items/[id]   # Remove cart item

GET  /api/orders              # Get user orders
POST /api/orders              # Create new order
```

### Admin Endpoints
```
GET /api/admin/orders         # Get all orders (admin only)
PUT /api/admin/orders         # Update order status (admin only)
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🆘 Support

### Common Issues

**Double Notifications**: Fixed in latest version by removing duplicate toast systems.

**Cart Items Showing as "Unknown"**: Ensure proper localStorage structure and item data format.

**Admin Login Issues**: Verify admin credentials and JWT secret configuration.

**Payment Failures**: Check Razorpay credentials and test with their sandbox environment first.

### Getting Help
- Create a new issue with detailed description
- Include error messages and browser console logs

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Razorpay for payment gateway integration

---

**Happy Coding! 🚀**

Made with ❤️ for food lovers everywhere. 