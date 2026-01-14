const Jimp = require('jimp');

/**
 * Compress image to target size using Jimp (pure JavaScript, works everywhere)
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
  
  try {
    // Load image with Jimp
    const image = await Jimp.read(imageBuffer);
    
    // Resize if wider than maxWidth (maintain aspect ratio)
    if (image.getWidth() > maxWidth) {
      image.resize(maxWidth, Jimp.AUTO);
    }
    
    // Try different quality levels to hit target size
    let quality = initialQuality;
    let compressed = await image.quality(quality).getBufferAsync(Jimp.MIME_JPEG);
    
    // Reduce quality iteratively if still too large
    while (compressed.length > targetBytes && quality > minQuality) {
      quality -= 5;
      compressed = await image.quality(quality).getBufferAsync(Jimp.MIME_JPEG);
    }
    
    console.log(`Jimp compression: ${(imageBuffer.length / 1024).toFixed(0)}KB -> ${(compressed.length / 1024).toFixed(0)}KB (quality: ${quality})`);
    
    return {
      buffer: compressed,
      contentType: 'image/jpeg',
      originalSize: imageBuffer.length,
      compressedSize: compressed.length,
      quality
    };
  } catch (error) {
    // Fallback: return original if compression fails
    console.error('Image compression failed:', error.message);
    return {
      buffer: imageBuffer,
      contentType: 'image/png',
      originalSize: imageBuffer.length,
      compressedSize: imageBuffer.length,
      quality: null,
      error: error.message
    };
  }
}

module.exports = { compressImage };
