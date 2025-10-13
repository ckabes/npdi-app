const UserPreferences = require('../models/UserPreferences');

// @desc    Get user preferences
// @route   GET /api/user-preferences
// @access  Private
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.email;  // Use email from profile
    const preferences = await UserPreferences.getOrCreate(userId);

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Failed to fetch user preferences' });
  }
};

// @desc    Update user preferences
// @route   PUT /api/user-preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.email;  // Use email from profile
    const updates = req.body;

    const preferences = await UserPreferences.updatePreferences(userId, updates);

    res.json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ message: 'Failed to update user preferences' });
  }
};

// @desc    Update specific preference section
// @route   PATCH /api/user-preferences/:section
// @access  Private
const updatePreferenceSection = async (req, res) => {
  try {
    const userId = req.user.email;  // Use email from profile
    const { section } = req.params;
    const updates = req.body;

    // Validate section exists
    const validSections = ['display', 'notifications', 'dashboard', 'ticketForm', 'accessibility', 'advanced'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid preference section' });
    }

    const preferences = await UserPreferences.getOrCreate(userId);
    preferences[section] = { ...preferences[section], ...updates };
    await preferences.save();

    res.json({
      message: `${section} preferences updated successfully`,
      preferences
    });
  } catch (error) {
    console.error('Error updating preference section:', error);
    res.status(500).json({ message: 'Failed to update preference section' });
  }
};

// @desc    Reset preferences to default
// @route   POST /api/user-preferences/reset
// @access  Private
const resetPreferences = async (req, res) => {
  try {
    const userId = req.user.email;  // Use email from profile

    // Delete existing preferences
    await UserPreferences.deleteOne({ userId });

    // Create new with defaults
    const preferences = await UserPreferences.create({ userId });

    res.json({
      message: 'Preferences reset to default',
      preferences
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ message: 'Failed to reset preferences' });
  }
};

// @desc    Get specific preference section
// @route   GET /api/user-preferences/:section
// @access  Private
const getPreferenceSection = async (req, res) => {
  try {
    const userId = req.user.email;  // Use email from profile
    const { section } = req.params;

    const preferences = await UserPreferences.getOrCreate(userId);

    if (!preferences[section]) {
      return res.status(404).json({ message: 'Preference section not found' });
    }

    res.json(preferences[section]);
  } catch (error) {
    console.error('Error fetching preference section:', error);
    res.status(500).json({ message: 'Failed to fetch preference section' });
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  updatePreferenceSection,
  resetPreferences,
  getPreferenceSection
};
