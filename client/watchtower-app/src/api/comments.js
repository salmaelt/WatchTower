import { apiRequest } from "./client";

export async function getComments(reportId, token) {
  return apiRequest(`/reports/${reportId}/comments`, {
    method: "GET",
    token,
  });
}

export async function addComment(reportId, commentText, token) {
  return apiRequest(`/reports/${reportId}/comments`, {
    method: "POST",
    body: JSON.stringify({ commentText }),
    token,
  });
}

export async function upvoteComment(commentId, token) {
  return apiRequest(`/comments/${commentId}/upvote`, {
    method: "PUT",
    token,
  });
}

export async function removeUpvoteComment(commentId, token) {
  return apiRequest(`/comments/${commentId}/upvote`, {
    method: "DELETE",
    token,
  });
}

export async function deleteComment(commentId, token) {
  return apiRequest(`/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}
