import { X, Upload, Search, Image, Sparkles } from 'lucide-react';

/**
 * Image upload section with multiple upload options
 * Supports file upload, stock photo search, and AI generation
 */
export default function ImageUploadSection({
  image,
  uploadingImage,
  onImageUpload,
  onRemoveImage,
  onOpenStockPhotoSearch,
  onOpenAIImageGenerator
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        {uploadingImage ? (
          <div 
            className="w-full h-32 bg-professional-gray-100 rounded-lg flex flex-col items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-netsurit-red mb-2" aria-hidden="true"></div>
            <p className="text-sm text-professional-gray-600">Uploading image...</p>
          </div>
        ) : image ? (
          <img
            src={image}
            alt="Dream preview"
            className="w-full h-32 object-cover rounded-lg"
            data-testid="dream-image-preview"
          />
        ) : (
          <div className="w-full h-32 bg-professional-gray-200 rounded-lg flex flex-col items-center justify-center">
            <Image className="w-8 h-8 text-professional-gray-400 mb-2" aria-hidden="true" />
            <p className="text-sm text-professional-gray-500">No image selected</p>
          </div>
        )}
        
        {image && !uploadingImage && (
          <button
            type="button"
            onClick={onRemoveImage}
            title="Remove image"
            aria-label="Remove image"
            data-testid="remove-image-button"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-netsurit-red"
          >
            <X className="w-4 h-4 text-professional-gray-700" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Image Upload Options */}
      <div className="grid grid-cols-3 gap-2">
        <label className={`btn-secondary cursor-pointer flex items-center justify-center space-x-2 py-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm">Upload File</span>
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            disabled={uploadingImage}
            aria-label="Upload image file"
            data-testid="upload-image-input"
          />
        </label>
        
        <button
          type="button"
          onClick={onOpenStockPhotoSearch}
          disabled={uploadingImage}
          aria-label="Search stock photos"
          data-testid="stock-photo-button"
          className={`btn-secondary flex items-center justify-center space-x-2 py-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm">Stock Photos</span>
        </button>

        <button
          type="button"
          onClick={onOpenAIImageGenerator}
          disabled={uploadingImage}
          aria-label="Generate AI image"
          data-testid="ai-image-generator-button"
          className={`btn-secondary flex items-center justify-center space-x-2 py-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm">Generate AI</span>
        </button>
      </div>
    </div>
  );
}
