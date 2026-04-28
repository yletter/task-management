import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Base64 of "Task@2026"
const AUTH_TOKEN = btoa('Task@2026');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'task_auth': AUTH_TOKEN,
  },
});

// ─── Task APIs ──────────────────────────────────────────────────────────────

// API-1: Get all tasks
export const getAllTasks = () => api.get('/tasks');

// API-2: Update task
export const updateTask = (taskNumber, data) => api.put(`/tasks/${taskNumber}`, data);

// API-3: Delete task
export const deleteTask = (taskNumber) => api.delete(`/tasks/${taskNumber}`);

// API-4: Create task
export const createTask = (data) => api.post('/tasks', data);

// ─── Step APIs ──────────────────────────────────────────────────────────────

// API-5: Get steps for task
export const getSteps = (taskNumber) => api.get(`/tasks/${taskNumber}/steps`);

// API-6: Update step
export const updateStep = (taskNumber, stepNumber, data) =>
  api.put(`/tasks/${taskNumber}/steps/${stepNumber}`, data);

// API-7: Delete step
export const deleteStep = (taskNumber, stepNumber) =>
  api.delete(`/tasks/${taskNumber}/steps/${stepNumber}`);

// API-8: Create step
export const createStep = (taskNumber, data) =>
  api.post(`/tasks/${taskNumber}/steps`, data);

// API-9: Reorder steps
export const reorderSteps = (taskNumber, order) =>
  api.put(`/tasks/${taskNumber}/steps/reorder`, { order });

// ─── Category APIs ──────────────────────────────────────────────────────────

// API-10: Get all categories
export const getAllCategories = () => api.get('/categories');

// API-11: Update category
export const updateCategory = (categoryId, data) =>
  api.put(`/categories/${categoryId}`, data);

// API-12: Delete category
export const deleteCategory = (categoryId) => api.delete(`/categories/${categoryId}`);

// API-13: Create category
export const createCategory = (data) => api.post('/categories', data);

export default api;