'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Flag, Calendar, CheckCircle } from 'lucide-react';
import StarRating from './StarRating';
import { toast } from 'react-hot-toast';

interface Review {
  _id: string;
  userId: string;
  rating: number;
  title?: string;
  review?: string;
  breakdown: {
    food?: number;
    service?: number;
    delivery?: number;
    value?: number;
    ambiance?: number;
    cleanliness?: number;
  };
  media: {
    images?: string[];
  };
  user: {
    name: string;
    profilePicture?: string;
    isVerified: boolean;
    totalReviews: number;
    memberSince: Date;
  };
  context: {
    isVerifiedPurchase: boolean;
    orderType?: string;
    visitDate?: Date;
    groupSize?: number;
  };
  engagement: {
    helpfulVotes: number;
    unhelpfulVotes: number;
    replies: Array<{
      from: string;
      message: string;
      timestamp: Date;
      authorName: string;
    }>;
  };
  submittedAt: Date;
}

interface ReviewListProps {
  targetType: string;
  targetId: string;
  className?: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedReviews?: number;
}

export default function ReviewList({ targetType, targetId, className = '' }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    rating: '',
    sortBy: 'recent',
    verifiedOnly: false
  });

  useEffect(() => {
    loadReviews(true);
  }, [targetType, targetId, filters]);

  const loadReviews = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const queryParams = new URLSearchParams({
        targetType,
        targetId,
        page: currentPage.toString(),
        limit: '10',
        sortBy: filters.sortBy,
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.verifiedOnly && { verifiedOnly: 'true' })
      });

      const response = await fetch(`/api/reviews?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (reset) {
          setReviews(data.data.reviews);
          setPage(2);
        } else {
          setReviews(prev => [...prev, ...data.data.reviews]);
          setPage(prev => prev + 1);
        }
        
        setStats(data.data.stats);
        setHasMore(data.data.reviews.length === 10);
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBreakdownAverage = (field: string) => {
    const validReviews = reviews.filter(review => review.breakdown[field]);
    if (validReviews.length === 0) return 0;
    
    const sum = validReviews.reduce((acc, review) => acc + (review.breakdown[field] || 0), 0);
    return sum / validReviews.length;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Review Stats */}
      {stats && (
        <div className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div>
                  <StarRating rating={stats.averageRating} readonly size="lg" />
                  <div className="text-sm text-gray-600 mt-1">
                    Based on {stats.totalReviews} reviews
                  </div>
                </div>
              </div>
              
              {/* Breakdown Ratings */}
              {targetType === 'restaurant' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Food</span>
                    <span>{getBreakdownAverage('food').toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service</span>
                    <span>{getBreakdownAverage('service').toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>{getBreakdownAverage('delivery').toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Rating Distribution</h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-6">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded"
                        style={{
                          width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {stats.ratingDistribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Rating:</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verifiedOnly"
              checked={filters.verifiedOnly}
              onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="verifiedOnly" className="text-sm text-gray-700">
              Verified purchases only
            </label>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {review.user.profilePicture ? (
                  <img
                    src={review.user.profilePicture}
                    alt={review.user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {review.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{review.user.name}</span>
                  {review.user.isVerified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                  {review.context.isVerifiedPurchase && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={review.rating} readonly />
                  <span className="text-sm text-gray-600">
                    {formatDate(review.submittedAt)}
                  </span>
                  {review.context.orderType && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {review.context.orderType}
                    </span>
                  )}
                </div>
                
                {review.title && (
                  <h4 className="font-medium mb-2">{review.title}</h4>
                )}
                
                {review.review && (
                  <p className="text-gray-700 mb-3">{review.review}</p>
                )}
                
                {/* Review Images */}
                {review.media.images && review.media.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.media.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded"
                      />
                    ))}
                    {review.media.images.length > 3 && (
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                        +{review.media.images.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                
                {/* Engagement */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <button className="flex items-center gap-1 hover:text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    Helpful ({review.engagement.helpfulVotes})
                  </button>
                  <button className="flex items-center gap-1 hover:text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    Not helpful ({review.engagement.unhelpfulVotes})
                  </button>
                  <button className="flex items-center gap-1 hover:text-orange-600">
                    <Flag className="h-4 w-4" />
                    Report
                  </button>
                </div>
                
                {/* Restaurant/Chef Replies */}
                {review.engagement.replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    {review.engagement.replies.map((reply, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{reply.authorName}</span>
                          <span className="text-xs text-gray-600">
                            {formatDate(reply.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center">
          <button
            onClick={() => loadReviews(false)}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Load More Reviews
          </button>
        </div>
      )}

      {loading && reviews.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No reviews found. Be the first to leave a review!
        </div>
      )}
    </div>
  );
}