# 🚚 FoodFly Delivery Testing Guide

## 📋 Prerequisites

### 1. Google Maps API Setup
```bash
# Add to your .env.local file
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

**Required Google Maps APIs:**
- Maps JavaScript API
- Geocoding API
- Places API
- Directions API

### 2. MongoDB Connection
Ensure your MongoDB is running and connected.

### 3. Authentication Setup
Make sure you have test users with different roles:
- Customer (regular user)
- Delivery Partner
- Admin

---

## 🧪 Testing Steps

### **Step 1: Demo Mode Testing (No Registration Required)**

1. **Navigate to Demo Page:**
   ```
   http://localhost:3000/demo-delivery
   ```

2. **Test GPS Functionality:**
   - Click "🚀 Start Demo Tracking"
   - Allow location permission when prompted
   - Verify coordinates are displayed
   - Check accuracy and speed readings
   - Click "🛑 Stop Demo Tracking"

3. **Expected Results:**
   - ✅ Location coordinates displayed
   - ✅ Accuracy within 10-50 meters
   - ✅ Speed calculation (if moving)
   - ✅ Real-time updates every 5 seconds
   - ✅ No data sent to server (demo mode)

### **Step 2: Real Delivery Partner Testing**

1. **Register as Delivery Partner:**
   ```
   http://localhost:3000/register-delivery
   ```

2. **Login as Delivery Partner:**
   ```
   http://localhost:3000/login?role=delivery
   ```

3. **Access Delivery Dashboard:**
   - Navigate to delivery partner dashboard
   - Find the DeliveryTracker component
   - Start real tracking

4. **Test Real Tracking:**
   - Click "🚀 Start Delivery"
   - Verify location updates are sent to server
   - Check MongoDB for `DeliveryLocation` entries
   - Stop tracking when complete

### **Step 3: Customer Tracking Testing**

1. **Create a Test Order:**
   - Place an order through the main app
   - Note the order ID

2. **Test Customer Tracking:**
   ```
   http://localhost:3000/track-order/[ORDER_ID]
   ```

3. **Use LiveDeliveryTracking Component:**
   - Verify map loads with Google Maps
   - Check delivery partner location
   - Verify ETA calculations
   - Test auto-refresh functionality

### **Step 4: API Endpoint Testing**

#### **A. Location Update API**
```bash
# POST /api/delivery/[deliveryId]/location
curl -X POST http://localhost:3000/api/delivery/test_delivery_123/location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 15,
    "speed": 5.5,
    "heading": 90
  }'
```

#### **B. Customer Tracking API**
```bash
# GET /api/delivery/customer-tracking/[orderId]
curl http://localhost:3000/api/delivery/customer-tracking/ORDER_ID_123
```

#### **C. Live Locations API (Admin)**
```bash
# GET /api/delivery/live-locations
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/delivery/live-locations
```

### **Step 5: Google Maps Integration Testing**

1. **Check API Key Loading:**
   - Open browser console
   - Verify no errors about Google Maps API
   - Check if `window.google` is available

2. **Test Map Rendering:**
   - Navigate to any page with maps
   - Verify map loads correctly
   - Test zoom and pan functionality

3. **Test Markers and Routes:**
   - Verify delivery partner marker appears
   - Check delivery address marker
   - Test route visualization (if available)

---

## 🔍 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **1. Google Maps Not Loading**
```javascript
// Check in browser console
console.log(window.google); // Should return Google Maps object
```

**Solutions:**
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check API key has correct permissions
- Ensure billing is enabled on Google Cloud

#### **2. Location Permission Denied**
```javascript
// Check permission status
navigator.permissions.query({ name: 'geolocation' })
  .then(result => console.log(result.state));
```

**Solutions:**
- Clear browser location permissions
- Use HTTPS (required for geolocation)
- Test in incognito mode

#### **3. MongoDB Connection Issues**
```javascript
// Check database connection
// Look for connection errors in server logs
```

**Solutions:**
- Verify MongoDB is running
- Check connection string in environment
- Ensure network connectivity

#### **4. Authentication Errors**
```javascript
// Check token validity
localStorage.getItem('token'); // Should return valid JWT
```

**Solutions:**
- Login again to get fresh token
- Check token expiration
- Verify user role permissions

---

## 📊 **Expected Data Flow**

### **1. Delivery Partner Flow:**
```
User Login → Start Tracking → GPS Location → API Call → MongoDB Storage
```

### **2. Customer Flow:**
```
Order Placed → Delivery Assigned → Customer Views Map → Real-time Updates
```

### **3. Admin Flow:**
```
Admin Login → View All Live Deliveries → Monitor Locations → Manage Assignments
```

---

## 🎯 **Success Criteria**

### **✅ Demo Mode:**
- [ ] GPS coordinates captured
- [ ] No server communication (demo only)
- [ ] Real-time updates displayed
- [ ] Start/Stop functionality works

### **✅ Real Tracking:**
- [ ] Location updates sent to server
- [ ] MongoDB entries created
- [ ] Authentication working
- [ ] Real-time customer tracking

### **✅ Google Maps:**
- [ ] Maps load without errors
- [ ] Markers display correctly
- [ ] Routes render properly
- [ ] Auto-refresh works

### **✅ API Endpoints:**
- [ ] Location updates accepted
- [ ] Customer tracking returns data
- [ ] Admin can view all deliveries
- [ ] Error handling works

---

## 🚀 **Quick Test Commands**

```bash
# Start development server
npm run dev

# Test demo delivery
open http://localhost:3000/demo-delivery

# Test real delivery (after registration)
open http://localhost:3000/delivery

# Test customer tracking
open http://localhost:3000/track-order/[ORDER_ID]

# Check API endpoints
curl http://localhost:3000/api/delivery/live-locations
```

---

## 📱 **Mobile Testing**

### **iOS Safari:**
- Location services must be enabled
- HTTPS required for geolocation
- Test in Safari (not Chrome/Firefox)

### **Android Chrome:**
- Location permission must be granted
- High accuracy mode recommended
- Test with actual movement

### **Desktop Testing:**
- Use browser dev tools to simulate location
- Test with different network conditions
- Verify cross-browser compatibility

---

## 🔧 **Advanced Testing**

### **Load Testing:**
```bash
# Simulate multiple delivery partners
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/delivery/delivery_$i/location \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"latitude": 28.6139, "longitude": 77.2090}'
done
```

### **Error Simulation:**
- Disconnect internet during tracking
- Revoke location permissions
- Use invalid API keys
- Test with expired tokens

---

## 📞 **Support**

If you encounter issues:

1. **Check browser console** for JavaScript errors
2. **Check server logs** for API errors
3. **Verify environment variables** are set correctly
4. **Test with different browsers** and devices
5. **Check MongoDB** for data consistency

---

**🎉 Happy Testing! Your delivery mechanism should now be fully functional with live location tracking and Google Maps integration.** 