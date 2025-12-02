import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BeakerIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { parserConfigAPI } from '../../services/api';
import { parserConfigService } from '../../services/parserConfigService';

const ParserKnowledgeManager = () => {
  const [activeTab, setActiveTab] = useState('testAttribute');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: '',
    description: ''
  });

  const tabs = [
    { id: 'testAttribute', name: 'Test Attributes', description: 'Quality test/attribute names' },
    { id: 'testMethod', name: 'Test Methods', description: 'Analytical test methods' },
    { id: 'defaultMethod', name: 'Default Mappings', description: 'Test → Method assignments' }
  ];

  useEffect(() => {
    fetchEntries();
  }, [activeTab]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await parserConfigAPI.getByType(activeTab);
      setEntries(response.data.entries || []);

      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.entries
        .map(e => e.category)
        .filter(Boolean))];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Failed to fetch parser config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Client-side filtering
    return entries.filter(entry => {
      const matchesSearch = !searchQuery ||
        entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || entry.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  };

  const handleSave = async () => {
    if (!formData.key || !formData.value) {
      toast.error('Key and value are required');
      return;
    }

    try {
      await parserConfigAPI.upsertEntry(activeTab, {
        ...formData,
        isCustom: true
      });

      toast.success(`Entry ${editingEntry ? 'updated' : 'added'} successfully`);
      setShowAddModal(false);
      setEditingEntry(null);
      setFormData({ key: '', value: '', category: '', description: '' });

      // Invalidate cache and refresh
      parserConfigService.invalidate();
      fetchEntries();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save entry');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      key: entry.key,
      value: entry.value,
      category: entry.category || '',
      description: entry.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Are you sure you want to delete "${key}"?`)) return;

    try {
      await parserConfigAPI.deleteEntry(activeTab, key);
      toast.success('Entry deleted successfully');

      // Invalidate cache and refresh
      parserConfigService.invalidate();
      fetchEntries();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const response = await parserConfigAPI.exportConfig(activeTab, format);

      // Create download link
      const blob = format === 'csv'
        ? response.data
        : new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${entries.length} entries as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export configuration');
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('This will remove all custom entries. Are you sure?')) return;

    try {
      await parserConfigAPI.resetToDefaults(activeTab);
      toast.success('Configuration reset to defaults');

      // Invalidate cache and refresh
      parserConfigService.invalidate();
      fetchEntries();
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Failed to reset configuration');
    }
  };

  const filteredEntries = handleSearch();
  const customEntriesCount = entries.filter(e => e.isCustom).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BeakerIcon className="h-8 w-8 mr-3 text-purple-600" />
            Quality Tests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage test attributes, methods, and default mappings for the Quality Spec Parser
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('json')}
            className="btn btn-secondary text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div>{tab.name}</div>
              <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
            </button>
          ))}
        </nav>
      </div>

      {/* Stats & Actions Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{customEntriesCount}</div>
              <div className="text-sm text-gray-600">Custom Entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{entries.length - customEntriesCount}</div>
              <div className="text-sm text-gray-600">Default Entries</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingEntry(null);
                setFormData({ key: '', value: '', category: '', description: '' });
                setShowAddModal(true);
              }}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Entry
            </button>
            {customEntriesCount > 0 && (
              <button
                onClick={handleResetToDefaults}
                className="btn btn-secondary"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Reset to Defaults
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by key, value, or description..."
              className="form-input pl-10"
            />
          </div>
        </div>
        {categories.length > 0 && (
          <div className="w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
        {(searchQuery || selectedCategory) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
            }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Entries Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading configuration...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery || selectedCategory ? 'No matching entries found' : 'No entries yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Key
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Value
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                      Category
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Description
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Type
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-mono text-gray-900 break-words max-w-[150px]">
                        {entry.key}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 break-words max-w-[150px]">
                        {entry.value}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {entry.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {entry.category}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 max-w-[200px]" title={entry.description}>
                        <div className="line-clamp-2">
                          {entry.description || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.isCustom ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.isCustom ? 'Custom' : 'Default'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.key)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g., purity, hplc, bioburden"
                  className="form-input font-mono"
                  disabled={!!editingEntry}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase search key (will be normalized automatically)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., Purity, HPLC, Bioburden"
                  className="form-input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Properly formatted/capitalized version
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., chemical, biological, physical"
                  className="form-input"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-gray-500">
                  Optional category for organization
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description or notes"
                  rows={2}
                  className="form-input"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                  setFormData({ key: '', value: '', category: '', description: '' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
              >
                {editingEntry ? 'Update' : 'Add'} Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParserKnowledgeManager;
