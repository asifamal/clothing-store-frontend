import { useState } from "react";
import { Review } from "@/lib/api";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { ThumbsUp, BadgeCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: number;
  onMarkHelpful?: (reviewId: number) => Promise<void>;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: number) => Promise<void>;
}

const ReviewList = ({
  reviews,
  currentUserId,
  onMarkHelpful,
  onEdit,
  onDelete,
}: ReviewListProps) => {
  const [loadingHelpful, setLoadingHelpful] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleMarkHelpful = async (reviewId: number) => {
    if (!onMarkHelpful) return;
    setLoadingHelpful(reviewId);
    try {
      await onMarkHelpful(reviewId);
    } finally {
      setLoadingHelpful(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!onDelete) return;
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    setDeletingId(reviewId);
    try {
      await onDelete(reviewId);
    } finally {
      setDeletingId(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border-b pb-6 last:border-b-0 last:pb-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{review.user.username}</span>
                {review.verified_purchase && (
                  <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3 h-3" />
                    Verified Purchase
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Edit/Delete for own reviews */}
            {currentUserId === review.user.id && (
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(review)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    {deletingId === review.id ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold mb-2">{review.title}</h4>
          )}

          {/* Comment */}
          <p className="text-muted-foreground leading-relaxed mb-3">
            {review.comment}
          </p>

          {/* Helpful button */}
          {onMarkHelpful && currentUserId !== review.user.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkHelpful(review.id)}
              disabled={loadingHelpful === review.id}
              className={`text-xs gap-1 ${
                review.user_has_voted ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <ThumbsUp className={`w-3 h-3 ${review.user_has_voted ? "fill-current" : ""}`} />
              Helpful ({review.helpful_count})
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
