import React from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';

const UserForm = ({ user, onSave, onCancel }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: user || {
      email: '',
      firstName: '',
      lastName: '',
      role: 'PRODUCT_MANAGER',
      sbu: '',
      password: '',
      isActive: true
    }
  });

  const selectedRole = watch('role');
  const isEditing = !!user;

  const roles = [
    { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
    { value: 'PM_OPS', label: 'PMOps' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  const sbuOptions = [
    { value: 'Life Science', label: 'Life Science' },
    { value: 'Process Solutions', label: 'Process Solutions' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Healthcare', label: 'Healthcare' }
  ];

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            {/* Email */}
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
                disabled={isEditing}
                className={`form-input ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="user@milliporesigma.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                {...register('firstName', {
                  required: 'First name is required'
                })}
                type="text"
                className="form-input"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                {...register('lastName', {
                  required: 'Last name is required'
                })}
                type="text"
                className="form-input"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                {...register('role', {
                  required: 'Role is required'
                })}
                className="form-select"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* SBU - Only for Product Managers */}
            {selectedRole === 'PRODUCT_MANAGER' && (
              <div>
                <label htmlFor="sbu" className="block text-sm font-medium text-gray-700 mb-2">
                  SBU (Strategic Business Unit) *
                </label>
                <select
                  {...register('sbu', {
                    required: selectedRole === 'PRODUCT_MANAGER' ? 'SBU is required for Product Managers' : false
                  })}
                  className="form-select"
                >
                  <option value="">Select SBU</option>
                  {sbuOptions.map(sbu => (
                    <option key={sbu.value} value={sbu.value}>
                      {sbu.label}
                    </option>
                  ))}
                </select>
                {errors.sbu && (
                  <p className="mt-1 text-sm text-red-600">{errors.sbu.message}</p>
                )}
              </div>
            )}

            {/* Note: No password required for development profiles */}

            {/* Active Status */}
            <div className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (user can log in)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
