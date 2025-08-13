// Test Registration System
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

// Import models
const User = require('./server/models/User');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function clearTestUsers() {
  try {
    await User.deleteMany({ email: { $regex: 'test.*@example\\.com$' } });
    console.log('✅ Test users cleared');
  } catch (error) {
    console.error('❌ Failed to clear test users:', error.message);
  }
}

async function testRegistrationData() {
  console.log('\n🧪 Testing Registration Data Validation...');

  const testCases = [
    {
      name: 'Valid Product Manager',
      data: {
        email: 'test.pm@example.com',
        firstName: 'Test',
        lastName: 'PM',
        role: 'PRODUCT_MANAGER',
        sbu: 'Life Science',
        password: 'TestPass123'
      },
      expectedResult: 'success'
    },
    {
      name: 'Valid PM-OPS',
      data: {
        email: 'test.pmops@example.com',
        firstName: 'Test',
        lastName: 'PMOPS',
        role: 'PM_OPS',
        password: 'TestPass123'
      },
      expectedResult: 'success'
    },
    {
      name: 'Valid Admin',
      data: {
        email: 'test.admin@example.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
        password: 'TestPass123'
      },
      expectedResult: 'success'
    },
    {
      name: 'Invalid Email',
      data: {
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        password: 'TestPass123'
      },
      expectedResult: 'fail'
    },
    {
      name: 'Weak Password',
      data: {
        email: 'test.weak@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        password: 'weak'
      },
      expectedResult: 'fail'
    },
    {
      name: 'Product Manager Missing SBU',
      data: {
        email: 'test.nosbu@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'PRODUCT_MANAGER',
        password: 'TestPass123'
      },
      expectedResult: 'fail'
    },
    {
      name: 'Invalid Role',
      data: {
        email: 'test.invalid@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'INVALID_ROLE',
        password: 'TestPass123'
      },
      expectedResult: 'fail'
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing: ${testCase.name}`);
      
      // Test direct model creation
      const user = new User(testCase.data);
      await user.validate();
      
      // Test password hashing
      if (testCase.expectedResult === 'success') {
        await user.save();
        console.log(`  ✅ Model validation passed`);
        
        // Verify password was hashed
        const savedUser = await User.findById(user._id);
        const isPasswordValid = await savedUser.comparePassword(testCase.data.password);
        if (!isPasswordValid) {
          throw new Error('Password hashing/comparison failed');
        }
        console.log(`  ✅ Password hashing works correctly`);
        
        results.push({ ...testCase, result: 'success', error: null });
      } else {
        results.push({ ...testCase, result: 'unexpected_success', error: 'Expected validation to fail but it passed' });
        console.log(`  ⚠️  Expected validation to fail but it passed`);
      }
    } catch (error) {
      if (testCase.expectedResult === 'fail') {
        results.push({ ...testCase, result: 'success', error: null });
        console.log(`  ✅ Validation correctly failed: ${error.message}`);
      } else {
        results.push({ ...testCase, result: 'fail', error: error.message });
        console.log(`  ❌ Unexpected error: ${error.message}`);
      }
    }
  }

  return results;
}

async function testServerEndpoint() {
  console.log('\n🌐 Testing Registration Endpoint...');
  
  try {
    // Test if server is running
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data);
  } catch (error) {
    console.log('❌ Server is not running. Starting server test in isolation...');
    return { serverRunning: false, error: error.message };
  }

  const testRegistrations = [
    {
      name: 'Valid Registration',
      data: {
        email: 'endpoint.test@example.com',
        firstName: 'Endpoint',
        lastName: 'Test',
        role: 'ADMIN',
        password: 'TestPass123'
      }
    }
  ];

  const results = [];

  for (const test of testRegistrations) {
    try {
      console.log(`\n  Testing: ${test.name}`);
      const response = await axios.post(`${BASE_URL}/auth/register`, test.data);
      console.log(`  ✅ Registration successful: ${response.status}`);
      console.log(`  📝 Response:`, JSON.stringify(response.data, null, 2));
      results.push({ ...test, result: 'success', response: response.data });
    } catch (error) {
      console.log(`  ❌ Registration failed: ${error.message}`);
      if (error.response) {
        console.log(`  📝 Error response:`, JSON.stringify(error.response.data, null, 2));
        results.push({ ...test, result: 'fail', error: error.response.data });
      } else {
        results.push({ ...test, result: 'fail', error: error.message });
      }
    }
  }

  return { serverRunning: true, results };
}

async function checkEnvironmentConfig() {
  console.log('\n⚙️  Checking Environment Configuration...');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV'
  ];

  const envStatus = {};
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    envStatus[envVar] = {
      exists: !!value,
      value: envVar === 'JWT_SECRET' ? (value ? '***' : null) : value
    };
    
    if (value) {
      console.log(`  ✅ ${envVar}: ${envVar === 'JWT_SECRET' ? '***' : value}`);
    } else {
      console.log(`  ❌ ${envVar}: Missing`);
    }
  }

  // Check JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-here') {
      console.log(`  ⚠️  JWT_SECRET: Using default value (security risk)`);
      envStatus.JWT_SECRET.issue = 'default_value';
    } else if (process.env.JWT_SECRET.length < 32) {
      console.log(`  ⚠️  JWT_SECRET: Too short (should be at least 32 characters)`);
      envStatus.JWT_SECRET.issue = 'too_short';
    }
  }

  return envStatus;
}

async function checkDatabaseState() {
  console.log('\n💾 Checking Database State...');
  
  try {
    const userCount = await User.countDocuments();
    console.log(`  📊 Total users in database: ${userCount}`);
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    console.log('  👥 Users by role:');
    usersByRole.forEach(role => {
      console.log(`    ${role._id}: ${role.count}`);
    });

    const inactiveUsers = await User.countDocuments({ isActive: false });
    if (inactiveUsers > 0) {
      console.log(`  ⚠️  Inactive users: ${inactiveUsers}`);
    }

    // Check for duplicate emails (should not exist due to unique constraint)
    const duplicateEmails = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateEmails.length > 0) {
      console.log(`  ❌ Duplicate emails found:`, duplicateEmails);
    }

    return {
      totalUsers: userCount,
      usersByRole,
      inactiveUsers,
      duplicateEmails
    };
  } catch (error) {
    console.error('  ❌ Database query failed:', error.message);
    return { error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log('🔍 NPDI Registration System Test Suite');
  console.log('=====================================');

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    await connectDB();

    // 1. Environment Configuration
    testResults.tests.environment = await checkEnvironmentConfig();

    // 2. Database State
    testResults.tests.database = await checkDatabaseState();

    // 3. Clear test data
    await clearTestUsers();

    // 4. Model Validation Tests
    testResults.tests.modelValidation = await testRegistrationData();

    // 5. Server Endpoint Tests
    testResults.tests.serverEndpoint = await testServerEndpoint();

    console.log('\n📋 Test Summary');
    console.log('===============');

    // Environment issues
    const envIssues = Object.entries(testResults.tests.environment)
      .filter(([key, value]) => !value.exists || value.issue)
      .map(([key, value]) => key);

    if (envIssues.length > 0) {
      console.log(`❌ Environment issues: ${envIssues.join(', ')}`);
    }

    // Model validation issues
    const modelFailures = testResults.tests.modelValidation
      .filter(test => test.result === 'fail')
      .map(test => test.name);

    if (modelFailures.length > 0) {
      console.log(`❌ Model validation failures: ${modelFailures.join(', ')}`);
    }

    // Server endpoint issues
    if (testResults.tests.serverEndpoint.serverRunning) {
      const endpointFailures = testResults.tests.serverEndpoint.results
        .filter(test => test.result === 'fail')
        .map(test => test.name);

      if (endpointFailures.length > 0) {
        console.log(`❌ Endpoint failures: ${endpointFailures.join(', ')}`);
      }
    } else {
      console.log(`❌ Server not running`);
    }

    if (envIssues.length === 0 && modelFailures.length === 0 && 
        (testResults.tests.serverEndpoint.serverRunning ? 
         testResults.tests.serverEndpoint.results.filter(t => t.result === 'fail').length === 0 : false)) {
      console.log('✅ All tests passed!');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    testResults.error = error.message;
  } finally {
    await mongoose.disconnect();
  }

  return testResults;
}

// Export for module use, or run directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n📁 Full test results saved to test-results.json');
      require('fs').writeFileSync('test-results.json', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };