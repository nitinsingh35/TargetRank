import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getAdminDashboard, 
  getMentorDashboard, 
  getAspirantDashboard 
} from '../controllers/dashboardController.js';

const router = express.Router();

// Role gate middlewares helper
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized.' });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: requires one of roles [${roles.join(', ')}]` });
    }
    next();
  };
};

router.get('/admin/dashboard', protect, authorize(['admin']), getAdminDashboard);
router.get('/mentor/dashboard', protect, authorize(['mentor', 'admin']), getMentorDashboard);
router.get('/aspirant/dashboard', protect, authorize(['aspirant', 'student', 'admin']), getAspirantDashboard);

export default router;
