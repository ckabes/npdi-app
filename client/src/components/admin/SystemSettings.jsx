import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  ServerIcon,
  CircleStackIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    const defaultSettings = {
      general: {
        systemName: 'NPDI Application',
        systemDescription: 'New Product Development & Introduction System',
        companyName: 'Company Name',
        supportEmail: 'support@company.com',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12-hour'
      },
      tickets: {
        autoTicketNumbers: true,
        ticketPrefix: 'NPDI',
        defaultPriority: 'MEDIUM',
        allowDraftEditing: true,
        maxDraftAge: 30,
        autoSubmitReminder: 7,
        enableStatusHistory: true,
        enableComments: true
      },
      notifications: {
        emailNotifications: true,
        newTicketNotification: true,
        statusChangeNotification: true,
        commentNotification: true,
        assignmentNotification: true,
        reminderNotifications: true,
        smtpServer: 'smtp.company.com',
        smtpPort: 587,
        smtpUsername: 'noreply@company.com',
        smtpPassword: '********'
      },
      security: {
        sessionTimeout: 480,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        passwordMinLength: 8,
        requireSpecialCharacters: true,
        requireNumbers: true,
        passwordExpiry: 90,
        enableTwoFactor: false,
        auditLogging: true
      },
      integrations: {
        pubchemEnabled: true,
        pubchemTimeout: 30,
        pubchemCacheTime: 24,
        enableAutoPopulation: true,
        externalAPITimeout: 10,
        webhookEnabled: false,
        webhookURL: '',
        webhookSecret: ''
      },
      performance: {
        cacheEnabled: true,
        cacheTimeout: 300,
        maxFileSize: 10,
        maxFilesPerTicket: 10,
        databaseBackupEnabled: true,
        backupFrequency: 'daily',
        logRetention: 30,
        enableDebugMode: false
      }
    };

    setSettings(defaultSettings);
  }, []);

  const sections = [
    { id: 'general', name: 'General Settings', icon: CogIcon },
    { id: 'tickets', name: 'Ticket Configuration', icon: DocumentTextIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'integrations', name: 'Integrations', icon: ServerIcon },
    { id: 'performance', name: 'Performance', icon: CircleStackIcon }
  ];

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      // API call to save settings would go here
      console.log('Saving system settings:', settings);
      toast.success('System settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const testConnection = async (type) => {
    try {
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${type} connection test successful`);
    } catch (error) {
      toast.error(`${type} connection test failed`);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Name
          </label>
          <input
            type="text"
            value={settings.general?.systemName || ''}
            onChange={(e) => updateSetting('general', 'systemName', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={settings.general?.companyName || ''}
            onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Description
        </label>
        <textarea
          rows={3}
          value={settings.general?.systemDescription || ''}
          onChange={(e) => updateSetting('general', 'systemDescription', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.general?.timezone || ''}
            onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
            className="form-select"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={settings.general?.dateFormat || ''}
            onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
            className="form-select"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <select
            value={settings.general?.timeFormat || ''}
            onChange={(e) => updateSetting('general', 'timeFormat', e.target.value)}
            className="form-select"
          >
            <option value="12-hour">12 Hour (AM/PM)</option>
            <option value="24-hour">24 Hour</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderTicketSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Number Prefix
          </label>
          <input
            type="text"
            value={settings.tickets?.ticketPrefix || ''}
            onChange={(e) => updateSetting('tickets', 'ticketPrefix', e.target.value)}
            className="form-input"
            placeholder="NPDI"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Priority
          </label>
          <select
            value={settings.tickets?.defaultPriority || ''}
            onChange={(e) => updateSetting('tickets', 'defaultPriority', e.target.value)}
            className="form-select"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Draft Age (days)
          </label>
          <input
            type="number"
            value={settings.tickets?.maxDraftAge || ''}
            onChange={(e) => updateSetting('tickets', 'maxDraftAge', parseInt(e.target.value))}
            className="form-input"
            min="1"
            max="365"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-submit Reminder (days)
          </label>
          <input
            type="number"
            value={settings.tickets?.autoSubmitReminder || ''}
            onChange={(e) => updateSetting('tickets', 'autoSubmitReminder', parseInt(e.target.value))}
            className="form-input"
            min="1"
            max="30"
          />
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'autoTicketNumbers', label: 'Auto-generate ticket numbers' },
          { key: 'allowDraftEditing', label: 'Allow draft editing after submission' },
          { key: 'enableStatusHistory', label: 'Enable status history tracking' },
          { key: 'enableComments', label: 'Enable commenting system' }
        ].map(setting => (
          <div key={setting.key} className="flex items-center">
            <input
              id={setting.key}
              type="checkbox"
              checked={settings.tickets?.[setting.key] || false}
              onChange={(e) => updateSetting('tickets', setting.key, e.target.checked)}
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

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {[
          { key: 'emailNotifications', label: 'Enable email notifications' },
          { key: 'newTicketNotification', label: 'Notify on new ticket creation' },
          { key: 'statusChangeNotification', label: 'Notify on status changes' },
          { key: 'commentNotification', label: 'Notify on new comments' },
          { key: 'assignmentNotification', label: 'Notify on ticket assignment' },
          { key: 'reminderNotifications', label: 'Send reminder notifications' }
        ].map(setting => (
          <div key={setting.key} className="flex items-center">
            <input
              id={setting.key}
              type="checkbox"
              checked={settings.notifications?.[setting.key] || false}
              onChange={(e) => updateSetting('notifications', setting.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={setting.key} className="ml-3 text-sm text-gray-700">
              {setting.label}
            </label>
          </div>
        ))}
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Server
            </label>
            <input
              type="text"
              value={settings.notifications?.smtpServer || ''}
              onChange={(e) => updateSetting('notifications', 'smtpServer', e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={settings.notifications?.smtpPort || ''}
              onChange={(e) => updateSetting('notifications', 'smtpPort', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={settings.notifications?.smtpUsername || ''}
              onChange={(e) => updateSetting('notifications', 'smtpUsername', e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={settings.notifications?.smtpPassword || ''}
              onChange={(e) => updateSetting('notifications', 'smtpPassword', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => testConnection('SMTP')}
            className="btn btn-secondary"
          >
            Test SMTP Connection
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={settings.security?.sessionTimeout || ''}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
            className="form-input"
            min="5"
            max="1440"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={settings.security?.maxLoginAttempts || ''}
            onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
            className="form-input"
            min="1"
            max="10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lockout Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.security?.lockoutDuration || ''}
            onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
            className="form-input"
            min="1"
            max="60"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Length
            </label>
            <input
              type="number"
              value={settings.security?.passwordMinLength || ''}
              onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
              className="form-input"
              min="6"
              max="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Expiry (days)
            </label>
            <input
              type="number"
              value={settings.security?.passwordExpiry || ''}
              onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
              className="form-input"
              min="30"
              max="365"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            { key: 'requireSpecialCharacters', label: 'Require special characters' },
            { key: 'requireNumbers', label: 'Require numbers' },
            { key: 'enableTwoFactor', label: 'Enable two-factor authentication' },
            { key: 'auditLogging', label: 'Enable audit logging' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center">
              <input
                id={setting.key}
                type="checkbox"
                checked={settings.security?.[setting.key] || false}
                onChange={(e) => updateSetting('security', setting.key, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={setting.key} className="ml-3 text-sm text-gray-700">
                {setting.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">PubChem Integration</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="pubchemEnabled"
              type="checkbox"
              checked={settings.integrations?.pubchemEnabled || false}
              onChange={(e) => updateSetting('integrations', 'pubchemEnabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="pubchemEnabled" className="ml-3 text-sm text-gray-700">
              Enable PubChem auto-population
            </label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={settings.integrations?.pubchemTimeout || ''}
                onChange={(e) => updateSetting('integrations', 'pubchemTimeout', parseInt(e.target.value))}
                className="form-input"
                min="5"
                max="60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cache Time (hours)
              </label>
              <input
                type="number"
                value={settings.integrations?.pubchemCacheTime || ''}
                onChange={(e) => updateSetting('integrations', 'pubchemCacheTime', parseInt(e.target.value))}
                className="form-input"
                min="1"
                max="168"
              />
            </div>
          </div>
          
          <button
            onClick={() => testConnection('PubChem')}
            className="btn btn-secondary"
          >
            Test PubChem Connection
          </button>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cache Timeout (seconds)
          </label>
          <input
            type="number"
            value={settings.performance?.cacheTimeout || ''}
            onChange={(e) => updateSetting('performance', 'cacheTimeout', parseInt(e.target.value))}
            className="form-input"
            min="60"
            max="3600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Log Retention (days)
          </label>
          <input
            type="number"
            value={settings.performance?.logRetention || ''}
            onChange={(e) => updateSetting('performance', 'logRetention', parseInt(e.target.value))}
            className="form-input"
            min="7"
            max="365"
          />
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'cacheEnabled', label: 'Enable caching' },
          { key: 'databaseBackupEnabled', label: 'Enable automatic database backups' },
          { key: 'enableDebugMode', label: 'Enable debug mode' }
        ].map(setting => (
          <div key={setting.key} className="flex items-center">
            <input
              id={setting.key}
              type="checkbox"
              checked={settings.performance?.[setting.key] || false}
              onChange={(e) => updateSetting('performance', setting.key, e.target.checked)}
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
      case 'general':
        return renderGeneralSettings();
      case 'tickets':
        return renderTicketSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'integrations':
        return renderIntegrationsSettings();
      case 'performance':
        return renderPerformanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <button
          onClick={saveSettings}
          className="btn btn-primary flex items-center space-x-2"
        >
          <CogIcon className="h-5 w-5" />
          <span>Save Settings</span>
        </button>
      </div>

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
  );
};

export default SystemSettings;