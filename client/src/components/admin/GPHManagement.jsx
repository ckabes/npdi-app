import { useState, useEffect } from 'react';
import {
  ArrowUpTrayIcon as Upload,
  CircleStackIcon as Database,
  ClockIcon as Clock,
  DocumentTextIcon as FileText,
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle
} from '@heroicons/react/24/outline';

const GPHManagement = () => {
  const [statistics, setStatistics] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchStatistics();
    fetchVersions();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/product-hierarchy/statistics');
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/product-hierarchy/versions');
      const data = await response.json();
      if (data.success) {
        setVersions(data.data);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a CSV file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:5000/api/product-hierarchy/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Successfully uploaded version ${data.data.version} with ${data.data.totalRecords.toLocaleString()} records`);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-file-input');
        if (fileInput) fileInput.value = '';

        // Refresh data
        await fetchStatistics();
        await fetchVersions();
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Hierarchy (GPH) Management</h2>
        <p className="text-gray-600">Upload and manage the product hierarchy CSV file used in ticket creation.</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Current Version</p>
                <p className="text-2xl font-bold text-blue-900">v{statistics.currentVersion}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Total Records</p>
                <p className="text-2xl font-bold text-green-900">{statistics.stats.totalRecords?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Last Updated</p>
                <p className="text-sm font-semibold text-purple-900">{formatDate(statistics.lastUpdated)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New CSV</h3>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* File Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="csv-file-input" className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? uploadProgress : 'Upload CSV'}</span>
          </button>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">Important Notes:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Uploading a new CSV will create a new version and replace the active hierarchy</li>
              <li>Maximum file size: 50MB</li>
              <li>Previous versions are preserved for reference</li>
            </ul>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-900 font-semibold mb-2">Required CSV Format & Headers:</p>
            <p className="text-xs text-gray-700 mb-3">
              The CSV file must contain the following column headers (case-sensitive):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-gray-800">
              <div className="bg-white rounded px-2 py-1">Business_DIV</div>
              <div className="bg-white rounded px-2 py-1">Business_DIV_description</div>
              <div className="bg-white rounded px-2 py-1">Business_Unit_SDV</div>
              <div className="bg-white rounded px-2 py-1">Business_Unit_SDV_description</div>
              <div className="bg-white rounded px-2 py-1">Business_Field_BD</div>
              <div className="bg-white rounded px-2 py-1">Business_Field_BD_description</div>
              <div className="bg-white rounded px-2 py-1">Business_Line_BF</div>
              <div className="bg-white rounded px-2 py-1">Business_Line_BF_description</div>
              <div className="bg-white rounded px-2 py-1">Product_Group_SBU</div>
              <div className="bg-white rounded px-2 py-1">Product_Group_SBU_description</div>
              <div className="bg-white rounded px-2 py-1">Main_Group</div>
              <div className="bg-white rounded px-2 py-1">Main_Group_description</div>
              <div className="bg-white rounded px-2 py-1">PRODH_LEVEL</div>
              <div className="bg-white rounded px-2 py-1">PRODH_12</div>
              <div className="bg-white rounded px-2 py-1">PRODH_SBU</div>
              <div className="bg-white rounded px-2 py-1">PRODH_TEXT</div>
              <div className="bg-white rounded px-2 py-1">valid_SBU_GPH_comb</div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              <strong>Note:</strong> Column order does not matter, but all required headers must be present.
              Missing or misspelled headers will cause the upload to fail.
            </p>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version History</h3>

        {versions.length === 0 ? (
          <p className="text-gray-500 text-sm">No versions uploaded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {versions.map((version) => (
                  <tr key={version._id} className={version.isActive ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">v{version.metadata.version}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {version.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {version.stats.totalRecords?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {version.stats.divisionsCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {version.metadata.uploadedBy
                        ? `${version.metadata.uploadedBy.firstName} ${version.metadata.uploadedBy.lastName}`
                        : 'System'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(version.metadata.generatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPHManagement;
