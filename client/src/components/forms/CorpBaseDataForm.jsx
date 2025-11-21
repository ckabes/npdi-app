import React, { useState } from 'react';
import UNSPSCSelector from './UNSPSCSelector';

/**
 * CorpBaseDataForm Component
 * Shared form for CorpBase website information across ticket creation and editing
 *
 * @param {Object} props
 * @param {Function} props.register - react-hook-form register function
 * @param {Function} props.setValue - react-hook-form setValue function
 * @param {Function} props.watch - react-hook-form watch function
 * @param {Function} props.onGenerateDescription - callback for generating product description
 * @param {boolean} props.readOnly - whether form should be read-only
 * @param {boolean} props.showGenerateButton - whether to show generate description button
 * @param {boolean} props.isGenerating - whether AI content is currently being generated
 * @param {Object} props.fieldsLoading - loading state for individual fields
 */
const CorpBaseDataForm = ({
  register,
  setValue,
  watch,
  onGenerateDescription,
  readOnly = false,
  showGenerateButton = true,
  isGenerating = false,
  fieldsLoading = {}
}) => {
  const [isUNSPSCSelectorOpen, setIsUNSPSCSelectorOpen] = useState(false);

  // Watch the UNSPSC code value
  const unspscCode = watch('corpbaseData.unspscCode');
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4 text-blue-600 inline-block ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Success checkmark component
  const SuccessCheck = () => (
    <svg className="h-4 w-4 text-green-600 inline-block ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">CorpBase Website Information</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              AI-Powered
            </span>
          </div>
          {showGenerateButton && onGenerateDescription && !readOnly && (
            <button
              type="button"
              onClick={onGenerateDescription}
              disabled={isGenerating}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating with AI...
                </>
              ) : (
                'Generate with AI'
              )}
            </button>
          )}
        </div>
      </div>
      <div className="card-body space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Description {showGenerateButton && !readOnly && '(AI-Generated)'}
            {fieldsLoading.productDescription && <LoadingSpinner />}
          </label>
          <textarea
            {...register('corpbaseData.productDescription')}
            rows="4"
            className={`form-input ${fieldsLoading.productDescription ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
            placeholder={showGenerateButton && !readOnly ? "Click 'Generate with AI' to auto-generate based on product name and chemical properties..." : "Product description"}
            readOnly={readOnly || isGenerating}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website Title
              {fieldsLoading.websiteTitle && <LoadingSpinner />}
            </label>
            <input
              {...register('corpbaseData.websiteTitle')}
              type="text"
              className={`form-input ${fieldsLoading.websiteTitle ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              placeholder="SEO-optimized title for website"
              readOnly={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
              {fieldsLoading.metaDescription && <LoadingSpinner />}
            </label>
            <textarea
              {...register('corpbaseData.metaDescription')}
              rows="2"
              className={`form-input ${fieldsLoading.metaDescription ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              placeholder="Brief description for search engines (150-160 characters)"
              readOnly={readOnly}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Features & Benefits
            {fieldsLoading.keyFeatures && <LoadingSpinner />}
          </label>
          <textarea
            {...register('corpbaseData.keyFeatures')}
            rows="3"
            className={`form-input ${fieldsLoading.keyFeatures ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
            placeholder="• High purity and quality&#10;• Suitable for research applications&#10;• Available in multiple sizes"
            readOnly={readOnly}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applications
              {fieldsLoading.applications && <LoadingSpinner />}
            </label>
            <textarea
              {...register('corpbaseData.applications')}
              rows="3"
              className={`form-input ${fieldsLoading.applications ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              placeholder="List key applications..."
              readOnly={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Industries
              {fieldsLoading.targetIndustries && <LoadingSpinner />}
            </label>
            <textarea
              {...register('corpbaseData.targetIndustries')}
              rows="3"
              className={`form-input ${fieldsLoading.targetIndustries ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              placeholder="Pharmaceutical, Biotechnology, Research..."
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* UNSPSC Code Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UNSPSC Code
            <span className="text-xs text-gray-500 ml-2">(United Nations Standard Products and Services Code)</span>
          </label>
          <div className="flex gap-2">
            <input
              {...register('corpbaseData.unspscCode')}
              type="text"
              className="form-input flex-1"
              placeholder="Select UNSPSC classification code..."
              readOnly={readOnly}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => setIsUNSPSCSelectorOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse
              </button>
            )}
          </div>
          {unspscCode && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: <span className="font-medium">{unspscCode}</span>
            </p>
          )}
        </div>
      </div>

      {/* UNSPSC Selector Modal */}
      <UNSPSCSelector
        isOpen={isUNSPSCSelectorOpen}
        onClose={() => setIsUNSPSCSelectorOpen(false)}
        onSelect={(code) => setValue('corpbaseData.unspscCode', code, { shouldDirty: true })}
        currentValue={unspscCode}
      />
    </div>
  );
};

export default CorpBaseDataForm;
