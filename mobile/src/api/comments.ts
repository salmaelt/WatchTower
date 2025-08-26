import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export type CommentDto = {
  id: number;
  userId: number;
  username: string;
  commentText: string;
  createdAt: string;
  upvotes: number;
  upvotedByMe: boolean;
};

export async function listComments(reportId: number) {
  return apiGet<CommentDto[]>(`/reports/${reportId}/comments`);
}
export async function addComment(reportId: number, commentText: string) {
  return apiPost<CommentDto>(`/reports/${reportId}/comments`, { commentText });
}
export async function upvoteComment(commentId: number) {
  return apiPut<{ id: number; upvotes: number; upvotedByMe: boolean }>(`/comments/${commentId}/upvote`);
}
export async function removeUpvoteComment(commentId: number) {
  return apiDelete<{ id: number; upvotes: number; upvotedByMe: boolean }>(`/comments/${commentId}/upvote`);
}
export async function deleteComment(commentId: number) {
  return apiDelete<void>(`/comments/${commentId}`);
}
