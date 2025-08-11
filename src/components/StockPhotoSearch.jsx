import React, { useState, useEffect } from 'react';
import { Search, Download, X, Loader2, Image } from 'lucide-react';

const StockPhotoSearch = ({ searchTerm = '', onSelectImage, onClose }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchTerm);
  const [error, setError] = useState('');

  // Real Unsplash API implementation
  const searchPhotos = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      
      if (!accessKey || accessKey === 'your_actual_access_key_here') {
        // Fallback to demo mode if no real API key is provided
        console.log('Using demo mode - add real Unsplash API key to use live search');
        const mockPhotos = getMockPhotos(searchQuery);
        await new Promise(resolve => setTimeout(resolve, 800));
        setPhotos(mockPhotos);
        return;
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

  // Mock photo data with real Unsplash images for demo
  const getMockPhotos = (query) => {
    const allPhotos = {
      // Travel related
      travel: [
        {
          id: '1',
          urls: { regular: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop' },
          alt_description: 'Beautiful mountain landscape',
          user: { name: 'Unsplash' }
        },
        {
          id: '2',
          urls: { regular: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop' },
          alt_description: 'Ocean sunset view',
          user: { name: 'Unsplash' }
        },
        {
          id: '3',
          urls: { regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
          alt_description: 'Mountain peak adventure',
          user: { name: 'Unsplash' }
        }
      ],
      // Learning related
      learning: [
        {
          id: '4',
          urls: { regular: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop' },
          alt_description: 'Books and learning',
          user: { name: 'Unsplash' }
        },
        {
          id: '5',
          urls: { regular: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop' },
          alt_description: 'People collaborating',
          user: { name: 'Unsplash' }
        },
        {
          id: '6',
          urls: { regular: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop' },
          alt_description: 'Laptop and study setup',
          user: { name: 'Unsplash' }
        }
      ],
      // Health/fitness related
      health: [
        {
          id: '7',
          urls: { regular: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
          alt_description: 'Running shoes on track',
          user: { name: 'Unsplash' }
        },
        {
          id: '8',
          urls: { regular: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop' },
          alt_description: 'Person running outdoors',
          user: { name: 'Unsplash' }
        },
        {
          id: '9',
          urls: { regular: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop' },
          alt_description: 'Yoga and wellness',
          user: { name: 'Unsplash' }
        }
      ],
      // Career related
      career: [
        {
          id: '10',
          urls: { regular: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
          alt_description: 'Professional workspace',
          user: { name: 'Unsplash' }
        },
        {
          id: '11',
          urls: { regular: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop' },
          alt_description: 'Business meeting',
          user: { name: 'Unsplash' }
        },
        {
          id: '12',
          urls: { regular: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop' },
          alt_description: 'Technology and innovation',
          user: { name: 'Unsplash' }
        }
      ],
      // Creative related
      creative: [
        {
          id: '13',
          urls: { regular: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop' },
          alt_description: 'Art supplies and creativity',
          user: { name: 'Unsplash' }
        },
        {
          id: '14',
          urls: { regular: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop' },
          alt_description: 'Music and instruments',
          user: { name: 'Unsplash' }
        },
        {
          id: '15',
          urls: { regular: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop' },
          alt_description: 'Creative workspace',
          user: { name: 'Unsplash' }
        }
      ]
    };

    // Match query to categories
    const lowerQuery = query.toLowerCase();
    let categoryPhotos = [];

    if (lowerQuery.includes('travel') || lowerQuery.includes('visit') || lowerQuery.includes('trip')) {
      categoryPhotos = allPhotos.travel;
    } else if (lowerQuery.includes('learn') || lowerQuery.includes('study') || lowerQuery.includes('language')) {
      categoryPhotos = allPhotos.learning;
    } else if (lowerQuery.includes('health') || lowerQuery.includes('fitness') || lowerQuery.includes('run') || lowerQuery.includes('marathon')) {
      categoryPhotos = allPhotos.health;
    } else if (lowerQuery.includes('career') || lowerQuery.includes('job') || lowerQuery.includes('work')) {
      categoryPhotos = allPhotos.career;
    } else if (lowerQuery.includes('creative') || lowerQuery.includes('art') || lowerQuery.includes('music')) {
      categoryPhotos = allPhotos.creative;
    } else {
      // Mix of popular photos for general searches
      categoryPhotos = [
        ...allPhotos.travel.slice(0, 2),
        ...allPhotos.learning.slice(0, 2),
        ...allPhotos.health.slice(0, 2),
        ...allPhotos.career.slice(0, 2),
        ...allPhotos.creative.slice(0, 2)
      ].slice(0, 12);
    }

    return categoryPhotos;
  };

  useEffect(() => {
    if (searchTerm) {
      searchPhotos(searchTerm);
    }
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchPhotos(query);
  };

  const handleSelectPhoto = (photo) => {
    onSelectImage(photo.urls.regular);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-dream-blue bg-opacity-10 rounded-lg">
              <Image className="w-6 h-6 text-dream-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Stock Photo Search</h2>
              <p className="text-sm text-gray-600">Find the perfect image for your dream</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images (e.g., travel, learning, fitness)..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dream-blue focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-dream-blue animate-spin mb-4" />
              <p className="text-gray-600">Searching for images...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <X className="w-12 h-12 mx-auto mb-2" />
                <p className="font-medium">{error}</p>
              </div>
              <button
                onClick={() => searchPhotos(query)}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && photos.length === 0 && query && (
            <div className="text-center py-12 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No images found. Try different keywords!</p>
            </div>
          )}

          {!loading && !error && photos.length === 0 && !query && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Search for images to get started!</p>
              <p className="text-sm mt-2">Try keywords like "travel", "learning", "fitness", etc.</p>
            </div>
          )}

          {!loading && !error && photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => handleSelectPhoto(photo)}
                >
                  <img
                    src={photo.urls.regular}
                    alt={photo.alt_description || 'Stock photo'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Download className="w-8 h-8 text-white mb-2 mx-auto" />
                      <p className="text-white text-sm font-medium">Select Image</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white text-xs">
                      Photo by {photo.user.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Images provided by{' '}
            <a 
              href="https://unsplash.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-dream-blue hover:underline"
            >
              Unsplash
            </a>{' '}
            - Beautiful, free photos
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockPhotoSearch;