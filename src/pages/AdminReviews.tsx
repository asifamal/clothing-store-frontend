import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminGetReviews,
  adminApproveReview,
  adminRejectReview,
  adminDeleteReview,
  adminGetReviewStatistics,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StarRating from "@/components/StarRating";
import { toast } from "@/hooks/use-toast";
import { Search, Check, X, Trash2, Star, BadgeCheck, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: number;
  product: number;
  product_name: string;
  product_image: string | null;
  user: {
    id: number;
    username: string;
  };
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
}

interface ReviewStats {
  total_reviews: number;
  approved_reviews: number;
  pending_reviews: number;
  average_rating: number;
}

const AdminReviews = () => {
  const { tokens } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterApproval, setFilterApproval] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filterApproval, filterRating]);

  const fetchReviews = async () => {
    if (!tokens?.access) return;

    try {
      setLoading(true);
      const params: any = {};
      if (filterApproval !== "all") {
        params.is_approved = filterApproval === "approved";
      }
      if (filterRating !== "all") {
        params.rating = parseInt(filterRating);
      }
      if (search) {
        params.search = search;
      }

      const response = await adminGetReviews(tokens.access, params);
      setReviews(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!tokens?.access) return;

    try {
      const response = await adminGetReviewStatistics(tokens.access);
      setStats(response);
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleApprove = async (id: number) => {
    if (!tokens?.access) return;

    setProcessingId(id);
    try {
      await adminApproveReview(tokens.access, id);
      toast({
        title: "Success",
        description: "Review approved successfully",
      });
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve review",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!tokens?.access) return;

    setProcessingId(id);
    try {
      await adminRejectReview(tokens.access, id);
      toast({
        title: "Success",
        description: "Review hidden successfully",
      });
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to hide review",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!tokens?.access) return;
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;

    setProcessingId(id);
    try {
      await adminDeleteReview(tokens.access, id);
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSearch = () => {
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Reviews Management</h2>
          <p className="text-slate-500 mt-1">Manage customer reviews and ratings</p>
        </div>
        <Button
          onClick={fetchReviews}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-indigo-700 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.total_reviews}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-green-700 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-900">{stats.approved_reviews}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-amber-700 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-900">{stats.pending_reviews}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-purple-700 mb-1">Average Rating</p>
              <p className="text-2xl font-bold text-purple-900">{stats.average_rating.toFixed(1)} ⭐</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by product, user, or review content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterApproval} onValueChange={setFilterApproval}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Hidden/Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button onClick={handleSearch} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 md:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-slate-900">Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading reviews...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No reviews found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Product</TableHead>
                    <TableHead className="font-semibold text-slate-700">User</TableHead>
                    <TableHead className="font-semibold text-slate-700">Rating</TableHead>
                    <TableHead className="font-semibold text-slate-700">Review</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {review.product_image ? (
                            <img
                              src={review.product_image}
                              alt={review.product_name}
                              className="w-14 h-14 object-cover rounded-lg border-2 border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                              <Star className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div className="text-sm font-medium text-slate-900 max-w-[150px] truncate" title={review.product_name}>
                            {review.product_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 text-sm">{review.user.username}</span>
                          {review.verified_purchase && (
                            <span title="Verified Purchase">
                              <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-sm font-semibold text-slate-700">{review.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[350px]">
                          {review.title && (
                            <div className="font-semibold text-sm text-slate-900 mb-1 line-clamp-1">{review.title}</div>
                          )}
                          <div className="text-xs text-slate-600 line-clamp-2">
                            {review.comment}
                          </div>
                          {review.helpful_count > 0 && (
                            <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                              <span className="font-medium">👍 {review.helpful_count}</span>
                              <span>helpful {review.helpful_count === 1 ? 'vote' : 'votes'}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {review.is_approved ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-semibold">
                            <X className="w-3.5 h-3.5" />
                            Hidden
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {!review.is_approved ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(review.id)}
                              disabled={processingId === review.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-9 w-9 p-0 rounded-lg"
                              title="Approve Review"
                            >
                              {processingId === review.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(review.id)}
                              disabled={processingId === review.id}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-9 w-9 p-0 rounded-lg"
                              title="Hide Review"
                            >
                              {processingId === review.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            disabled={processingId === review.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 rounded-lg"
                            title="Delete Review"
                          >
                            {processingId === review.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviews;
