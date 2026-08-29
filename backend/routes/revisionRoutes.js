import express from 'express';
import {
  // Phase 7 – new handlers
  getRevisionDashboard,
  getRevisionToday,
  getMistakeNotebookItems,
  getBookmarks,
  startRevisionItem,
  checkRevisionAnswer,
  completeRevisionItem,
  saveRevisionNote,
  archiveRevisionItem,
  createRevisionFromBookmark,
  getWeakTopics,
  startWeakTopicSession,
  // Legacy Phase 6 stubs (backward-compatible)
  getRevisionItems,
  updateRevisionStatus,
  getMistakeNotebook,
  updateMistakeNote,
} from '../controllers/revisionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All revision routes require authentication
router.use(protect);

// ─── Phase 7 – Dashboard ─────────────────────────────────────────────────────
router.get('/dashboard', getRevisionDashboard);

// ─── Phase 7 – Today's Queue ─────────────────────────────────────────────────
router.get('/today', getRevisionToday);

// ─── Phase 7 – Mistake Notebook ──────────────────────────────────────────────
router.get('/mistake-notebook', getMistakeNotebookItems);

// ─── Phase 7 – Bookmarks ─────────────────────────────────────────────────────
router.get('/bookmarks', getBookmarks);

// ─── Phase 7 – Revision Item Workflow ────────────────────────────────────────
router.post('/items/:id/start',    startRevisionItem);
router.post('/items/:id/answer',   checkRevisionAnswer);
router.post('/items/:id/complete', completeRevisionItem);
router.post('/items/:id/note',     saveRevisionNote);
router.post('/items/:id/archive',  archiveRevisionItem);

// ─── Phase 7 – Bookmark → RevisionItem ───────────────────────────────────────
router.post('/from-bookmark/:questionId', createRevisionFromBookmark);

// ─── Phase 7 – Weak Topics ───────────────────────────────────────────────────
router.get('/weak-topics',        getWeakTopics);
router.post('/weak-topics/start', startWeakTopicSession);

// ─── Legacy Phase 6 routes (preserved for backward compatibility) ─────────────
router.get('/items',        getRevisionItems);
router.put('/items/:id',    updateRevisionStatus);
router.get('/mistakes',     getMistakeNotebook);
router.put('/mistakes/:id', updateMistakeNote);

export default router;
