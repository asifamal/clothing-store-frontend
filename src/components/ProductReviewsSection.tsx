import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Review,
  ReviewStats,
  getProductReviews,
  getProductReviewStats,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Star, BarChart3 } from "lucide-react";

interface ProductReviewsSectionProps {
  productId: number;
}

const ProductReviewsSection = ({ productId }: ProductReviewsSectionProps) => {
  const { isAuthenticated, user, tokens } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [filterRating, setFilterRating] = useState<number | undefined>();

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId, filterRating]);

  const fetchReviews = async () => {
    try {
      const response = await getProductReviews(productId, { rating: filterRating });
      setReviews(response);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getProductReviewStats(productId);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch review stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (data: { rating: number; title: string; comment: string }) => {
    if (!tokens?.access) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingReview) {
        await updateReview(tokens.access, editingReview.id, data);
        toast({
          title: "Review Updated",
          description: "Your review has been updated successfully",
        });
        setEditingReview(null);
      } else {
        await createReview(tokens.access, { ...data, product: productId });
        toast({
          title: "Review Submitted",
          description: "Thank you for your review! It will appear after approval.",
        });
        setShowReviewForm(false);
      }
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      console.error("Review submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!tokens?.access) return;

    try {
      await deleteReview(tokens.access, reviewId);
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted",
      });
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    if (!tokens?.access) {
      toast({
        title: "Authentication Required",
        description: "Please log in to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      await markReviewHelpful(tokens.access, reviewId);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark review as helpful",
        variant: "destructive",
      });
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  // Check if user has already reviewed
  const userReview = reviews.find((r) => r.user.id === user?.id);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading reviews...</div>;
  }

  return (
    <div className="py-12 border-t">
      <div className="container mx-auto px-4">
        {/* Reviews Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Customer Reviews</h2>

          {/* Review Statistics */}
          {stats && stats.total_reviews > 0 && (
            <div className="bg-muted/30 p-6 rounded-lg border mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Average Rating */}
                <div>
                  <div className="flex items-end gap-4 mb-4">
                    <div className="text-5xl font-bold">{stats.average_rating.toFixed(1)}</div>
                    <div>
                      <StarRating rating={stats.average_rating} size="lg" />
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on {stats.total_reviews} {stats.total_reviews === 1 ? "review" : "reviews"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.rating_distribution[rating.toString() as keyof typeof stats.rating_distribution];
                    const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <button
                          onClick={() => setFilterRating(filterRating === rating ? undefined : rating)}
                          className={`flex items-center gap-1 text-sm hover:text-accent transition-colors ${
                            filterRating === rating ? "text-accent font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          <span>{rating}</span>
                          <Star className="w-3 h-3 fill-current" />
                        </button>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-accent h-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filterRating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterRating(undefined)}
                  className="mt-4"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          )}

          {/* Write Review Button */}
          {isAuthenticated ? (
            !userReview && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-accent hover:bg-accent/90 text-white font-semibold"
                size="lg"
              >
                <Star className="w-5 h-5 mr-2" />
                Write a Review
              </Button>
            )
          ) : (
            <div className="text-sm text-muted-foreground">
              Please <Link to="/login" className="text-accent hover:underline">log in</Link> to write a review
            </div>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && !userReview && (
          <div className="mb-8 border-2 border-accent/50 rounded-lg p-1">
            <ReviewForm
              productId={productId}
              existingReview={editingReview || undefined}
              onSubmit={handleSubmitReview}
              onCancel={() => {
                setShowReviewForm(false);
                setEditingReview(null);
              }}
              isEditing={!!editingReview}
            />
          </div>
        )}

        {/* User's existing review (editable) */}
        {userReview && !editingReview && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Your Review</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditReview(userReview)}
              >
                Edit Review
              </Button>
            </div>
            <StarRating rating={userReview.rating} size="sm" />
            {userReview.title && <p className="font-medium mt-2">{userReview.title}</p>}
            <p className="text-sm text-muted-foreground mt-1">{userReview.comment}</p>
          </div>
        )}

        {/* Reviews List */}
        <ReviewList
          reviews={reviews}
          currentUserId={user?.id}
          onMarkHelpful={handleMarkHelpful}
          onEdit={handleEditReview}
          onDelete={handleDeleteReview}
        />
      </div>
    </div>
  );
};

export default ProductReviewsSection;
