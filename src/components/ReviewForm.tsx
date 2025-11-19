import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StarRating from "./StarRating";
import { Star } from "lucide-react";

interface ReviewFormProps {
  productId: number;
  existingReview?: {
    rating: number;
    title: string;
    comment: string;
  };
  onSubmit: (data: { rating: number; title: string; comment: string }) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

const ReviewForm = ({
  productId,
  existingReview,
  onSubmit,
  onCancel,
  isEditing = false,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      alert("Please write a review");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ rating, title, comment });
      if (!isEditing) {
        // Reset form
        setRating(0);
        setTitle("");
        setComment("");
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-muted/30 p-6 rounded-lg border">
      <div>
        <h3 className="font-semibold text-lg mb-4">
          {isEditing ? "Edit Your Review" : "Write a Review"}
        </h3>
      </div>

      {/* Star Rating Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Rating *</Label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setRating(index + 1)}
              onMouseEnter={() => setHoveredRating(index + 1)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  index < (hoveredRating || rating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground"
                } transition-colors`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="review-title" className="text-sm font-semibold">
          Review Title (Optional)
        </Label>
        <Input
          id="review-title"
          type="text"
          placeholder="Sum up your experience..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="h-11"
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="review-comment" className="text-sm font-semibold">
          Your Review *
        </Label>
        <Textarea
          id="review-comment"
          placeholder="Share your thoughts about this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {comment.length} characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting || rating === 0 || !comment.trim()}
          className="bg-accent hover:bg-accent/90 text-white font-semibold"
        >
          {submitting ? "Submitting..." : isEditing ? "Update Review" : "Submit Review"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
