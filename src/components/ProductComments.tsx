import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, User, Send, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { commentSchema, validateForm } from "@/lib/validations";

type Comment = {
  id: string;
  user_id: string;
  product_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name?: string;
    avatar_url?: string;
  };
};

interface ProductCommentsProps {
  productId: string;
}

const MAX_COMMENT_LENGTH = 1000;

const ProductComments = ({ productId }: ProductCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        // Fetch profile data for each comment user
        const userIds = commentsData.map(comment => comment.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Combine comments with profile data
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(p => p.user_id === comment.user_id) || {
            full_name: "Anonymous user",
            avatar_url: null
          }
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    // Validate the comment
    const validation = validateForm(commentSchema, { content: newComment });
    if (!validation.success) {
      setValidationError('errors' in validation ? (validation.errors.content || "Invalid comment") : "Invalid comment");
      return;
    }
    setValidationError(null);

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          product_id: productId,
          content: validation.data.content,
        });

      if (error) throw error;

      toast({
        title: "Comment added",
        description: "Your comment has been published successfully.",
      });

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "Unable to add comment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !editContent.trim()) return;

    // Validate the edited comment
    const validation = validateForm(commentSchema, { content: editContent });
    if (!validation.success) {
      const errorMsg = 'errors' in validation ? (validation.errors.content || "Invalid comment") : "Invalid comment";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: validation.data.content })
        .eq("id", editingComment.id);

      if (error) throw error;

      toast({
        title: "Comment updated",
        description: "Your comment has been updated.",
      });

      setEditingComment(null);
      setEditContent("");
      fetchComments();
    } catch (error) {
      console.error("Error editing comment:", error);
      toast({
        title: "Error",
        description: "Unable to update comment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };


  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully.",
      });

      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Unable to delete comment.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form (only if user is logged in) */}
        {user && (
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                value={newComment}
                onChange={(e) => {
                  const value = e.target.value.slice(0, MAX_COMMENT_LENGTH);
                  setNewComment(value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Share your thoughts on this item..."
                rows={3}
                disabled={submitting}
                maxLength={MAX_COMMENT_LENGTH}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </div>
            </div>
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Publishing..." : "Post comment"}
            </Button>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No comments yet.</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {comment.profiles?.full_name || "Anonymous user"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(comment.created_at)}
                        {comment.updated_at !== comment.created_at && (
                          <span className="ml-2">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit/Delete buttons for comment owner */}
                  {user && user.id === comment.user_id && (
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingComment(comment);
                              setEditContent(comment.content);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit comment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={4}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleEditComment}
                                disabled={submitting || !editContent.trim()}
                                className="flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditContent("");
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductComments;