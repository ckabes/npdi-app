const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const TicketTemplate = require('../models/TicketTemplate');

const PROFILES_FILE = path.join(__dirname, '../data/devProfiles.json');

// Ensure data directory and file exist
const ensureProfilesFile = async () => {
  try {
    const dataDir = path.dirname(PROFILES_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Check if file exists
    try {
      await fs.access(PROFILES_FILE);
    } catch {
      // File doesn't exist, create with default profiles
      const defaultProfiles = [
        {
          id: 'product-manager',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@milliporesigma.com',
          role: 'PRODUCT_MANAGER',
          sbu: 'Life Science',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pm-ops',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@milliporesigma.com',
          role: 'PM_OPS',
          sbu: 'Process Solutions',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'admin',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@milliporesigma.com',
          role: 'ADMIN',
          sbu: 'Electronics',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(PROFILES_FILE, JSON.stringify(defaultProfiles, null, 2), 'utf8');
    }
  } catch (error) {
    console.error('Error ensuring profiles file:', error);
  }
};

// Helper function to read profiles
const readProfiles = async () => {
  try {
    await ensureProfilesFile();
    const data = await fs.readFile(PROFILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading profiles:', error);
    return [];
  }
};

// Helper function to write profiles
const writeProfiles = async (profiles) => {
  try {
    await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing profiles:', error);
    throw error;
  }
};

// Get all development profiles
const getAllProfiles = async (req, res) => {
  try {
    const profiles = await readProfiles();
    res.json({ users: profiles });
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({ message: 'Server error fetching profiles' });
  }
};

// Get single profile by ID
const getProfileById = async (req, res) => {
  try {
    const profiles = await readProfiles();
    const profile = profiles.find(p => p.id === req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ user: profile });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// Create new profile
const createProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, firstName, lastName, role, sbu, isActive, templateId } = req.body;

    const profiles = await readProfiles();

    // Check if profile with this email already exists
    if (profiles.some(p => p.email === email)) {
      return res.status(400).json({ message: 'Profile with this email already exists' });
    }

    // Create new profile
    const newProfile = {
      id: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`,
      firstName,
      lastName,
      email,
      role,
      sbu: role === 'PRODUCT_MANAGER' ? sbu : undefined,
      isActive: isActive !== undefined ? isActive : true,
      templateId: role === 'PRODUCT_MANAGER' && templateId ? templateId : undefined,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    profiles.push(newProfile);
    await writeProfiles(profiles);

    // If template was assigned and user is Product Manager, update template's assignedUsers
    if (role === 'PRODUCT_MANAGER' && templateId) {
      try {
        const template = await TicketTemplate.findById(templateId);
        if (template) {
          // Remove user from all other templates first
          await TicketTemplate.updateMany(
            { _id: { $ne: templateId } },
            { $pull: { assignedUsers: email } }
          );

          // Add user to the selected template
          if (!template.assignedUsers.includes(email)) {
            template.assignedUsers.push(email);
            await template.save();
          }
        }
      } catch (templateError) {
        console.error('Error updating template assignment:', templateError);
        // Don't fail the user creation if template update fails
      }
    }

    res.status(201).json({
      message: 'Profile created successfully',
      user: newProfile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Server error creating profile' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, role, sbu, isActive, templateId } = req.body;
    console.log('Updating profile:', req.params.id, 'with data:', { firstName, lastName, role, sbu, isActive, templateId });

    const profiles = await readProfiles();
    const profileIndex = profiles.findIndex(p => p.id === req.params.id);

    if (profileIndex === -1) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const oldProfile = profiles[profileIndex];
    const oldEmail = oldProfile.email;

    // Update profile
    profiles[profileIndex] = {
      ...profiles[profileIndex],
      firstName,
      lastName,
      role,
      sbu: role === 'PRODUCT_MANAGER' ? sbu : undefined,
      isActive: isActive !== undefined ? isActive : profiles[profileIndex].isActive,
      templateId: role === 'PRODUCT_MANAGER' && templateId ? templateId : undefined,
      updatedAt: new Date().toISOString()
    };

    await writeProfiles(profiles);

    // Handle template assignment changes
    if (role === 'PRODUCT_MANAGER') {
      try {
        // Remove user from all templates first
        await TicketTemplate.updateMany(
          {},
          { $pull: { assignedUsers: oldEmail } }
        );

        // If a template was specified, add user to it
        if (templateId) {
          try {
            const template = await TicketTemplate.findById(templateId);
            if (template) {
              if (!template.assignedUsers.includes(oldEmail)) {
                template.assignedUsers.push(oldEmail);
                await template.save();
              }
            } else {
              console.warn(`Template ${templateId} not found, user profile updated without template assignment`);
            }
          } catch (findError) {
            console.error('Error finding template:', findError);
            // Invalid ObjectId or other error - continue without template assignment
          }
        }
      } catch (templateError) {
        console.error('Error updating template assignment:', templateError);
        // Don't fail the user update if template update fails
      }
    } else {
      // If role changed from Product Manager to something else, remove from all templates
      if (oldProfile.role === 'PRODUCT_MANAGER') {
        try {
          await TicketTemplate.updateMany(
            {},
            { $pull: { assignedUsers: oldEmail } }
          );
        } catch (templateError) {
          console.error('Error removing template assignment:', templateError);
        }
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user: profiles[profileIndex]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// Delete profile
const deleteProfile = async (req, res) => {
  try {
    const profiles = await readProfiles();
    const profileIndex = profiles.findIndex(p => p.id === req.params.id);

    if (profileIndex === -1) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Prevent deleting the last admin profile
    const profile = profiles[profileIndex];
    if (profile.role === 'ADMIN') {
      const adminCount = profiles.filter(p => p.role === 'ADMIN').length;
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot delete the last admin profile'
        });
      }
    }

    profiles.splice(profileIndex, 1);
    await writeProfiles(profiles);

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Server error deleting profile' });
  }
};

// Toggle profile active status
const toggleProfileStatus = async (req, res) => {
  try {
    const profiles = await readProfiles();
    const profileIndex = profiles.findIndex(p => p.id === req.params.id);

    if (profileIndex === -1) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profiles[profileIndex].isActive = !profiles[profileIndex].isActive;
    await writeProfiles(profiles);

    res.json({
      message: `Profile ${profiles[profileIndex].isActive ? 'activated' : 'deactivated'} successfully`,
      user: profiles[profileIndex]
    });
  } catch (error) {
    console.error('Toggle profile status error:', error);
    res.status(500).json({ message: 'Server error toggling profile status' });
  }
};

module.exports = {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  toggleProfileStatus
};
