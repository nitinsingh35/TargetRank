import API from './api.js';

export const adminQuestionImportAPI = {
  uploadImportFile: (formData) => API.post('/admin/question-import/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  previewImportFile: (batchId) => API.post(`/admin/question-import/${batchId}/preview`),
  validateImportFile: (batchId) => API.post(`/admin/question-import/${batchId}/validate`),
  commitImportFile: (batchId, data) => API.post(`/admin/question-import/${batchId}/commit`, data),
  rollbackImportBatch: (batchId) => API.post(`/admin/question-import/${batchId}/rollback`),
  getImportBatches: (params) => API.get('/admin/question-import/batches', { params }),
  getImportBatchById: (batchId) => API.get(`/admin/question-import/${batchId}`),
  getImportBatchErrors: (batchId, params) => API.get(`/admin/question-import/${batchId}/errors`, { params }),

  // Quality actions
  approveQuestion: (id, data) => API.patch(`/admin/question-import/questions/${id}/approve`, data),
  rejectQuestion: (id, data) => API.patch(`/admin/question-import/questions/${id}/reject`, data),
  publishQuestion: (id) => API.patch(`/admin/question-import/questions/${id}/publish`),

  // Bulk actions
  bulkApproveQuestions: (data) => API.patch('/admin/question-import/questions/bulk-approve', data),
  bulkTagQuestions: (data) => API.patch('/admin/question-import/questions/bulk-tag', data),
  bulkPublishQuestions: (data) => API.patch('/admin/question-import/questions/bulk-publish', data),

  // New QCMS endpoints
  getImportStats: () => API.get('/admin/question-import/stats'),
  getSampleTemplateFile: (format) => API.get(`/admin/question-import/templates/${format}`, { responseType: 'blob' }),
  retryFailedRows: (batchId) => API.post(`/admin/question-import/${batchId}/retry`),
};

export default adminQuestionImportAPI;
