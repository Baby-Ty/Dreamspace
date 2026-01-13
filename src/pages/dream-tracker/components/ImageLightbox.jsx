// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

/**
 * ImageLightbox - Full-screen image viewer modal
 * Displays dream image with title and description overlay
 * @component
 */
export function ImageLightbox({ isOpen, imageUrl, title, description, onClose }) {
  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[150] animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Dream image full view"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-netsurit-coral transition-colors p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white z-10"
        aria-label="Close image view"
      >
        <X className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-contain rounded-2xl shadow-2xl"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-2xl">
          <h3 className="text-white font-bold text-lg sm:text-xl mb-1">{title}</h3>
          {description && (
            <p className="text-white/80 text-sm">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

ImageLightbox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  imageUrl: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

export default ImageLightbox;
