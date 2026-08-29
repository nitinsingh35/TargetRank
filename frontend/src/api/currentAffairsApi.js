import API from './api.js';

export const currentAffairsAPI = {
  // Admin Source APIs
  adminCreateSource: (data) => API.post('/admin/current-affairs/sources', data),
  adminGetSources: (params) => API.get('/admin/current-affairs/sources', { params }),
  adminGetSource: (id) => API.get(`/admin/current-affairs/sources/${id}`),
  adminUpdateSource: (id, data) => API.put(`/admin/current-affairs/sources/${id}`, data),
  adminVerifySource: (id) => API.post(`/admin/current-affairs/sources/${id}/verify`),
  adminArchiveSource: (id) => API.post(`/admin/current-affairs/sources/${id}/archive`),

  // Admin Pack APIs
  adminCreatePack: (data) => API.post('/admin/current-affairs/packs', data),
  adminGetPacks: (params) => API.get('/admin/current-affairs/packs', { params }),
  adminGetPack: (id) => API.get(`/admin/current-affairs/packs/${id}`),
  adminUpdatePack: (id, data) => API.put(`/admin/current-affairs/packs/${id}`, data),
  adminDeletePack: (id) => API.delete(`/admin/current-affairs/packs/${id}`),
  adminValidatePack: (id) => API.post(`/admin/current-affairs/packs/${id}/validate`),
  adminPublishPack: (id) => API.post(`/admin/current-affairs/packs/${id}/publish`),
  adminArchivePack: (id) => API.post(`/admin/current-affairs/packs/${id}/archive`),
  adminDuplicatePack: (id) => API.post(`/admin/current-affairs/packs/${id}/duplicate`),
  adminGetPackAnalytics: (id) => API.get(`/admin/current-affairs/packs/${id}/analytics`),

  // Aspirant APIs
  getPacks: (params) => API.get('/current-affairs/packs', { params }),
  getPackDetails: (id) => API.get(`/current-affairs/packs/${id}`),
  startPractice: (id, data) => API.post(`/current-affairs/packs/${id}/start-practice`, data),
  getPackCategoryCoverage: (id) => API.get(`/current-affairs/packs/${id}/coverage`),
  getGlobalCoverage: (params) => API.get('/current-affairs/coverage', { params }),
  getMyHistory: (params) => API.get('/current-affairs/my-history', { params }),
};

export default currentAffairsAPI;
