# 🖼️ Unsplash API Setup Guide

## Step 1: Get Your Unsplash Access Key

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Click "Register as a developer" (if not already registered)
3. Click "New Application"
4. Accept the terms and create your application
5. Copy your **Access Key** (not the Secret Key)

## Step 2: Create Environment File

Create a file named `.env` in your project root (same level as `package.json`) with this content:

```bash
# Unsplash API Configuration
VITE_UNSPLASH_ACCESS_KEY=YOUR_ACTUAL_ACCESS_KEY_HERE
```

**Replace `YOUR_ACTUAL_ACCESS_KEY_HERE` with your actual Unsplash access key.**

## Step 3: Update .gitignore (if needed)

Make sure your `.gitignore` file includes:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Step 4: Restart Development Server

After creating the `.env` file, restart your development server:
```bash
npm run dev
```

## Step 5: Enable Real Unsplash API

The stock photo search is currently using mock data for demo purposes. To enable the real Unsplash API, you'll need to update the `StockPhotoSearch.jsx` component.

### Current Demo Status
✅ **Demo Mode Active**: Uses curated sample images  
⚠️ **Real API**: Requires setup steps above

### File to Update: `src/components/StockPhotoSearch.jsx`

Replace the mock `searchPhotos` function with:

```javascript
const searchPhotos = async (searchQuery) => {
  if (!searchQuery.trim()) return;

  setLoading(true);
  setError('');

  try {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      throw new Error('Unsplash access key not configured');
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12&client_id=${accessKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    setPhotos(data.results || []);
  } catch (err) {
    setError('Failed to search images. Please try again.');
    console.error('Photo search error:', err);
  } finally {
    setLoading(false);
  }
};
```

## Rate Limits

**Unsplash Free Tier:**
- 50 requests per hour per IP
- 5,000 requests per month per application

**For Production:**
- Consider upgrading to paid plan for higher limits
- Implement request caching
- Add request queuing if needed

## Testing Your Setup

1. Create the `.env` file with your access key
2. Restart the dev server
3. Go to Dream Book page
4. Click "Add Dream" 
5. Click "Stock Photos" button
6. Search should now return real Unsplash results!

## Troubleshooting

**Common Issues:**
- **"Access key not configured"**: Make sure `.env` file exists and has correct format
- **"HTTP error! status: 401"**: Double-check your access key is correct
- **"HTTP error! status: 403"**: You may have exceeded rate limits
- **No results**: Try different search terms

**Need Help?**
- Check the browser console for error messages
- Verify your access key works by testing it directly in Unsplash API docs
- Make sure you're using the Access Key (not Secret Key)