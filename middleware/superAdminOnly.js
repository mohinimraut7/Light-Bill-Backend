// =====================================================================
// 31-Oct-2026: पूर्ण data उडवणारे routes (DELETE /dropBills, /deleteAll, /deleteReport,
// /deleteMonthReport/:month) आधी login शिवाय कोणीही call करू शकत होते.
// आता फक्त logged-in "Super Admin" (Authorization: Bearer <token>).
// Frontend मध्ये हे routes वापरलेले नाहीत -> app वर परिणाम नाही.
// =====================================================================
const authMiddleware = require('./authMiddleware');

const superAdminOnly = (req, res, next) =>
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'Super Admin') return next();
    return res.status(403).json({ message: 'Only Super Admin can perform this action' });
  });

module.exports = superAdminOnly;