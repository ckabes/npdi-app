// Create Default Users for Each Role
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./server/models/User');

const defaultUsers = [
  {
    email: 'admin@milliporesigma.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN',
    password: 'AdminPass123!'
  },
  {
    email: 'pmops@milliporesigma.com',
    firstName: 'PM-OPS',
    lastName: 'Manager',
    role: 'PM_OPS', 
    password: 'PMOpsPass123!'
  },
  {
    email: 'pm.lifescience@milliporesigma.com',
    firstName: 'Life Science',
    lastName: 'Product Manager',
    role: 'PRODUCT_MANAGER',
    sbu: 'Life Science',
    password: 'ProductPass123!'
  },
  {
    email: 'pm.process@milliporesigma.com',
    firstName: 'Process Solutions',
    lastName: 'Product Manager',
    role: 'PRODUCT_MANAGER',
    sbu: 'Process Solutions',
    password: 'ProductPass123!'
  },
  {
    email: 'pm.electronics@milliporesigma.com',
    firstName: 'Electronics',
    lastName: 'Product Manager',
    role: 'PRODUCT_MANAGER',
    sbu: 'Electronics',
    password: 'ProductPass123!'
  },
  {
    email: 'pm.healthcare@milliporesigma.com',
    firstName: 'Healthcare',
    lastName: 'Product Manager',
    role: 'PRODUCT_MANAGER',
    sbu: 'Healthcare',
    password: 'ProductPass123!'
  }
];

async function createDefaultUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('✅ Database connected');

    console.log('🔧 Creating default users...\n');

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⚠️  User already exists: ${userData.email}`);
          continue;
        }

        // Create new user
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Created ${userData.role}${userData.sbu ? ` (${userData.sbu})` : ''}: ${userData.email}`);
      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    // Display final user count by role
    console.log('\n📊 User Summary:');
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    usersByRole.forEach(role => {
      console.log(`  ${role._id}: ${role.count} users`);
    });

    console.log('\n✅ Default user creation completed');
    
  } catch (error) {
    console.error('❌ Error creating default users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📋 Database connection closed');
  }
}

if (require.main === module) {
  createDefaultUsers();
}

module.exports = { createDefaultUsers, defaultUsers };