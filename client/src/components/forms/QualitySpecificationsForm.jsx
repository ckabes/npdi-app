import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * QualitySpecificationsForm Component
 * Shared form for quality specifications across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {Array} props.qualityFields - useFieldArray fields for quality attributes
 * @param {Function} props.appendQuality - useFieldArray append function
 * @param {Function} props.removeQuality - useFieldArray remove function
 * @param {boolean} props.readOnly - whether form should be read-only
 * @param {boolean} props.editMode - whether in edit mode (affects attribute editing)
 */
const QualitySpecificationsForm = ({
  register,
  watch,
  qualityFields = [],
  appendQuality,
  removeQuality,
  readOnly = false,
  editMode = false
}) => {
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityFormData, setQualityFormData] = useState({
    testAttribute: '',
    dataSource: 'QC',
    valueRange: '',
    comments: ''
  });

  const handleAddQualityAttribute = () => {
    if (!qualityFormData.testAttribute || !qualityFormData.valueRange) {
      toast.error('Test/Attribute and Value/Range are required');
      return;
    }

    appendQuality({
      testAttribute: qualityFormData.testAttribute,
      dataSource: qualityFormData.dataSource,
      valueRange: qualityFormData.valueRange,
      comments: qualityFormData.comments
    });

    // Reset form
    setQualityFormData({
      testAttribute: '',
      dataSource: 'QC',
      valueRange: '',
      comments: ''
    });
    setShowQualityModal(false);
    toast.success('Quality attribute added!');
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Quality Specifications</h3>
          {!readOnly && !editMode && (
            <button
              type="button"
              onClick={() => setShowQualityModal(true)}
              className="btn btn-secondary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Quality Attribute
            </button>
          )}
        </div>
      </div>
      <div className="card-body space-y-6">
        {/* MQ Quality Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MQ Quality Level
          </label>
          <select
            {...register('quality.mqQualityLevel')}
            className="form-select max-w-xs"
            disabled={readOnly}
          >
            <option value="N/A">N/A</option>
            <option value="MQ100">MQ100</option>
            <option value="MQ200">MQ200</option>
            <option value="MQ300">MQ300</option>
            <option value="MQ400">MQ400</option>
            <option value="MQ500">MQ500</option>
            <option value="MQ600">MQ600</option>
          </select>
        </div>

        {/* Edit Mode Note */}
        {editMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Quality attributes are read-only in edit mode. They can only be defined during ticket creation.
            </p>
          </div>
        )}

        {/* Quality Attributes Table */}
        {qualityFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-lg font-medium">No quality attributes added yet</p>
            {!readOnly && !editMode && (
              <p className="text-sm">Click "Add Quality Attribute" to add test specifications</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test/Attribute
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value/Range
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  {!readOnly && !editMode && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qualityFields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {watch(`quality.attributes.${index}.testAttribute`)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        watch(`quality.attributes.${index}.dataSource`) === 'QC'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {watch(`quality.attributes.${index}.dataSource`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {watch(`quality.attributes.${index}.valueRange`)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {watch(`quality.attributes.${index}.comments`) || '-'}
                    </td>
                    {!readOnly && !editMode && (
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => removeQuality(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quality Attribute Modal */}
      {showQualityModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Quality Attribute</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test/Attribute *
                </label>
                <input
                  type="text"
                  value={qualityFormData.testAttribute}
                  onChange={(e) => setQualityFormData({...qualityFormData, testAttribute: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Purity, Appearance, pH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Source *
                </label>
                <select
                  value={qualityFormData.dataSource}
                  onChange={(e) => setQualityFormData({...qualityFormData, dataSource: e.target.value})}
                  className="form-select"
                >
                  <option value="QC">QC</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value/Range *
                </label>
                <input
                  type="text"
                  value={qualityFormData.valueRange}
                  onChange={(e) => setQualityFormData({...qualityFormData, valueRange: e.target.value})}
                  className="form-input"
                  placeholder="e.g., ≥98%, 6.5-7.5, White powder"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={qualityFormData.comments}
                  onChange={(e) => setQualityFormData({...qualityFormData, comments: e.target.value})}
                  rows="2"
                  className="form-input"
                  placeholder="Optional notes or additional information"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowQualityModal(false);
                  setQualityFormData({
                    testAttribute: '',
                    dataSource: 'QC',
                    valueRange: '',
                    comments: ''
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddQualityAttribute}
                className="btn btn-primary"
              >
                Add Attribute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualitySpecificationsForm;
