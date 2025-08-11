# Unsplash API Setup

## For Production Use

To use the real Unsplash API in production, follow these steps:

### 1. Get Unsplash API Access Key
1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Get your Access Key

### 2. Environment Variables
Create a `.env` file in your project root:

```
VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
```

### 3. Update StockPhotoSearch Component

Replace the mock API call with the real one:

```javascript
const searchPhotos = async (searchQuery) => {
  if (!searchQuery.trim()) return;

  setLoading(true);
  setError('');

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12&client_id=${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    
    const data = await response.json();
    setPhotos(data.results);
  } catch (err) {
    setError('Failed to search images. Please try again.');
    console.error('Photo search error:', err);
  } finally {
    setLoading(false);
  }
};
```

### 4. Current Demo Implementation

The current implementation uses curated mock images for demonstration purposes. The search functionality works by matching keywords to predefined categories:

- **Travel keywords**: "travel", "visit", "trip" → Travel images
- **Learning keywords**: "learn", "study", "language" → Learning images  
- **Health keywords**: "health", "fitness", "run", "marathon" → Health images
- **Career keywords**: "career", "job", "work" → Career images
- **Creative keywords**: "creative", "art", "music" → Creative images

### 5. Rate Limits

Unsplash free tier allows:
- 50 requests per hour per IP
- 5,000 requests per month per application

For production apps with more traffic, consider upgrading to a paid plan.

### 6. Attribution

Always provide proper attribution to Unsplash and photographers as shown in the component footer.