import React, { useState } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const TestAuth = () => {
  const [email, setEmail] = useState('admin@milliporesigma.com');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing login with:', { email, password });
      const response = await authAPI.login({ email, password });
      console.log('Login response:', response);
      
      setResult({
        type: 'login',
        success: true,
        data: response.data
      });
      
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      setResult({
        type: 'login',
        success: false,
        error: error.response?.data || error.message
      });
      
      toast.error('Login failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    setResult(null);
    
    const testUser = {
      email: `test.${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
      password: 'TestPass123!'
    };
    
    try {
      console.log('Testing registration with:', testUser);
      const response = await authAPI.register(testUser);
      console.log('Registration response:', response);
      
      setResult({
        type: 'registration',
        success: true,
        data: response.data
      });
      
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      setResult({
        type: 'registration',
        success: false,
        error: error.response?.data || error.message
      });
      
      toast.error('Registration failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-medium">Test Login</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Testing...' : 'Test Login'}
            </button>
            
            <button
              onClick={testRegistration}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Testing...' : 'Test Registration'}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Default users to test:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {[
                { email: 'admin@milliporesigma.com', password: 'AdminPass123!' },
                { email: 'pmops@milliporesigma.com', password: 'PMOpsPass123!' },
                { email: 'pm.lifescience@milliporesigma.com', password: 'ProductPass123!' }
              ].map((user, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setEmail(user.email);
                    setPassword(user.password);
                  }}
                  className="text-left p-2 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.password}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className={`card border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="card-header">
            <h3 className={`text-lg font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.type === 'login' ? 'Login' : 'Registration'} {result.success ? 'Success' : 'Failed'}
            </h3>
          </div>
          <div className="card-body">
            {result.success ? (
              <div>
                <p className="text-green-700 mb-4">
                  {result.type === 'login' ? 'Login successful!' : 'Registration successful!'}
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Token:</strong> {result.data.token?.substring(0, 20)}...</p>
                  <p><strong>User ID:</strong> {result.data.user?.id}</p>
                  <p><strong>Email:</strong> {result.data.user?.email}</p>
                  <p><strong>Role:</strong> {result.data.user?.role}</p>
                  <p><strong>Name:</strong> {result.data.user?.firstName} {result.data.user?.lastName}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-700 mb-4">
                  {result.type === 'login' ? 'Login failed!' : 'Registration failed!'}
                </p>
                <div className="text-sm text-red-600">
                  <p><strong>Error:</strong> {JSON.stringify(result.error, null, 2)}</p>
                </div>
              </div>
            )}
            
            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer">Full Response</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAuth;