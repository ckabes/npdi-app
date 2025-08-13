import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PermissionsManagement = () => {
  const [permissions, setPermissions] = useState({});
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('PRODUCT_MANAGER');

  useEffect(() => {
    // Initialize permissions matrix
    const defaultPermissions = {
      'PRODUCT_MANAGER': {
        tickets: {
          create: true,
          read: true,
          update: true,
          delete: false,
          viewAll: false
        },
        drafts: {
          create: true,
          read: true,
          update: true,
          delete: true,
          submit: true
        },
        skuVariants: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        chemicalProperties: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        hazardClassification: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        corpbaseData: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        pricingData: {
          create: false,
          read: false,
          update: false,
          delete: false
        },
        comments: {
          create: true,
          read: true,
          update: false,
          delete: false
        },
        statusHistory: {
          read: true,
          create: false,
          update: false,
          delete: false
        },
        admin: {
          access: false,
          userManagement: false,
          systemSettings: false,
          formConfiguration: false
        }
      },
      'PM_OPS': {
        tickets: {
          create: true,
          read: true,
          update: true,
          delete: false,
          viewAll: true
        },
        drafts: {
          create: false,
          read: true,
          update: false,
          delete: false,
          submit: false
        },
        skuVariants: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        skuAssignment: {
          create: true,
          read: true,
          update: true,
          delete: true,
          assignBaseNumbers: true
        },
        chemicalProperties: {
          create: false,
          read: true,
          update: false,
          delete: false
        },
        hazardClassification: {
          create: false,
          read: true,
          update: false,
          delete: false
        },
        corpbaseData: {
          create: false,
          read: true,
          update: false,
          delete: false
        },
        pricingData: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        comments: {
          create: true,
          read: true,
          update: false,
          delete: false
        },
        statusHistory: {
          read: true,
          create: true,
          update: false,
          delete: false
        },
        admin: {
          access: false,
          userManagement: false,
          systemSettings: false,
          formConfiguration: false
        }
      },
      'ADMIN': {
        tickets: {
          create: true,
          read: true,
          update: true,
          delete: true,
          viewAll: true
        },
        drafts: {
          create: true,
          read: true,
          update: true,
          delete: true,
          submit: true
        },
        skuVariants: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        skuAssignment: {
          create: true,
          read: true,
          update: true,
          delete: true,
          assignBaseNumbers: true
        },
        chemicalProperties: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        hazardClassification: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        corpbaseData: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        pricingData: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        comments: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        statusHistory: {
          read: true,
          create: true,
          update: true,
          delete: true
        },
        admin: {
          access: true,
          userManagement: true,
          systemSettings: true,
          formConfiguration: true
        }
      }
    };

    const rolesList = [
      { value: 'PRODUCT_MANAGER', label: 'Product Manager', icon: UserIcon, color: 'blue' },
      { value: 'PM_OPS', label: 'PMOps', icon: ShieldCheckIcon, color: 'purple' },
      { value: 'ADMIN', label: 'Administrator', icon: ShieldExclamationIcon, color: 'red' }
    ];

    setPermissions(defaultPermissions);
    setRoles(rolesList);
  }, []);

  const updatePermission = (role, section, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [section]: {
          ...prev[role][section],
          [permission]: value
        }
      }
    }));

    toast.success(`Updated ${permission} permission for ${section}`);
  };

  const savePermissions = async () => {
    try {
      // API call to save permissions would go here
      console.log('Saving permissions:', permissions);
      toast.success('Permissions saved successfully');
    } catch (error) {
      toast.error('Failed to save permissions');
    }
  };

  const getPermissionIcon = (hasPermission) => {
    return hasPermission ? (
      <CheckIcon className="h-5 w-5 text-green-600" />
    ) : (
      <XMarkIcon className="h-5 w-5 text-red-600" />
    );
  };

  const getPermissionActions = ['create', 'read', 'update', 'delete'];
  const specialActions = {
    tickets: ['viewAll'],
    drafts: ['submit'],
    skuAssignment: ['assignBaseNumbers'],
    admin: ['access', 'userManagement', 'systemSettings', 'formConfiguration']
  };

  const renderPermissionRow = (section, sectionName) => {
    const rolePermissions = permissions[selectedRole];
    if (!rolePermissions || !rolePermissions[section]) return null;

    const sectionPerms = rolePermissions[section];
    const actions = section === 'admin' 
      ? specialActions[section] 
      : getPermissionActions.concat(specialActions[section] || []);

    return (
      <div key={section} className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
          {sectionName || section.replace(/([A-Z])/g, ' $1').trim()}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {actions.map(action => {
            if (sectionPerms[action] === undefined) return null;
            
            return (
              <div key={action} className="flex items-center justify-between">
                <label className="text-xs text-gray-600 capitalize">
                  {action.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <button
                  onClick={() => updatePermission(selectedRole, section, action, !sectionPerms[action])}
                  className="ml-2"
                >
                  {getPermissionIcon(sectionPerms[action])}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedRoleData = roles.find(role => role.value === selectedRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
          <p className="text-gray-600">Configure role-based access control</p>
        </div>
        <button
          onClick={savePermissions}
          className="btn btn-primary flex items-center space-x-2"
        >
          <ShieldCheckIcon className="h-5 w-5" />
          <span>Save Permissions</span>
        </button>
      </div>

      {/* Role Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Role to Configure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedRole === role.value
                    ? `border-${role.color}-500 bg-${role.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${selectedRole === role.value ? `text-${role.color}-600` : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-900">{role.label}</div>
                    <div className="text-sm text-gray-500">{role.value}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix */}
      {selectedRoleData && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <selectedRoleData.icon className={`h-6 w-6 text-${selectedRoleData.color}-600`} />
            <h3 className="text-lg font-medium text-gray-900">
              Permissions for {selectedRoleData.label}
            </h3>
          </div>

          <div className="space-y-4">
            {renderPermissionRow('tickets', 'Tickets')}
            {renderPermissionRow('drafts', 'Draft Management')}
            {renderPermissionRow('skuVariants', 'SKU Variants')}
            {selectedRole === 'PM_OPS' && renderPermissionRow('skuAssignment', 'SKU Assignment')}
            {renderPermissionRow('chemicalProperties', 'Chemical Properties')}
            {renderPermissionRow('hazardClassification', 'Hazard Classification')}
            {renderPermissionRow('corpbaseData', 'CorpBase Data')}
            {renderPermissionRow('pricingData', 'Pricing Data')}
            {renderPermissionRow('comments', 'Comments')}
            {renderPermissionRow('statusHistory', 'Status History')}
            {renderPermissionRow('admin', 'Administrative Functions')}
          </div>
        </div>
      )}

      {/* Permission Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Permission Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Product Manager</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Can create and edit draft tickets</li>
              <li>• Can submit tickets for review</li>
              <li>• Cannot see pricing information</li>
              <li>• Limited to their own tickets</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">PMOps</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Can view all submitted tickets</li>
              <li>• Can assign SKU base numbers</li>
              <li>• Can see and edit pricing</li>
              <li>• Cannot edit chemical properties</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Administrator</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Full access to all functions</li>
              <li>• Can manage users and permissions</li>
              <li>• Can configure system settings</li>
              <li>• Can modify form configurations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;