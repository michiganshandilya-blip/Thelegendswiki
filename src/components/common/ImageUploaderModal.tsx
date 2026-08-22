import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArticleImageFigure } from '../../types';
import { PRESET_ENCYCLOPEDIA_IMAGES, PresetImageItem } from '../../data/presetImages';
import { isValidUrl, validateImageAlt } from '../../lib/validation';
import { fastCompressImage, validateImageUpload } from '../../services/storageService';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  X,
  Check,
  AlertCircle,
  ShieldAlert,
  Info,
  Layers,
  Eye,
} from 'lucide-react';

interface ImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: {
    url: string;
    caption: string;
    alt: string;
    credit: string;
    align?: 'right' | 'left' | 'center' | 'full';
  }) => void;
  initialData?: {
    url?: string;
    caption?: string;
    alt?: string;
    credit?: string;
    align?: 'right' | 'left' | 'center' | 'full';
  };
  title?: string;
  allowAlignment?: boolean;
}

export const ImageUploaderModal: React.FC<ImageUploaderModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialData,
  title = 'Attach & Manage Article Image',
  allowAlignment = false,
}) => {
  const { isAuthenticated, isGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('presets');
  const [imageUrl, setImageUrl] = useState<string>(initialData?.url || '');
  const [caption, setCaption] = useState<string>(initialData?.caption || '');
  const [alt, setAlt] = useState<string>(initialData?.alt || '');
  const [credit, setCredit] = useState<string>(initialData?.credit || '');
  const [align, setAlign] = useState<'right' | 'left' | 'center' | 'full'>(
    initialData?.align || 'right'
  );

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key press for keyboard accessibility
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setUploadError(null);

    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setIsProcessingFile(true);
      const { dataUrl } = await fastCompressImage(file, 1200, 0.85);
      setImageUrl(dataUrl);

      if (!alt) {
        // Suggested starter alt text based on file name
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setAlt(`Illustration depicting ${cleanName}`);
      }
      if (!credit) {
        setCredit('Author Contributed Upload');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image file. Please try another image.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle preset selection
  const handleSelectPreset = (preset: PresetImageItem) => {
    setImageUrl(preset.url);
    setCaption(preset.caption);
    setAlt(preset.alt);
    setCredit(preset.credit);
    setUploadError(null);
  };

  // Validation
  const altValidation = validateImageAlt(alt);
  const isUrlValid = imageUrl.trim().length > 0 && (imageUrl.startsWith('data:image/') || isValidUrl(imageUrl));
  const isFormValid = isUrlValid && altValidation.isValid;

  const handleApply = () => {
    if (!isFormValid) {
      if (!isUrlValid) {
        setUploadError('Please select, upload, or specify a valid image URL.');
      } else if (!altValidation.isValid) {
        setUploadError(altValidation.message || 'Please provide a descriptive alternative text.');
      }
      return;
    }

    onSelect({
      url: imageUrl.trim(),
      caption: caption.trim(),
      alt: alt.trim(),
      credit: credit.trim(),
      align: allowAlignment ? align : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f8f9fa] border-b border-[#eaecf0]">
          <div className="flex items-center gap-2">
            <ImageIcon size={17} className="text-[#3366cc]" />
            <h2 id="image-modal-title" className="text-sm sm:text-base font-bold text-[#101418] font-serif">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#72777d] hover:text-[#101418] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Guest clearance restriction alert if applicable */}
          {isGuest && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 flex items-center gap-2.5">
              <ShieldAlert size={16} className="text-amber-700 shrink-0" />
              <span>
                You are currently browsing as a Guest. Sign in with a Contributor or Editor account to upload and modify article assets.
              </span>
            </div>
          )}

          {/* Source Tabs */}
          <div className="flex border-b border-[#eaecf0] gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'border-[#3366cc] text-[#3366cc] bg-blue-50/50'
                  : 'border-transparent text-[#54595d] hover:text-[#101418]'
              }`}
            >
              <Sparkles size={13} />
              <span>Curated Archival Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              disabled={isGuest}
              className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-[#3366cc] text-[#3366cc] bg-blue-50/50'
                  : 'border-transparent text-[#54595d] hover:text-[#101418] disabled:opacity-40'
              }`}
            >
              <Upload size={13} />
              <span>Upload Local Image</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'border-[#3366cc] text-[#3366cc] bg-blue-50/50'
                  : 'border-transparent text-[#54595d] hover:text-[#101418]'
              }`}
            >
              <LinkIcon size={13} />
              <span>Direct URL Reference</span>
            </button>
          </div>

          {/* Tab 1: Presets Gallery */}
          {activeTab === 'presets' && (
            <div className="space-y-2.5">
              <p className="text-xs text-[#54595d]">
                Select from verified open-access historical, scientific, and cultural archival images:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#eaecf0] rounded-sm bg-[#f8f9fa]">
                {PRESET_ENCYCLOPEDIA_IMAGES.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`group relative text-left border rounded-xs p-1.5 bg-[#ffffff] transition-all cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'border-[#3366cc] ring-2 ring-blue-300'
                          : 'border-[#cbd5e1] hover:border-[#3366cc]'
                      }`}
                    >
                      <div className="aspect-4/3 bg-[#eaecf0] rounded-xs overflow-hidden mb-1 relative">
                        <img
                          src={preset.thumbnailUrl}
                          alt={preset.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#3366cc] text-white p-0.5 rounded-full shadow-xs">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-[11px] text-[#101418] line-clamp-1">
                        {preset.title}
                      </div>
                      <div className="text-[9px] font-mono text-[#72777d] truncate">
                        {preset.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#cbd5e1] hover:border-[#3366cc] rounded-sm p-6 text-center bg-[#f8f9fa] hover:bg-blue-50/20 cursor-pointer transition-all space-y-2"
              >
                <Upload size={28} className="mx-auto text-[#3366cc]" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-[#101418]">
                    Click to browse or drag and drop an image file
                  </p>
                  <p className="text-[11px] text-[#72777d]">
                    Supports PNG, JPEG, WebP, GIF, SVG (Up to 4.5 MB)
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                />
              </div>

              {isProcessingFile && (
                <div className="text-xs text-[#3366cc] flex items-center justify-center gap-2 py-2 font-mono">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-blue-700 animate-spin" />
                  <span>Processing and optimizing image asset...</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase text-[#54595d] font-bold">
                Image Web URL (HTTPS)
              </label>
              <input
                type="url"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setUploadError(null);
                }}
                placeholder="https://images.unsplash.com/... or Wikimedia Commons image link"
                className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-mono"
              />
              <p className="text-[10px] text-[#72777d]">
                Enter a direct, public image link accessible to all readers.
              </p>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-sm text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Selected Image Preview & Metadata Form */}
          {imageUrl && (
            <div className="pt-3 border-t border-[#eaecf0] space-y-3">
              <div className="flex gap-3 items-start bg-[#f8f9fa] border border-[#eaecf0] p-3 rounded-sm">
                <div className="w-28 h-20 bg-[#ffffff] border border-[#cbd5e1] rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={alt || 'Image preview'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#3366cc] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-xs">
                      Asset Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setCaption('');
                        setAlt('');
                        setCredit('');
                      }}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer font-mono"
                    >
                      Clear Image
                    </button>
                  </div>
                  <p className="text-[11px] text-[#54595d] font-sans truncate">
                    {imageUrl.startsWith('data:') ? 'Local file uploaded' : imageUrl}
                  </p>
                </div>
              </div>

              {/* Accessible Alt Text Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#54595d] font-bold mb-1 flex items-center justify-between">
                  <span>
                    Alternative Text (Accessibility) <strong className="text-red-500">*</strong>
                  </span>
                  {alt && (
                    <span
                      className={`text-[10px] font-mono ${
                        altValidation.isValid ? 'text-emerald-700 font-semibold' : 'text-amber-700'
                      }`}
                    >
                      {altValidation.isValid ? '✓ Descriptive' : '! Check description'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="e.g. Marble bust of Aristotle facing forward with scholarly robes"
                  className={`w-full bg-[#ffffff] border ${
                    !altValidation.isValid && alt.length > 0
                      ? 'border-amber-500'
                      : 'border-[#a2a9b1] focus:border-[#3366cc]'
                  } rounded-sm px-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none`}
                />
                {!altValidation.isValid && alt.length > 0 && (
                  <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-sans">
                    <Info size={11} /> {altValidation.message}
                  </p>
                )}
                <p className="text-[10px] text-[#72777d] mt-1 font-sans">
                  Screen readers read this text aloud for visually impaired scholars. Avoid generic names like "image1" or "photo".
                </p>
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#54595d] font-bold mb-1">
                  Visible Image Caption
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. The Mouseion complex as envisioned in 19th-century academic reconstructions."
                  className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-sans"
                />
              </div>

              {/* Credit / Source Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#54595d] font-bold mb-1">
                    Image Source / Provenance Credit
                  </label>
                  <input
                    type="text"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    placeholder="e.g. Library of Congress / Public Domain"
                    className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-sans"
                  />
                </div>

                {/* Section Figure Alignment (if enabled) */}
                {allowAlignment && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#54595d] font-bold mb-1">
                      Figure Alignment in Section
                    </label>
                    <select
                      value={align}
                      onChange={(e) => setAlign(e.target.value as any)}
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none"
                    >
                      <option value="right">Right Floating Thumbnail (Wikipedia Standard)</option>
                      <option value="left">Left Floating Thumbnail</option>
                      <option value="center">Centered Figure</option>
                      <option value="full">Full Section Width</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#f8f9fa] border-t border-[#eaecf0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!isFormValid}
            className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply Image to Article</span>
          </button>
        </div>
      </div>
    </div>
  );
};
