// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';

/**
 * useImageUpload - Reusable hook for image upload with validation
 * 
 * Consolidates repeated image upload logic across the application
 * 
 * Usage:
 *   const { upload, uploading, error } = useImageUpload(itemService.uploadDreamPicture);
 *   
 *   const handleFileSelect = async (file) => {
 *     const result = await upload(file, userId, dreamId);
 *     if (result.success) {
 *       setImageUrl(result.data.url);
 *     }
 *   };
 * 
 * @param {function} uploadFn - Upload function to call (receives file + additional args)
 * @param {object} options - Configuration options
 * @returns {object} Upload state and handler
 */
export function useImageUpload(uploadFn, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    onSuccess = null,
    onError = null
  } = options;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {string|null} Error message or null if valid
   */
  const validateFile = useCallback((file) => {
    if (!file) {
      return 'No file selected';
    }

    // Check file type
    if (!allowedTypes.some(type => file.type === type || file.type.startsWith(type.split('/')[0]))) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Image size must be less than ${maxSizeMB}MB`;
    }

    return null; // Valid
  }, [maxSizeMB, allowedTypes]);

  /**
   * Upload image with validation
   * @param {File} file - File to upload
   * @param {...any} args - Additional arguments to pass to upload function
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const upload = useCallback(async (file, ...args) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (onError) {
        onError(validationError);
      }
      return { success: false, error: validationError };
    }

    // Reset state
    setError(null);
    setProgress(0);
    setUploading(true);

    try {
      // Call upload function
      const result = await uploadFn(file, ...args);

      // Handle result
      if (result.success) {
        console.log('✅ Image uploaded successfully');
        setProgress(100);
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result;
      } else {
        const errorMsg = result.error?.message || result.error || 'Failed to upload image';
        console.error('❌ Image upload failed:', errorMsg);
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to upload image. Please try again.';
      console.error('❌ Image upload error:', err);
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
    }
  }, [uploadFn, validateFile, onSuccess, onError]);

  /**
   * Handle file input change event
   * @param {Event} event - File input change event
   * @param {...any} args - Additional arguments to pass to upload function
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const handleFileChange = useCallback(async (event, ...args) => {
    const file = event.target?.files?.[0];
    if (file) {
      return await upload(file, ...args);
    }
    return { success: false, error: 'No file selected' };
  }, [upload]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setUploading(false);
    setError(null);
    setProgress(0);
  }, []);

  return {
    upload,
    handleFileChange,
    uploading,
    error,
    progress,
    clearError,
    reset
  };
}

/**
 * useImageUploadFromUrl - Upload image from URL (e.g., DALL-E generated images)
 * 
 * Usage:
 *   const { uploadFromUrl, uploading } = useImageUploadFromUrl(itemService.uploadDreamPictureFromUrl);
 *   
 *   const result = await uploadFromUrl(imageUrl, userId, dreamId);
 * 
 * @param {function} uploadFn - Upload function that accepts URL + additional args
 * @param {object} options - Configuration options
 * @returns {object} Upload state and handler
 */
export function useImageUploadFromUrl(uploadFn, options = {}) {
  const {
    onSuccess = null,
    onError = null
  } = options;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Upload image from URL
   * @param {string} imageUrl - URL of image to upload
   * @param {...any} args - Additional arguments to pass to upload function
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const uploadFromUrl = useCallback(async (imageUrl, ...args) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      const errorMsg = 'Invalid image URL';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    setError(null);
    setUploading(true);

    try {
      const result = await uploadFn(imageUrl, ...args);

      if (result.success) {
        console.log('✅ Image uploaded from URL successfully');
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result;
      } else {
        const errorMsg = result.error?.message || result.error || 'Failed to upload image';
        console.error('❌ Image upload from URL failed:', errorMsg);
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to upload image. Please try again.';
      console.error('❌ Image upload from URL error:', err);
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
    }
  }, [uploadFn, onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadFromUrl,
    uploading,
    error,
    clearError
  };
}

export default useImageUpload;
