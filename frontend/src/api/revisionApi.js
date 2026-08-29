import API from './api.js';

export const revisionAPI = {
  // Legacy APIs (Phase 6 backward compatibility)
  getRevisionItems: () => API.get('/revision/items'),
  updateRevisionStatus: (id, data) => API.put(`/revision/items/${id}`, data),
  getMistakes: (params) => API.get('/revision/mistakes', { params }),
  updateMistakeNote: (id, data) => API.put(`/revision/mistakes/${id}`, data),

  // Phase 7 APIs
  getDashboard: () => API.get('/revision/dashboard'),
  
  getToday: (params) => API.get('/revision/today', { params }),
  
  getMistakeNotebook: (params) => API.get('/revision/mistake-notebook', { params }),
  
  getBookmarks: (params) => API.get('/revision/bookmarks', { params }),
  
  startRevisionItem: (id) => API.post(`/revision/items/${id}/start`),
  
  checkAnswer: (id, data) => API.post(`/revision/items/${id}/answer`, data),
  
  completeRevisionItem: (id, data) => API.post(`/revision/items/${id}/complete`, data),
  
  saveNote: (id, data) => API.post(`/revision/items/${id}/note`, data),
  
  archiveRevisionItem: (id) => API.post(`/revision/items/${id}/archive`),
  
  createFromBookmark: (questionId) => API.post(`/revision/from-bookmark/${questionId}`),
  
  getWeakTopics: () => API.get('/revision/weak-topics'),
  
  startWeakTopicSession: (data) => API.post('/revision/weak-topics/start', data),
};

export default revisionAPI;
