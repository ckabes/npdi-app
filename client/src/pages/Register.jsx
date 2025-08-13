import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        toast.success('Registration successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-millipore-blue">
        <div className="flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <img src="/logo-white.svg" alt="MilliporeSigma" className="h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Join NPDI Portal
          </h1>
          <p className="text-xl mb-8">
            New Product Development & Introduction
          </p>
          <p className="text-lg opacity-90">
            Create your account to start managing chemical product development 
            with our comprehensive platform designed for MilliporeSigma teams.
          </p>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.svg" alt="MilliporeSigma" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">NPDI Portal</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600 mb-8">
              Enter your information to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  type="text"
                  className="form-input"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  type="text"
                  className="form-input"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                type="email"
                className="form-input"
                placeholder="john.doe@milliporesigma.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="form-select"
              >
                <option value="">Select your role</option>
                <option value="PRODUCT_MANAGER">Product Manager</option>
                <option value="PM_OPS">PM-OPS Team</option>
                <option value="ADMIN">Administrator</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {selectedRole === 'PRODUCT_MANAGER' && (
              <div>
                <label htmlFor="sbu" className="block text-sm font-medium text-gray-700 mb-2">
                  Strategic Business Unit *
                </label>
                <select
                  {...register('sbu', { 
                    required: selectedRole === 'PRODUCT_MANAGER' ? 'SBU is required for Product Managers' : false 
                  })}
                  className="form-select"
                >
                  <option value="">Select your SBU</option>
                  <option value="Life Science">Life Science</option>
                  <option value="Process Solutions">Process Solutions</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
                {errors.sbu && (
                  <p className="mt-1 text-sm text-red-600">{errors.sbu.message}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number'
                  }
                })}
                type="password"
                className="form-input"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-millipore-blue hover:text-millipore-blue-dark">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;