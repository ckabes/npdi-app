import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { parseQualitySpecsBatch, normalizeOperator } from '../../utils/qualitySpecParser';

/**
 * QualitySpecificationsForm Component
 * Shared form for quality specifications across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {Function} props.setValue - react-hook-form setValue function
 * @param {Array} props.qualityFields - useFieldArray fields for quality attributes
 * @param {Function} props.appendQuality - useFieldArray append function
 * @param {Function} props.removeQuality - useFieldArray remove function
 * @param {boolean} props.readOnly - whether form should be read-only
 * @param {boolean} props.editMode - whether in edit mode (affects attribute editing)
 * @param {Set} props.sapImportedFields - set of field paths that were imported from SAP
 * @param {Function} props.getSAPImportedClass - function to get CSS class for SAP-imported fields
 * @param {Function} props.onFieldEdit - handler for when a field is edited (removes green highlight)
 */
const QualitySpecificationsForm = ({
  register,
  watch,
  setValue,
  qualityFields = [],
  appendQuality,
  removeQuality,
  readOnly = false,
  editMode = false,
  sapImportedFields = new Set(),
  getSAPImportedClass = () => '',
  onFieldEdit = null
}) => {
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityFormData, setQualityFormData] = useState({
    testAttribute: '',
    dataSource: 'QC',
    valueRange: '',
    comments: ''
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [nlpInput, setNlpInput] = useState('');
  const [showNlpPreview, setShowNlpPreview] = useState(false);
  const [parsedResults, setParsedResults] = useState(null);
  const [showSeparatorInfo, setShowSeparatorInfo] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingRowData, setEditingRowData] = useState(null);

  const handleAddQualityAttribute = () => {
    if (!qualityFormData.testAttribute || !qualityFormData.valueRange) {
      toast.error('Test/Attribute and Value/Range are required');
      return;
    }

    if (editingIndex !== null) {
      // Update existing attribute using setValue
      setValue(`quality.attributes.${editingIndex}.testAttribute`, qualityFormData.testAttribute);
      setValue(`quality.attributes.${editingIndex}.dataSource`, qualityFormData.dataSource);
      setValue(`quality.attributes.${editingIndex}.valueRange`, qualityFormData.valueRange);
      setValue(`quality.attributes.${editingIndex}.comments`, qualityFormData.comments);
      toast.success('Quality attribute updated!');
    } else {
      // Add new attribute
      appendQuality({
        testAttribute: qualityFormData.testAttribute,
        dataSource: qualityFormData.dataSource,
        valueRange: qualityFormData.valueRange,
        comments: qualityFormData.comments
      });
      toast.success('Quality attribute added!');
    }

    // Reset form
    setQualityFormData({
      testAttribute: '',
      dataSource: 'QC',
      valueRange: '',
      comments: ''
    });
    setEditingIndex(null);
    setShowQualityModal(false);
  };

  const handleParseNLP = () => {
    if (!nlpInput.trim()) {
      toast.error('Please enter quality specifications to parse');
      return;
    }

    // Normalize operators in the input
    const normalized = normalizeOperator(nlpInput);
    const results = parseQualitySpecsBatch(normalized);

    setParsedResults(results);
    setShowNlpPreview(true);

    if (results.errorCount > 0) {
      toast.error(`Could not parse ${results.errorCount} specification(s). Review the preview.`);
    } else {
      toast.success(`Successfully parsed ${results.successCount} specification(s)!`);
    }
  };

  const handleConfirmParsed = () => {
    if (!parsedResults || parsedResults.results.length === 0) {
      return;
    }

    // Add all successfully parsed attributes
    parsedResults.results.forEach(result => {
      appendQuality({
        testAttribute: result.testAttribute,
        dataSource: result.dataSource,
        valueRange: result.valueRange,
        comments: result.comments
      });
    });

    toast.success(`Added ${parsedResults.results.length} quality attribute(s)!`);

    // Reset
    setNlpInput('');
    setParsedResults(null);
    setShowNlpPreview(false);
  };

  const handleEditRow = (index) => {
    const attribute = watch(`quality.attributes.${index}`);
    setEditingRowIndex(index);
    setEditingRowData({
      testAttribute: attribute.testAttribute,
      dataSource: attribute.dataSource,
      valueRange: attribute.valueRange,
      comments: attribute.comments || ''
    });
  };

  const handleSaveRow = (index) => {
    if (!editingRowData.testAttribute || !editingRowData.valueRange) {
      toast.error('Test/Attribute and Value/Range are required');
      return;
    }

    // Update using setValue
    setValue(`quality.attributes.${index}.testAttribute`, editingRowData.testAttribute);
    setValue(`quality.attributes.${index}.dataSource`, editingRowData.dataSource);
    setValue(`quality.attributes.${index}.valueRange`, editingRowData.valueRange);
    setValue(`quality.attributes.${index}.comments`, editingRowData.comments);

    toast.success('Quality attribute updated!');
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleEditViaModal = (index) => {
    const attribute = watch(`quality.attributes.${index}`);
    setQualityFormData({
      testAttribute: attribute.testAttribute,
      dataSource: attribute.dataSource,
      valueRange: attribute.valueRange,
      comments: attribute.comments || ''
    });
    setEditingIndex(index);
    setShowQualityModal(true);
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
            onChange={(e) => {
              // Call the original onChange from register
              const event = { target: { name: 'quality.mqQualityLevel', value: e.target.value } };
              register('quality.mqQualityLevel').onChange(event);
              // Call onFieldEdit to remove green highlight
              if (onFieldEdit) {
                onFieldEdit('quality.mqQualityLevel');
              }
            }}
            className={`form-select max-w-xs ${getSAPImportedClass('quality.mqQualityLevel')}`}
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

        {/* Natural Language Input - Quick Entry */}
        {!readOnly && !editMode && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Quick Entry
              </h4>
              <button
                type="button"
                onClick={() => setShowSeparatorInfo(!showSeparatorInfo)}
                className="text-purple-600 hover:text-purple-800"
                title="How to use the parser"
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {showSeparatorInfo && (
              <div className="mb-3 p-3 bg-white rounded border border-purple-200">
                <p className="text-sm text-gray-700 mb-3">
                  Just type your quality specs in plain language and click <strong>Decipher</strong>. The parser will automatically format them into structured table entries.
                  For example, type something like <span className="italic">"purity ≥99% by gc, appearance is clear, ph 6.5-7.5"</span> and watch it transform into proper quality attributes!
                </p>
                <p className="text-xs font-medium text-gray-700 mb-2">How to separate specifications:</p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  <li>• <strong>Comma (,)</strong> - Most common separator</li>
                  <li>• <strong>Semicolon (;)</strong> - Alternative separator</li>
                  <li>• <strong>Pipe (|)</strong> - Alternative separator</li>
                  <li>• <strong>Word "and"</strong> - Natural language separator</li>
                  <li>• <strong>New line</strong> - One specification per line</li>
                </ul>
                <p className="text-xs text-gray-700 font-medium mb-1">Supported formats:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• With operators: <span className="italic">purity ≥99% by gc</span></li>
                  <li>• Ranges: <span className="italic">ph 6.5-7.5</span></li>
                  <li>• With "of": <span className="italic">purity of 99.8% by hplc</span></li>
                  <li>• With "is": <span className="italic">water content is ≤50 ppm</span></li>
                  <li>• Conforms: <span className="italic">conforms to structure by 1hnmr</span></li>
                  <li>• With colon: <span className="italic">appearance: white powder</span></li>
                </ul>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Note: Capitalization is automatic. Methods are auto-assigned if not specified.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
                rows="2"
                className="form-input text-sm flex-1"
                placeholder="purity ≥99.9% by gc, ph 6.5-7.5, appearance: white powder"
              />
              <button
                type="button"
                onClick={handleParseNLP}
                disabled={!nlpInput.trim()}
                className="btn btn-primary flex items-center self-start px-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Decipher
              </button>
            </div>
          </div>
        )}

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
                  <tr key={field.id} className={editingRowIndex === index ? 'bg-blue-50' : ''}>
                    {editingRowIndex === index ? (
                      <>
                        {/* Editing Mode */}
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            value={editingRowData.testAttribute}
                            onChange={(e) => setEditingRowData({...editingRowData, testAttribute: e.target.value})}
                            className="form-input text-sm w-full"
                            placeholder="Test/Attribute"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={editingRowData.dataSource}
                            onChange={(e) => setEditingRowData({...editingRowData, dataSource: e.target.value})}
                            className="form-select text-sm w-full"
                          >
                            <option value="QC">QC</option>
                            <option value="Vendor">Vendor</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            value={editingRowData.valueRange}
                            onChange={(e) => setEditingRowData({...editingRowData, valueRange: e.target.value})}
                            className="form-input text-sm w-full"
                            placeholder="Value/Range"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            value={editingRowData.comments}
                            onChange={(e) => setEditingRowData({...editingRowData, comments: e.target.value})}
                            className="form-input text-sm w-full"
                            placeholder="Comments"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSaveRow(index)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800"
                              title="Cancel"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Display Mode */}
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
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditRow(index)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit inline"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeQuality(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
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
              <h3 className="text-lg font-medium text-gray-900">
                {editingIndex !== null ? 'Edit Quality Attribute' : 'Add Quality Attribute'}
              </h3>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Value/Range *
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500 mr-1">Insert:</span>
                    <button
                      type="button"
                      onClick={() => setQualityFormData({...qualityFormData, valueRange: qualityFormData.valueRange + '≥'})}
                      className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                      title="Insert greater than or equal to symbol"
                    >
                      ≥
                    </button>
                    <button
                      type="button"
                      onClick={() => setQualityFormData({...qualityFormData, valueRange: qualityFormData.valueRange + '≤'})}
                      className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                      title="Insert less than or equal to symbol"
                    >
                      ≤
                    </button>
                  </div>
                </div>
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
                  setEditingIndex(null);
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
                {editingIndex !== null ? 'Update Attribute' : 'Add Attribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NLP Parse Preview Modal */}
      {showNlpPreview && parsedResults && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">Natural Language Input</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and confirm {parsedResults.successCount} parsed specification(s)
              </p>
            </div>

            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {parsedResults.results.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">
                    Quality Attributes to Add:
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Original Text
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Test/Attribute
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Value/Range
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Comments
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedResults.results.map((result, idx) => (
                          <tr key={idx} className="hover:bg-green-50">
                            <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                              {result.originalText}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">
                              {result.testAttribute}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {result.valueRange}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {result.comments || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedResults.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                    ✗ Failed to Parse ({parsedResults.errorCount})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="text-sm text-red-700 space-y-1">
                      {parsedResults.errors.map((error, idx) => (
                        <li key={idx}>
                          #{error.specNumber}: {error.originalText}
                          <span className="text-xs text-red-600 ml-2">({error.error})</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-600 mt-2">
                      These specifications could not be parsed. You can add them manually using the form.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <p className="text-sm text-gray-600">
                {parsedResults.successCount > 0
                  ? `Click confirm to add ${parsedResults.successCount} attribute(s) to the table`
                  : 'No valid specifications to add'}
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNlpPreview(false);
                    setParsedResults(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmParsed}
                  disabled={parsedResults.successCount === 0}
                  className="btn btn-primary"
                >
                  Confirm & Add ({parsedResults.successCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualitySpecificationsForm;
