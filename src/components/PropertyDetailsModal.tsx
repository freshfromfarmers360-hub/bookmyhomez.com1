import React, { useState, useRef } from 'react';
import { Property, User } from '../types';
import {
  X,
  MapPin,
  MessageCircle,
  RefreshCw,
  Lock,
  CheckCircle,
  Building,
  Home,
  Check,
  Share2,
  ChevronLeft,
  ChevronRight,
  Video,
  Star,
  Trash2,
  Edit3,
  Upload,
  Calendar,
  Save,
} from 'lucide-react';

interface PropertyDetailsModalProps {
  property: Property | null;
  currentUser: User | null;
  onClose: () => void;
  onToggleStatus: (property: Property) => void;
  formatCurrency: (val: number) => string;
  onUpdateProperty?: (updatedProperty: Property) => void;
}

interface Review {
  userName?: string;
  name?: string;
  comment: string;
  rating: number;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  currentUser,
  onClose,
  onToggleStatus,
  formatCurrency,
  onUpdateProperty,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [availDate, setAvailDate] = useState<string>(property?.availDate || '');
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    property?.images && property.images.length > 0 ? property.images : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Reviews State ---
  const [reviews, setReviews] = useState<Review[]>(
    property?.reviews || [
      { name: 'Suresh Kumar', comment: 'Property is very clean and located in a prime area.', rating: 5 },
    ]
  );
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  if (!property) return null;

  const isOwner =
    currentUser &&
    (currentUser.id === property.ownerId || currentUser.role === 'Administrator');

