// Lazy load Sharp to handle environments where native binaries may not work
let sharp = null;
let sharpLoadError = null;

function loadSharp() {
  if (sharp !== null || sharpLoadError !== null) {
    return sharp;
  }
  try {
    sharp = require('sharp');
    console.log('Sharp loaded successfully');
  } catch (error) {
    sharpLoadError = error;
    console.error('Sharp failed to load:', error.message);
  }
  return sharp;
}

/**
 * Compress image to target size using Sharp
 * Falls back to returning original image if Sharp is unavailable
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeKB - Target max size in KB (default: 300)
 * @param {number} options.maxWidth - Max width in pixels (default: 1024)
 * @param {number} options.initialQuality - Starting quality (default: 85)
 * @param {number} options.minQuality - Minimum quality floor (default: 65)
 * @returns {Promise<{buffer: Buffer, contentType: string, originalSize: number, compressedSize: number, quality: number|null, error?: string}>}
 */
async function compressImage(imageBuffer, options = {}) {
  const { 
    maxSizeKB = 300, 
    maxWidth = 1024,
    initialQuality = 85,
    minQuality = 65
  } = options;
  
  const targetBytes = maxSizeKB * 1024;
  
  // Try to load Sharp - if it fails, return original image
  const sharpLib = loadSharp();
  if (!sharpLib) {
    console.warn('Sharp unavailable, skipping compression. Error:', sharpLoadError?.message);
    return {
      buffer: imageBuffer,
      contentType: 'image/png',
      originalSize: imageBuffer.length,
      compressedSize: imageBuffer.length,
      quality: null,
      error: 'Sharp not available in this environment'
    };
  }
  
  try {
    let quality = initialQuality;
    let compressed = await sharpLib(imageBuffer)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    
    // Reduce quality iteratively if still too large, but maintain minimum quality
    while (compressed.length > targetBytes && quality > minQuality) {
      quality -= 5;  // Smaller steps for better quality control
      compressed = await sharpLib(imageBuffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    }
    
    // If still too large at min quality, accept it (quality > file size)
    // This ensures we don't sacrifice too much visual quality
    
    return {
      buffer: compressed,
      contentType: 'image/webp',
      originalSize: imageBuffer.length,
      compressedSize: compressed.length,
      quality
    };
  } catch (error) {
    // Fallback: return original if compression fails
    console.error('Image compression failed:', error.message);
    return {
      buffer: imageBuffer,
      contentType: 'image/png', // Keep original format on failure
      originalSize: imageBuffer.length,
      compressedSize: imageBuffer.length,
      quality: null,
      error: error.message
    };
  }
}

module.exports = { compressImage };
