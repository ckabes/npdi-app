const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserPreferences,
  updateUserPreferences,
  updatePreferenceSection,
  resetPreferences,
  getPreferenceSection
} = require('../controllers/userPreferencesController');

// All routes require authentication
router.use(protect);

// User preferences routes
router.route('/')
  .get(getUserPreferences)
  .put(updateUserPreferences);

// Reset preferences
router.post('/reset', resetPreferences);

// Specific section routes
router.route('/:section')
  .get(getPreferenceSection)
  .patch(updatePreferenceSection);

module.exports = router;
