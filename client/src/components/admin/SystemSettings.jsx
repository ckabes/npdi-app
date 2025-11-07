import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  ServerIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { systemSettingsAPI } from '../../services/api';

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingsAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('Failed to load system settings');
      // Set default settings on error
      setSettings({
        general: {
          systemName: 'NPDI Application',
          systemDescription: 'New Product Development & Introduction System',
          companyName: 'Company Name',
          supportEmail: 'support@company.com'
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
        security: {
          sessionTimeout: 480,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
          passwordMinLength: 8,
          requireSpecialCharacters: true,
          requireNumbers: true,
          requireUppercase: true,
          passwordExpiry: 90,
          enableTwoFactor: false,
          auditLogging: true
        },
        integrations: {
          pubchem: {
            enabled: true,
            timeout: 30,
            cacheTime: 24,
            autoPopulation: true
          },
          teams: {
            enabled: false,
            webhookUrl: '',
            notifyOnStatusChange: true,
            notifyOnTicketCreated: false,
            notifyOnCommentAdded: false,
            notifyOnAssignment: false
          },
          webhook: {
            enabled: false,
            url: '',
            secret: ''
          },
          externalAPI: {
            timeout: 10,
            retryAttempts: 3
          }
        },
        performance: {
          cache: {
            enabled: true,
            timeout: 300
          },
          files: {
            maxFileSize: 10,
            maxFilesPerTicket: 10
          },
          database: {
            backupEnabled: true,
            backupFrequency: 'daily',
            backupRetention: 30
          },
          logging: {
            logRetention: 30,
            enableDebugMode: false,
            logLevel: 'info'
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'general', name: 'General Settings', icon: CogIcon },
    { id: 'tickets', name: 'Ticket Configuration', icon: DocumentTextIcon },
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
      setSaving(true);
      await systemSettingsAPI.updateSettings(settings);
      toast.success('System settings saved successfully');
      // Refresh settings to get any server-side processing
      await fetchSettings();
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testPubChemConnection = async () => {
    try {
      const response = await systemSettingsAPI.testPubChem();
      if (response.data.success) {
        toast.success(`PubChem connection successful - Test compound: ${response.data.testData?.compound}`);
      } else {
        toast.error('PubChem connection test failed');
      }
    } catch (error) {
      console.error('PubChem test error:', error);
      toast.error(error.response?.data?.message || 'PubChem connection test failed');
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={settings.general?.supportEmail || ''}
            onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
            className="form-input"
            placeholder="support@company.com"
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Timezone, date format, and time format are now user-specific preferences.
          Each user can set their own preferences in their profile settings.
        </p>
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
      {/* PubChem Integration */}
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">PubChem Integration</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="pubchemEnabled"
              type="checkbox"
              checked={settings.integrations?.pubchem?.enabled || false}
              onChange={(e) => {
                const newIntegrations = { ...settings.integrations };
                newIntegrations.pubchem = { ...newIntegrations.pubchem, enabled: e.target.checked };
                setSettings(prev => ({ ...prev, integrations: newIntegrations }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="pubchemEnabled" className="ml-3 text-sm text-gray-700">
              Enable PubChem auto-population
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={settings.integrations?.pubchem?.timeout || ''}
                onChange={(e) => {
                  const newIntegrations = { ...settings.integrations };
                  newIntegrations.pubchem = { ...newIntegrations.pubchem, timeout: parseInt(e.target.value) };
                  setSettings(prev => ({ ...prev, integrations: newIntegrations }));
                }}
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
                value={settings.integrations?.pubchem?.cacheTime || ''}
                onChange={(e) => {
                  const newIntegrations = { ...settings.integrations };
                  newIntegrations.pubchem = { ...newIntegrations.pubchem, cacheTime: parseInt(e.target.value) };
                  setSettings(prev => ({ ...prev, integrations: newIntegrations }));
                }}
                className="form-input"
                min="1"
                max="168"
              />
            </div>
            <div className="flex items-center">
              <input
                id="pubchemAutoPopulation"
                type="checkbox"
                checked={settings.integrations?.pubchem?.autoPopulation || false}
                onChange={(e) => {
                  const newIntegrations = { ...settings.integrations };
                  newIntegrations.pubchem = { ...newIntegrations.pubchem, autoPopulation: e.target.checked };
                  setSettings(prev => ({ ...prev, integrations: newIntegrations }));
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="pubchemAutoPopulation" className="ml-2 text-sm text-gray-700">
                Auto-populate fields
              </label>
            </div>
          </div>

          <button
            onClick={testPubChemConnection}
            className="btn btn-secondary"
          >
            Test PubChem Connection
          </button>
        </div>
      </div>

      {/* Microsoft Teams Integration */}
      <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Microsoft Teams Integration</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="teamsEnabled"
              type="checkbox"
              checked={settings.integrations?.teams?.enabled || false}
              onChange={(e) => {
                const newIntegrations = { ...settings.integrations };
                if (!newIntegrations.teams) newIntegrations.teams = {};
                newIntegrations.teams = { ...newIntegrations.teams, enabled: e.target.checked };
                setSettings(prev => ({ ...prev, integrations: newIntegrations }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="teamsEnabled" className="ml-3 text-sm font-semibold text-gray-700">
              Enable Teams notifications
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teams Webhook URL
            </label>
            <input
              type="url"
              value={settings.integrations?.teams?.webhookUrl || ''}
              onChange={(e) => {
                const newIntegrations = { ...settings.integrations };
                if (!newIntegrations.teams) newIntegrations.teams = {};
                newIntegrations.teams = { ...newIntegrations.teams, webhookUrl: e.target.value };
                setSettings(prev => ({ ...prev, integrations: newIntegrations }));
              }}
              className="form-input"
              placeholder="https://your-org.webhook.office.com/webhookb2/..."
              disabled={!settings.integrations?.teams?.enabled}
            />
            <p className="mt-1 text-xs text-gray-500">
              Get this URL from Teams: Channel → ⋯ → Connectors → Incoming Webhook
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Notification Events</p>
            <div className="space-y-2">
              {[
                { key: 'notifyOnStatusChange', label: 'Notify on status changes', description: 'Send notification when ticket status changes' },
                { key: 'notifyOnTicketCreated', label: 'Notify on ticket creation', description: 'Send notification when new tickets are created' },
                { key: 'notifyOnCommentAdded', label: 'Notify on comments', description: 'Send notification when comments are added' },
                { key: 'notifyOnAssignment', label: 'Notify on assignment', description: 'Send notification when tickets are assigned' }
              ].map(event => (
                <div key={event.key} className="flex items-start">
                  <input
                    id={event.key}
                    type="checkbox"
                    checked={settings.integrations?.teams?.[event.key] || false}
                    onChange={(e) => {
                      const newIntegrations = { ...settings.integrations };
                      if (!newIntegrations.teams) newIntegrations.teams = {};
                      newIntegrations.teams = { ...newIntegrations.teams, [event.key]: e.target.checked };
                      setSettings(prev => ({ ...prev, integrations: newIntegrations }));
                    }}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={!settings.integrations?.teams?.enabled}
                  />
                  <div className="ml-3">
                    <label htmlFor={event.key} className="text-sm text-gray-700">
                      {event.label}
                    </label>
                    <p className="text-xs text-gray-500">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Setup Instructions:</strong><br />
              1. In Teams, go to your channel → ⋯ menu → Connectors<br />
              2. Search for "Incoming Webhook" and click Configure<br />
              3. Give it a name (e.g., "NPDI Notifications") and upload an icon if desired<br />
              4. Copy the webhook URL and paste it above<br />
              5. Enable the notification events you want to receive
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Integration */}
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Webhook Integration</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="webhookEnabled"
              type="checkbox"
              checked={settings.integrations?.webhook?.enabled || false}
              onChange={(e) => {
                const newIntegrations = { ...settings.integrations };
                newIntegrations.webhook = { ...newIntegrations.webhook, enabled: e.target.checked };
                setSettings(prev => ({ ...prev, integrations: newIntegrations }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="webhookEnabled" className="ml-3 text-sm text-gray-700">
              Enable webhook notifications
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={settings.integrations?.webhook?.url || ''}
                onChange={(e) => {
                  const newIntegrations = { ...settings.integrations };
                  newIntegrations.webhook = { ...newIntegrations.webhook, url: e.target.value };
                  setSettings(prev => ({ ...prev, integrations: newIntegrations }));
                }}
                className="form-input"
                placeholder="https://your-webhook-url.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret
              </label>
              <input
                type="password"
                value={settings.integrations?.webhook?.secret || ''}
                onChange={(e) => {
                  const newIntegrations = { ...settings.integrations };
                  newIntegrations.webhook = { ...newIntegrations.webhook, secret: e.target.value };
                  setSettings(prev => ({ ...prev, integrations: newIntegrations }));
                }}
                className="form-input"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      {/* Cache Settings */}
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Cache Settings</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="cacheEnabled"
              type="checkbox"
              checked={settings.performance?.cache?.enabled || false}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.cache = { ...newPerformance.cache, enabled: e.target.checked };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cacheEnabled" className="ml-3 text-sm text-gray-700">
              Enable caching
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cache Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.performance?.cache?.timeout || ''}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.cache = { ...newPerformance.cache, timeout: parseInt(e.target.value) };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="form-input"
              min="60"
              max="3600"
            />
          </div>
        </div>
      </div>

      {/* File Settings */}
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">File Upload Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={settings.performance?.files?.maxFileSize || ''}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.files = { ...newPerformance.files, maxFileSize: parseInt(e.target.value) };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="form-input"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Files Per Ticket
            </label>
            <input
              type="number"
              value={settings.performance?.files?.maxFilesPerTicket || ''}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.files = { ...newPerformance.files, maxFilesPerTicket: parseInt(e.target.value) };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="form-input"
              min="1"
              max="50"
            />
          </div>
        </div>
      </div>

      {/* Database Settings */}
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Database & Backup</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="backupEnabled"
              type="checkbox"
              checked={settings.performance?.database?.backupEnabled || false}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.database = { ...newPerformance.database, backupEnabled: e.target.checked };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="backupEnabled" className="ml-3 text-sm text-gray-700">
              Enable automatic database backups
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings.performance?.database?.backupFrequency || 'daily'}
                onChange={(e) => {
                  const newPerformance = { ...settings.performance };
                  newPerformance.database = { ...newPerformance.database, backupFrequency: e.target.value };
                  setSettings(prev => ({ ...prev, performance: newPerformance }));
                }}
                className="form-select"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Retention (days)
              </label>
              <input
                type="number"
                value={settings.performance?.database?.backupRetention || ''}
                onChange={(e) => {
                  const newPerformance = { ...settings.performance };
                  newPerformance.database = { ...newPerformance.database, backupRetention: parseInt(e.target.value) };
                  setSettings(prev => ({ ...prev, performance: newPerformance }));
                }}
                className="form-input"
                min="7"
                max="365"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logging Settings */}
      <div className="border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Logging</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Retention (days)
            </label>
            <input
              type="number"
              value={settings.performance?.logging?.logRetention || ''}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.logging = { ...newPerformance.logging, logRetention: parseInt(e.target.value) };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="form-input"
              min="7"
              max="365"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Level
            </label>
            <select
              value={settings.performance?.logging?.logLevel || 'info'}
              onChange={(e) => {
                const newPerformance = { ...settings.performance };
                newPerformance.logging = { ...newPerformance.logging, logLevel: e.target.value };
                setSettings(prev => ({ ...prev, performance: newPerformance }));
              }}
              className="form-select"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <input
            id="debugMode"
            type="checkbox"
            checked={settings.performance?.logging?.enableDebugMode || false}
            onChange={(e) => {
              const newPerformance = { ...settings.performance };
              newPerformance.logging = { ...newPerformance.logging, enableDebugMode: e.target.checked };
              setSettings(prev => ({ ...prev, performance: newPerformance }));
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="debugMode" className="ml-3 text-sm text-gray-700">
            Enable debug mode
          </label>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'tickets':
        return renderTicketSettings();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

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
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CogIcon className="h-5 w-5" />
              <span>Save Settings</span>
            </>
          )}
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