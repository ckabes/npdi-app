import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  BellIcon,
  ComputerDesktopIcon,
  ClockIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { userPreferencesAPI } from '../services/api';

const UserPreferences = () => {
  const [preferences, setPreferences] = useState({});
  const [activeSection, setActiveSection] = useState('display');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await userPreferencesAPI.getPreferences();
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await userPreferencesAPI.updatePreferences(preferences);
      toast.success('Preferences saved successfully');
      await fetchPreferences();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = async () => {
    if (!confirm('Are you sure you want to reset all preferences to default?')) {
      return;
    }

    try {
      await userPreferencesAPI.reset();
      toast.success('Preferences reset to default');
      await fetchPreferences();
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Failed to reset preferences');
    }
  };

  const updateSetting = (section, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const sections = [
    { id: 'display', name: 'Display', icon: ComputerDesktopIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'dashboard', name: 'Dashboard', icon: Cog6ToothIcon },
    { id: 'accessibility', name: 'Accessibility', icon: EyeIcon }
  ];

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={preferences.display?.timezone || 'America/New_York'}
            onChange={(e) => updateSetting('display', 'timezone', e.target.value)}
            className="form-select"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Phoenix">Arizona (MST)</option>
            <option value="America/Anchorage">Alaska (AKT)</option>
            <option value="Pacific/Honolulu">Hawaii (HST)</option>
            <option value="UTC">UTC</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="Europe/Paris">Paris (CET/CEST)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Shanghai">Shanghai (CST)</option>
            <option value="Australia/Sydney">Sydney (AEST)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            All times in the application will be displayed in this timezone
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={preferences.display?.dateFormat || 'MM/DD/YYYY'}
            onChange={(e) => updateSetting('display', 'dateFormat', e.target.value)}
            className="form-select"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <select
            value={preferences.display?.timeFormat || '12-hour'}
            onChange={(e) => updateSetting('display', 'timeFormat', e.target.value)}
            className="form-select"
          >
            <option value="12-hour">12 Hour (2:30 PM)</option>
            <option value="24-hour">24 Hour (14:30)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={preferences.display?.theme || 'light'}
            onChange={(e) => updateSetting('display', 'theme', e.target.value)}
            className="form-select"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={preferences.display?.language || 'en'}
            onChange={(e) => updateSetting('display', 'language', e.target.value)}
            className="form-select"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <div className="flex">
          <ClockIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Auto-detected:</strong> Your browser timezone is <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              You can override this by selecting a different timezone above
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="emailEnabled"
              type="checkbox"
              checked={preferences.notifications?.email?.enabled || false}
              onChange={(e) => {
                const newNotifications = { ...preferences.notifications };
                newNotifications.email = { ...newNotifications.email, enabled: e.target.checked };
                setPreferences(prev => ({ ...prev, notifications: newNotifications }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="emailEnabled" className="ml-3 text-sm font-medium text-gray-700">
              Enable email notifications
            </label>
          </div>

          {preferences.notifications?.email?.enabled && (
            <div className="ml-6 space-y-3 mt-4">
              {[
                { key: 'newTicket', label: 'New ticket created' },
                { key: 'statusChange', label: 'Ticket status changes' },
                { key: 'comments', label: 'New comments on tickets' },
                { key: 'assignments', label: 'Tickets assigned to me' },
                { key: 'reminders', label: 'Reminder notifications' },
                { key: 'dailyDigest', label: 'Daily digest summary' },
                { key: 'weeklyReport', label: 'Weekly report' }
              ].map(setting => (
                <div key={setting.key} className="flex items-center">
                  <input
                    id={`email-${setting.key}`}
                    type="checkbox"
                    checked={preferences.notifications?.email?.[setting.key] || false}
                    onChange={(e) => {
                      const newNotifications = { ...preferences.notifications };
                      newNotifications.email = { ...newNotifications.email, [setting.key]: e.target.checked };
                      setPreferences(prev => ({ ...prev, notifications: newNotifications }));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`email-${setting.key}`} className="ml-3 text-sm text-gray-600">
                    {setting.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Browser Notifications</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="browserEnabled"
              type="checkbox"
              checked={preferences.notifications?.browser?.enabled || false}
              onChange={(e) => {
                const newNotifications = { ...preferences.notifications };
                newNotifications.browser = { ...newNotifications.browser, enabled: e.target.checked };
                setPreferences(prev => ({ ...prev, notifications: newNotifications }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="browserEnabled" className="ml-3 text-sm font-medium text-gray-700">
              Enable browser notifications
            </label>
          </div>

          {preferences.notifications?.browser?.enabled && (
            <div className="ml-6 space-y-3 mt-4">
              {[
                { key: 'newTicket', label: 'New ticket created' },
                { key: 'statusChange', label: 'Ticket status changes' },
                { key: 'comments', label: 'New comments' },
                { key: 'assignments', label: 'New assignments' }
              ].map(setting => (
                <div key={setting.key} className="flex items-center">
                  <input
                    id={`browser-${setting.key}`}
                    type="checkbox"
                    checked={preferences.notifications?.browser?.[setting.key] || false}
                    onChange={(e) => {
                      const newNotifications = { ...preferences.notifications };
                      newNotifications.browser = { ...newNotifications.browser, [setting.key]: e.target.checked };
                      setPreferences(prev => ({ ...prev, notifications: newNotifications }));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`browser-${setting.key}`} className="ml-3 text-sm text-gray-600">
                    {setting.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDashboardSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default View
          </label>
          <select
            value={preferences.dashboard?.defaultView || 'list'}
            onChange={(e) => updateSetting('dashboard', 'defaultView', e.target.value)}
            className="form-select"
          >
            <option value="list">List View</option>
            <option value="grid">Grid View</option>
            <option value="kanban">Kanban Board</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items Per Page
          </label>
          <select
            value={preferences.dashboard?.itemsPerPage || 25}
            onChange={(e) => updateSetting('dashboard', 'itemsPerPage', parseInt(e.target.value))}
            className="form-select"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="showCompleted"
          type="checkbox"
          checked={preferences.dashboard?.showCompletedTickets || false}
          onChange={(e) => updateSetting('dashboard', 'showCompletedTickets', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showCompleted" className="ml-3 text-sm text-gray-700">
          Show completed tickets in dashboard
        </label>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size
          </label>
          <select
            value={preferences.accessibility?.fontSize || 'medium'}
            onChange={(e) => updateSetting('accessibility', 'fontSize', e.target.value)}
            className="form-select"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: 'reducedMotion', label: 'Reduce motion and animations' },
          { key: 'highContrast', label: 'High contrast mode' },
          { key: 'screenReader', label: 'Screen reader optimizations' }
        ].map(setting => (
          <div key={setting.key} className="flex items-center">
            <input
              id={setting.key}
              type="checkbox"
              checked={preferences.accessibility?.[setting.key] || false}
              onChange={(e) => updateSetting('accessibility', setting.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={setting.key} className="ml-3 text-sm text-gray-700">
              {setting.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'display':
        return renderDisplaySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'dashboard':
        return renderDashboardSettings();
      case 'accessibility':
        return renderAccessibilitySettings();
      default:
        return renderDisplaySettings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Preferences</h1>
                <p className="text-sm text-gray-500">Customize your personal settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={resetPreferences}
                className="btn btn-secondary"
              >
                Reset to Default
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="btn btn-primary flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {sections.find(s => s.id === activeSection)?.name}
              </h3>
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
