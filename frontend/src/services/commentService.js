// src/services/commentService.js
import api from "./api";

export const getCommentsByTask = async (taskId) => {
  const res = await api.get(`/comments/task/${taskId}`);
  return res.data;
};

export const createComment = async (taskId, content) => {
  const res = await api.post(`/comments/task/${taskId}`, { content });
  return res.data;
};

export const updateComment = async (id, content) => {
  const res = await api.put(`/comments/${id}`, { content });
  return res.data;
};

export const deleteComment = async (id) => {
  const res = await api.delete(`/comments/${id}`);
  return res.data;
};

export default {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment
};