  // Handle Photo Upload via Local Files
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (currentMediaIndex >= uploadedImages.length - 1 && currentMediaIndex > 0) {
      setCurrentMediaIndex((prev) => prev - 1);
    }
  };

  const handleSaveChanges = () => {
    const updatedProperty: Property = {
      ...property,
      availDate: availDate,
      images: uploadedImages.length > 0 ? uploadedImages : property.images,
    };

    if (onUpdateProperty) {
      onUpdateProperty(updatedProperty);
    } else {
      property.availDate = availDate;
      property.images = updatedProperty.images;
    }

    setIsEditing(false);
  };

  // Combine images and direct video/videoUrl into one media array
  const currentImages =
    uploadedImages.length > 0
      ? uploadedImages
      : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80'];

  const directVideo = property.videoUrl || (property as any).video;
  const mediaList = directVideo ? [...currentImages, directVideo] : currentImages;

  // Enhanced check for video items
  const isVideoItem = (url: string) => {
    return (
      url === directVideo ||
      url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.ogg') ||
      (!url.includes('youtube.com') && !url.includes('youtu.be') && url === directVideo)
    );
  };

  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  const whatsappMessage = encodeURIComponent(
    `Hi, I am interested in your property "${property.title}" listed on BookMyHomez for ₹${formatCurrency(
      property.price
    )}.`
  );

  const handleShare = () => {
    const shareText = `Check out "${property.title}" in ${property.locality}, ${property.city} for ₹${formatCurrency(
      property.price
    )} on BookMyHomez!`;

    const propertyId = (property as any).id || (property as any)._id || '';
    const shareUrl = propertyId
      ? `${window.location.origin}/?propertyId=${propertyId}`
      : window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: property.title,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // --- Handle Review Submit ---
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewComment) return;

    const newReview: Review = {
      name: reviewerName,
      comment: reviewComment,
      rating: reviewRating,
    };

    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    setReviewerName('');
    setReviewComment('');
    setReviewRating(5);
  };

  // --- Handle Delete Review (Admin Only) ---
  const handleDeleteReview = (idx: number) => {
    const updatedReviews = reviews.filter((_, i) => i !== idx);
    setReviews(updatedReviews);
    property.reviews = updatedReviews;
  };

  const currentMedia = mediaList[currentMediaIndex] || mediaList[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Top Header Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          {isOwner && (
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveChanges();
                } else {
                  setIsEditing(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Save Changes' : 'Edit Property'}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Slider Container */}
        <div className="relative h-72 rounded-2xl overflow-hidden mb-4 bg-slate-950 group flex items-center justify-center mt-6">
          {isVideoItem(currentMedia) ? (
            <video
              src={currentMedia}
              controls
              muted
              className="w-full h-full object-contain bg-black"
            />
          ) : currentMedia.includes('youtube.com') || currentMedia.includes('youtu.be') ? (
            <iframe
              src={currentMedia}
              title="Property Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <img
              src={currentMedia}
              alt={property.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
          )}

          {mediaList.length > 1 && (
            <>
              <button
                onClick={handlePrevMedia}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-900 transition cursor-pointer border border-slate-700 shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMedia}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-900 transition cursor-pointer border border-slate-700 shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-700 z-10">
                {currentMediaIndex + 1} / {mediaList.length}
              </div>
            </>
          )}

          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <span className="bg-slate-950/80 backdrop-blur-md text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase border border-indigo-500/30">
              {property.category}
            </span>
            <span
              className={`text-xs font-black px-3.5 py-1.5 rounded-xl uppercase shadow-2xl flex items-center gap-1.5 border backdrop-blur-md ${
                property.status === 'Booked'
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-emerald-500 text-slate-950 border-emerald-300'
              }`}
            >
              {property.status === 'Booked' ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              {property.status || 'Available'}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 hover:bg-indigo-600 transition cursor-pointer z-10"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span>{copied ? 'Link Copied!' : 'Share Property'}</span>
          </button>
        </div>

        {/* Upload Photos Section (Shown when in Edit Mode) */}
        {isEditing && (
          <div className="mb-6 p-4 bg-slate-950/70 border border-dashed border-indigo-500/50 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Manage Photos
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select new images to add directly from your device
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Photos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {uploadedImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-800 group"
                  >
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute inset-0 bg-rose-950/80 text-rose-300 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer text-xs font-bold"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Thumbnails Row */}
        {mediaList.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {mediaList.map((mediaUrl, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentMediaIndex(idx)}
                className={`relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer flex items-center justify-center bg-slate-950 ${
                  currentMediaIndex === idx
                    ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                {isVideoItem(mediaUrl) ? (
                  <div className="flex flex-col items-center justify-center text-indigo-400">
                    <Video className="w-6 h-6" />
                  </div>
                ) : (
                  <img src={mediaUrl} alt="thumb" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Title & Location with View on Map Integration */}
        <h2 className="text-2xl font-black text-white mb-1">{property.title}</h2>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {property.locality}, {property.city}
            </span>
          </p>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${property.title}, ${property.locality},${property.city}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-indigo-500/30 cursor-pointer shadow-md"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View on Map</span>
          </a>
        </div>

        <div className="text-3xl font-black text-emerald-400 mb-6">
          ₹{formatCurrency(property.price)}
          <span className="text-xs text-slate-400 font-normal ml-1">
            {property.category === 'Rent'
              ? property.rentType === 'Daily'
                ? '/ day'
                : '/ month'
              : ''}
          </span>
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs mb-6">
          <div>
            <span className="text-slate-500 block">Sub-Type:</span>
            <span className="font-bold text-white flex items-center gap-1 mt-0.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              {property.subType || 'Apartment'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">BHK Config:</span>
            <span className="font-bold text-white flex items-center gap-1 mt-0.5">
              <Home className="w-3.5 h-3.5 text-indigo-400" />
              {property.bhk || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Bedrooms:</span>
            <span className="font-bold text-white mt-0.5 block">
              {property.bedrooms || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Bathrooms:</span>
            <span className="font-bold text-white mt-0.5 block">
              {property.bathrooms || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Balconies:</span>
            <span className="font-bold text-white mt-0.5 block">
              {property.balconies || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Built-up Area:</span>
            <span className="font-bold text-white mt-0.5 block">
              {property.area} sq.ft
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Facing:</span>
            <span className="font-bold text-indigo-400 mt-0.5 block">
              {property.facing || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Property Age:</span>
            <span className="font-bold text-white mt-0.5 block">
              {property.propertyAge || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Furnishing:</span>
            <span className="font-bold text-white mt-0.5 block">
              {property.furnishing || 'Semi Furnished'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Deposit:</span>
            <span className="font-bold text-white mt-0.5 block">
              ₹{property.deposit ? formatCurrency(property.deposit) : '0'}
            </span>
          </div>

          {/* Available Date with Editable Input */}
          <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-indigo-400" /> Available From:
            </span>
            {isEditing ? (
              <input
                type="text"
                placeholder="e.g. Immediate or 2026-11-01"
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-indigo-500 rounded p-1 text-white text-xs focus:outline-none"
              />
            ) : (
              <span className="font-bold text-white mt-0.5 block">
                {availDate || property.availDate || 'Immediate'}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-500 block">Status:</span>
            <span
              className={`font-bold mt-0.5 block ${
                property.status === 'Booked' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {property.status || 'Available'}
            </span>
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Description & Highlights
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              {property.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Society Amenities
            </h4>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1.5 rounded-xl border border-indigo-500/20 flex items-center gap-1.5 font-medium"
                >
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-6 border-t border-slate-800 pt-6">
          <h4 className="text-sm font-bold text-white mb-4">Customer Reviews & Ratings</h4>

          {reviews && reviews.length > 0 ? (
            <div className="space-y-3 mb-4 max-h-44 overflow-y-auto pr-1">
              {reviews.map((rev: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">
                        {rev.userName || rev.name || 'Verified User'}
                      </span>
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" /> {rev.rating} / 5
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{rev.comment}</p>
                  </div>

                  {currentUser && currentUser.role === 'Administrator' && (
                    <button
                      onClick={() => handleDeleteReview(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition cursor-pointer bg-slate-900 border border-slate-800"
                      title="Delete Review (Admin Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mb-4">No reviews yet for this property.</p>
          )}

          {/* Add Review Form */}
          <form
            onSubmit={handleReviewSubmit}
            className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs"
          >
            <span className="font-bold text-slate-300 block">Leave a Review</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Your Name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Poor</option>
                <option value={1}>1 Star - Terrible</option>
              </select>
            </div>
            <textarea
              placeholder="Write your review here..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              required
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition cursor-pointer shadow-md"
            >
              Submit Review
            </button>
          </form>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/919916475749?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              <MessageCircle className="w-4 h-4 fill-white" /> WhatsApp Owner
            </a>

            <button
              onClick={handleShare}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-indigo-400" /> Share
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => onToggleStatus(property)}
                className="bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold px-4 py-3 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Toggle Status ({property.status || 'Available'})
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl text-xs font-bold cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
