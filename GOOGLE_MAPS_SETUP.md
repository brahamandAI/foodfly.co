# 🗺️ Google Maps Integration Setup Guide

Complete guide for setting up Google Maps integration in FoodFly.

## 📋 Overview

FoodFly uses Google Maps for:
- **Interactive Maps**: Real-time delivery tracking
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Places Search**: Find restaurants and locations
- **Route Calculation**: Calculate delivery routes
- **Location Services**: GPS integration and address management

## 🔑 Getting Google Maps API Key

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `FoodFly Maps`
4. Click **Create**

### Step 2: Enable Billing

**⚠️ Required for API usage**
1. Go to **Billing** in the left menu
2. Link a billing account to your project
3. Google provides $200 free credit monthly

### Step 3: Enable Required APIs

Enable these APIs in **APIs & Services** → **Library**:

#### **Core APIs (Required)**
- **Maps JavaScript API** - Interactive maps
- **Geocoding API** - Address lookup
- **Places API** - Place search and autocomplete

#### **Optional APIs**
- **Directions API** - Route calculation
- **Distance Matrix API** - Distance calculations
- **Geolocation API** - Device location

### Step 4: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key (starts with `AIza...`)

### Step 5: Secure Your API Key

**⚠️ Critical for security**

1. Click on your API key to edit
2. Set **Application restrictions**:
   ```
   HTTP referrers (web sites):
   http://localhost:3000/*
   https://your-domain.com/*
   https://*.vercel.app/*
   ```

3. Set **API restrictions**:
   ```
   Restrict key to these APIs:
   ✅ Maps JavaScript API
   ✅ Geocoding API
   ✅ Places API
   ✅ Directions API (if using)
   ```

## 🚀 Project Configuration

### 1. Environment Variables

Add to your `.env.local` file:

```env
# Google Maps Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza_your_actual_api_key_here
```

### 2. Production Deployment

For Vercel/Netlify, add the environment variable in your deployment platform dashboard.

### 3. Domain Restrictions

Update your API key restrictions to include your production domain:

```
https://your-app.vercel.app/*
https://your-custom-domain.com/*
```

## 🧪 Testing the Integration

### 1. Test API Key

Create a test page to verify your API key works:

```typescript
// pages/test-maps.tsx
import { useEffect } from 'react';
import { googleMapsService } from '@/lib/googleMapsService';

export default function TestMaps() {
  useEffect(() => {
    const testMaps = async () => {
      try {
        await googleMapsService.initialize();
        console.log('✅ Google Maps loaded successfully');
        
        // Test geocoding
        const result = await googleMapsService.geocode('Delhi, India');
        console.log('✅ Geocoding test:', result);
        
      } catch (error) {
        console.error('❌ Google Maps test failed:', error);
      }
    };
    
    testMaps();
  }, []);

  return <div>Check console for test results</div>;
}
```

### 2. Test Location Features

1. Open your app
2. Go to location selector
3. Click "Use Current Location"
4. Verify address is populated correctly

## 📊 API Usage & Costs

### Free Tier Limits (Monthly)
- **Maps JavaScript API**: 28,500 map loads
- **Geocoding API**: 2,500 requests
- **Places API**: 1,000 requests
- **Directions API**: 2,500 requests

### Cost Estimation for FoodFly
- **Small app** (< 1,000 users): $0-50/month
- **Medium app** (1,000-10,000 users): $50-200/month
- **Large app** (> 10,000 users): $200+/month

### Cost Optimization Tips
1. **Cache geocoding results** in your database
2. **Use session storage** for repeated lookups
3. **Implement request throttling**
4. **Monitor usage** in Google Cloud Console

## 🔧 Advanced Configuration

### 1. Custom Map Styling

Update `src/hooks/useGoogleMaps.ts`:

```typescript
const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  }
];

// Add to map options
const defaultOptions: google.maps.MapOptions = {
  styles: mapStyles,
  // ... other options
};
```

### 2. Geocoding with Bounds

```typescript
// Restrict geocoding to specific region
const result = await googleMapsService.geocode('Delhi', {
  bounds: {
    north: 28.9,
    south: 28.4,
    east: 77.3,
    west: 77.0
  }
});
```

### 3. Places Autocomplete

```typescript
// Add to LocationSelector component
const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

useEffect(() => {
  if (google && inputRef.current) {
    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'IN' }
    });
    setAutocomplete(autocompleteInstance);
  }
}, [google]);
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Google Maps API key is not configured"
- Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
- Verify the key is correct and not empty
- Restart development server

#### 2. "This API project is not authorized"
- Enable the required APIs in Google Cloud Console
- Check billing is enabled
- Verify API key restrictions

#### 3. "RefererNotAllowedMapError"
- Update HTTP referrer restrictions in API key settings
- Add your domain to allowed referrers
- Include `localhost:3000/*` for development

#### 4. "QuotaExceededError"
- Check usage in Google Cloud Console
- Implement request caching
- Consider upgrading billing plan

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Google Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...');
    console.log('Google Maps Service Configured:', googleMapsService.isConfigured());
  }
}, []);
```

## 📱 Mobile Considerations

### 1. Responsive Maps
```css
.map-container {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .map-container {
    height: 250px;
  }
}
```

### 2. Touch Interactions
```typescript
const mapOptions: google.maps.MapOptions = {
  gestureHandling: 'cooperative',
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false
};
```

## 🔒 Security Best Practices

1. **Never expose API key in client-side code** (already handled with `NEXT_PUBLIC_` prefix)
2. **Use HTTP referrer restrictions**
3. **Restrict APIs to only what you need**
4. **Monitor usage regularly**
5. **Set up billing alerts**

## 📈 Monitoring & Analytics

### 1. Google Cloud Console
- Monitor API usage
- Set up billing alerts
- View error rates

### 2. Application Monitoring
```typescript
// Add to your error handling
const logMapError = (error: Error, context: string) => {
  console.error(`Google Maps Error [${context}]:`, error);
  // Send to your error tracking service
};
```

## 🎯 Next Steps

1. ✅ Get Google Maps API key
2. ✅ Configure environment variables
3. ✅ Test basic functionality
4. 🔄 Implement advanced features
5. 🔄 Add monitoring and analytics
6. 🔄 Optimize for performance

---

**Need help?** Check the [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript) or create an issue in the project repository. 