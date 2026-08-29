import API from './api.js';

export const generationAPI = {
  createJob: (data) => API.post('/generation/generate', data),
  getBatches: () => API.get('/generation/batches'),
  getBatchById: (id) => API.get(`/generation/batches/${id}`),
  deleteBatch: (id) => API.delete(`/generation/batches/${id}`),
};

export default generationAPI;
