'use client';

import { useState, useRef } from 'react';
import { Star, Upload, X, Send } from 'lucide-react';
import StarRating from './StarRating';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
  targetType: 'restaurant' | 'chef' | 'order' | 'chef_booking';
  targetId: string;
  orderId?: string;
  chefBookingId?: string;
  onSubmit?: (reviewData: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface ReviewData {
  rating: number;
  title: string;
  review: string;
  breakdown: {
    food?: number;
    service?: number;
    delivery?: number;
    value?: number;
    ambiance?: number;
    cleanliness?: number;
  };
  context: {
    orderType?: string;
    visitDate?: string;
    occasionType?: string;
    groupSize?: number;
  };
  media: {
    images: string[];
  };
}

export default function ReviewForm({
  targetType,
  targetId,
  orderId,
  chefBookingId,
  onSubmit,
  onCancel,
  className = ''
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 0,
    title: '',
    review: '',
    breakdown: {},
    context: {},
    media: { images: [] }
  });

  const handleInputChange = (field: string, value: any) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBreakdownChange = (field: string, value: number) => {
    setReviewData(prev => ({
      ...prev,
      breakdown: {
        ...prev.breakdown,
        [field]: value
      }
    }));
  };

  const handleContextChange = (field: string, value: any) => {
    setReviewData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        [field]: value
      }
    }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const newImages = data.urls || [];
        setUploadedImages(prev => [...prev, ...newImages]);
        setReviewData(prev => ({
          ...prev,
          media: {
            images: [...prev.media.images, ...newImages]
          }
        }));
      } else {
        toast.error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setReviewData(prev => ({
      ...prev,
      media: { images: newImages }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reviewData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewData.review.trim()) {
      toast.error('Please write a review');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        targetType,
        targetId,
        orderId,
        chefBookingId,
        ...reviewData
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Review submitted successfully!');
        
        if (onSubmit) {
          onSubmit(data);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBreakdownFields = () => {
    switch (targetType) {
      case 'restaurant':
        return [
          { key: 'food', label: 'Food Quality' },
          { key: 'service', label: 'Service' },
          { key: 'delivery', label: 'Delivery' },
          { key: 'value', label: 'Value for Money' },
          { key: 'ambiance', label: 'Ambiance' }
        ];
      case 'chef':
        return [
          { key: 'food', label: 'Food Quality' },
          { key: 'service', label: 'Service' },
          { key: 'value', label: 'Value for Money' },
          { key: 'cleanliness', label: 'Cleanliness' }
        ];
      case 'order':
        return [
          { key: 'food', label: 'Food Quality' },
          { key: 'delivery', label: 'Delivery Experience' },
          { key: 'value', label: 'Value for Money' }
        ];
      default:
        return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Overall Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating *
        </label>
        <StarRating
          rating={reviewData.rating}
          onRatingChange={(rating) => handleInputChange('rating', rating)}
          size="lg"
          showValue
        />
      </div>

      {/* Review Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Title
        </label>
        <input
          type="text"
          value={reviewData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
          maxLength={100}
        />
      </div>

      {/* Review Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          value={reviewData.review}
          onChange={(e) => handleInputChange('review', e.target.value)}
          placeholder="Share your experience with others..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
          maxLength={1000}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          {reviewData.review.length}/1000 characters
        </div>
      </div>

      {/* Detailed Ratings */}
      {getBreakdownFields().length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Detailed Ratings
          </label>
          <div className="space-y-3">
            {getBreakdownFields().map(field => (
              <div key={field.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{field.label}</span>
                <StarRating
                  rating={reviewData.breakdown[field.key] || 0}
                  onRatingChange={(rating) => handleBreakdownChange(field.key, rating)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Type
          </label>
          <select
            value={reviewData.context.orderType || ''}
            onChange={(e) => handleContextChange('orderType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
          >
            <option value="">Select...</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
            <option value="dine_in">Dine In</option>
            <option value="chef_service">Chef Service</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Size
          </label>
          <input
            type="number"
            value={reviewData.context.groupSize || ''}
            onChange={(e) => handleContextChange('groupSize', parseInt(e.target.value) || undefined)}
            min="1"
            max="20"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <Upload className="h-4 w-4" />
            Upload Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />
          
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || reviewData.rating === 0}
          className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}