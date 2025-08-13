// Fix Authentication System
const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

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
  }
];

async function fixAuthSystem() {
  try {
    console.log('🔧 Fixing Authentication System...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('✅ Database connected');

    // 1. Check current users
    console.log('\n📊 Current User Status:');
    const allUsers = await User.find({});
    console.log(`Total users: ${allUsers.length}`);
    
    for (const user of allUsers) {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    }

    // 2. Test login for each default user
    console.log('\n🧪 Testing Login Functionality:');
    for (const defaultUser of defaultUsers) {
      const user = await User.findOne({ email: defaultUser.email });
      
      if (user) {
        const isPasswordValid = await user.comparePassword(defaultUser.password);
        console.log(`${defaultUser.email}: ${isPasswordValid ? '✅ Login works' : '❌ Password invalid'}`);
        
        if (!isPasswordValid) {
          console.log(`  → Resetting password for ${defaultUser.email}`);
          user.password = defaultUser.password;
          await user.save();
          console.log(`  → Password reset completed`);
        }
      } else {
        console.log(`${defaultUser.email}: ❌ User not found - Creating...`);
        const newUser = new User(defaultUser);
        await newUser.save();
        console.log(`  → User created successfully`);
      }
    }

    // 3. Test registration with validation
    console.log('\n🧪 Testing Registration Validation:');
    
    // Test valid registration
    const testEmail = `test.${Date.now()}@example.com`;
    try {
      const testUser = new User({
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        password: 'TestPass123!'
      });
      
      await testUser.validate();
      console.log('✅ Registration validation works');
      
      // Clean up test user
      await User.deleteOne({ email: testEmail });
    } catch (validationError) {
      console.log('❌ Registration validation failed:', validationError.message);
    }

    // 4. Verify JWT secret
    console.log('\n🔐 JWT Configuration:');
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret !== 'your-super-secret-jwt-key-here') {
      console.log('✅ JWT_SECRET is properly configured');
    } else {
      console.log('❌ JWT_SECRET needs to be updated');
    }

    // 5. Final verification
    console.log('\n🎯 Final Verification:');
    const finalCount = await User.countDocuments();
    const activeCount = await User.countDocuments({ isActive: true });
    
    console.log(`Total users: ${finalCount}`);
    console.log(`Active users: ${activeCount}`);
    
    // Test each default user login one more time
    console.log('\n📝 Login Test Results:');
    for (const defaultUser of defaultUsers) {
      const user = await User.findOne({ email: defaultUser.email });
      if (user) {
        const isPasswordValid = await user.comparePassword(defaultUser.password);
        const status = isPasswordValid ? '✅ READY' : '❌ BROKEN';
        console.log(`${defaultUser.email}: ${status}`);
      }
    }

    console.log('\n🏁 Authentication system fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing auth system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📋 Database connection closed');
  }
}

async function testEndpoints() {
  const axios = require('axios');
  
  console.log('\n🌐 Testing API Endpoints:');
  
  // Test health endpoint
  try {
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health endpoint works');
  } catch (error) {
    console.log('❌ Server not running or health endpoint broken');
    return;
  }

  // Test login endpoint
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@milliporesigma.com',
      password: 'AdminPass123!'
    });
    console.log('✅ Login endpoint works');
    console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
  } catch (error) {
    console.log('❌ Login endpoint failed:', error.response?.data?.message || error.message);
  }

  // Test registration endpoint
  try {
    const testEmail = `test.endpoint.${Date.now()}@example.com`;
    const regResponse = await axios.post('http://localhost:5000/api/auth/register', {
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
      password: 'TestPass123!'
    });
    console.log('✅ Registration endpoint works');
    console.log(`   New user: ${regResponse.data.user.email}`);
    
    // Clean up
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Registration endpoint failed:', error.response?.data?.message || error.message);
  }
}

if (require.main === module) {
  console.log('🚀 Starting Authentication System Fix');
  console.log('=====================================\n');
  
  fixAuthSystem()
    .then(() => testEndpoints())
    .then(() => {
      console.log('\n✅ All authentication fixes completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Test login at http://localhost:5173/login');
      console.log('2. Use test auth page at http://localhost:5173/test-auth');
      console.log('3. Test registration at http://localhost:5173/register');
      console.log('\nDefault credentials:');
      console.log('- admin@milliporesigma.com / AdminPass123!');
      console.log('- pmops@milliporesigma.com / PMOpsPass123!');
      console.log('- pm.lifescience@milliporesigma.com / ProductPass123!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fix process failed:', error);
      process.exit(1);
    });
}