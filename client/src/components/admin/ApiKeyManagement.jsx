import React, { useState, useEffect } from 'react';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    application: '',
    expiresInDays: '',
    permissions: ['read'],
    ipWhitelist: '',
    rateLimit: 1000
  });

  useEffect(() => {
    fetchApiKeys();
    fetchStatistics();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/api-keys`, {
        params: { includeInactive: true }
      });
      setApiKeys(response.data.data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/api-keys/statistics`);
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('API key name is required');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('At least one permission must be selected');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        ...formData,
        createdBy: currentUser.email || 'admin',
        ipWhitelist: formData.ipWhitelist ? formData.ipWhitelist.split(',').map(ip => ip.trim()) : [],
        rateLimit: {
          requestsPerHour: parseInt(formData.rateLimit) || 1000
        }
      };

      if (formData.expiresInDays) {
        payload.expiresInDays = parseInt(formData.expiresInDays);
      }

      const response = await axios.post(`${API_BASE_URL}/api/admin/api-keys`, payload);

      setGeneratedKey(response.data.data);
      toast.success('API key generated successfully!');

      // Reset form
      setFormData({
        name: '',
        description: '',
        application: '',
        expiresInDays: '',
        permissions: ['read'],
        ipWhitelist: '',
        rateLimit: 1000
      });

      fetchApiKeys();
      fetchStatistics();
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error(error.response?.data?.message || 'Failed to generate API key');
    }
  };

  const handleRevokeKey = async (keyId, keyName) => {
    if (window.confirm(`Are you sure you want to revoke the API key "${keyName}"? This action will immediately invalidate the key.`)) {
      try {
        await axios.patch(`${API_BASE_URL}/api/admin/api-keys/${keyId}/revoke`);
        toast.success('API key revoked successfully');
        fetchApiKeys();
        fetchStatistics();
      } catch (error) {
        console.error('Error revoking API key:', error);
        toast.error('Failed to revoke API key');
      }
    }
  };

  const handleDeleteKey = async (keyId, keyName) => {
    if (window.confirm(`Are you sure you want to permanently delete the API key "${keyName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/admin/api-keys/${keyId}`);
        toast.success('API key deleted successfully');
        fetchApiKeys();
        fetchStatistics();
      } catch (error) {
        console.error('Error deleting API key:', error);
        toast.error('Failed to delete API key');
      }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('API key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (apiKey) => {
    if (!apiKey.isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Revoked</span>;
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Expired</span>;
    }

    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  const getPermissionBadges = (permissions) => {
    const colors = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    };

    return permissions.map(perm => (
      <span key={perm} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[perm]}`}>
        {perm}
      </span>
    ));
  };

  const closeGenerateModal = () => {
    setShowGenerateModal(false);
    setGeneratedKey(null);
    setCopied(false);
    // Reset form data to defaults
    setFormData({
      name: '',
      description: '',
      application: '',
      expiresInDays: '',
      permissions: ['read'],
      ipWhitelist: '',
      rateLimit: 1000
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Key Management</h2>
          <p className="text-gray-600">Generate and manage API keys for external applications</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Keys</dt>
                    <dd className="text-2xl font-bold text-gray-900">{statistics.totalKeys}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Keys</dt>
                    <dd className="text-2xl font-bold text-green-900">{statistics.activeKeys}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Usage</dt>
                    <dd className="text-2xl font-bold text-blue-900">{statistics.totalUsage.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                    <dd className="text-2xl font-bold text-yellow-900">{statistics.expiringKeys.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            API Keys ({apiKeys.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Prefix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    Loading API keys...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No API keys found. Generate your first API key to get started.
                  </td>
                </tr>
              ) : (
                apiKeys.map((apiKey) => (
                  <tr key={apiKey._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                        {apiKey.application && (
                          <div className="text-sm text-gray-500">{apiKey.application}</div>
                        )}
                        {apiKey.description && (
                          <div className="text-xs text-gray-400 mt-1">{apiKey.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{apiKey.keyPrefix}...</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {getPermissionBadges(apiKey.permissions)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(apiKey)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apiKey.usageCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {apiKey.isActive ? (
                        <button
                          onClick={() => handleRevokeKey(apiKey._id, apiKey.name)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Revoke key"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDeleteKey(apiKey._id, apiKey.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete key"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate API Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {generatedKey ? 'API Key Generated' : 'Generate New API Key'}
              </h3>

              {generatedKey ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Important: Save Your API Key</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          This is the only time you'll see the full API key. Copy it now and store it securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedKey.key}
                        readOnly
                        className="form-input font-mono text-sm flex-1"
                      />
                      <button
                        onClick={() => copyToClipboard(generatedKey.key)}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        {copied ? <CheckIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="ml-2 text-gray-900">{generatedKey.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Permissions:</span>
                      <span className="ml-2">{generatedKey.permissions.join(', ')}</span>
                    </div>
                    {generatedKey.application && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Application:</span>
                        <span className="ml-2 text-gray-900">{generatedKey.application}</span>
                      </div>
                    )}
                    {generatedKey.expiresAt && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Expires:</span>
                        <span className="ml-2 text-gray-900">{formatDate(generatedKey.expiresAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button onClick={closeGenerateModal} className="btn btn-primary">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                      placeholder="e.g., Production API Key"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="form-input"
                      rows="2"
                      placeholder="Brief description of what this key will be used for"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application
                    </label>
                    <input
                      type="text"
                      value={formData.application}
                      onChange={(e) => setFormData({ ...formData, application: e.target.value })}
                      className="form-input"
                      placeholder="e.g., External Dashboard, Mobile App"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires In (Days)
                      </label>
                      <input
                        type="number"
                        value={formData.expiresInDays}
                        onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                        className="form-input"
                        placeholder="Leave empty for no expiration"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate Limit (req/hour)
                      </label>
                      <input
                        type="number"
                        value={formData.rateLimit}
                        onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                        className="form-input"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      {['read', 'write', 'admin'].map(perm => (
                        <label key={perm} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  permissions: [...formData.permissions, perm]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  permissions: formData.permissions.filter(p => p !== perm)
                                });
                              }
                            }}
                            className="form-checkbox"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IP Whitelist (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.ipWhitelist}
                      onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                      className="form-input"
                      placeholder="192.168.1.1, 10.0.0.1 (comma-separated)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to allow requests from any IP address
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={closeGenerateModal}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Generate API Key
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
