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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewField, setPreviewField] = useState(null);
  const [editedHtml, setEditedHtml] = useState('');
  const textareaRef = React.useRef(null);

  // Watch the UNSPSC code value and all HTML fields
  const unspscCode = watch('corpbaseData.unspscCode');
  const productDescription = watch('corpbaseData.productDescription');
  const keyFeatures = watch('corpbaseData.keyFeatures');
  const applications = watch('corpbaseData.applications');
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

  // Fix orphaned <li> tags by wrapping them in <ul>
  const fixOrphanedListItems = (html) => {
    if (!html) return html;

    // Check if there are <li> tags without a parent <ul> or <ol>
    // This regex finds <li> tags that aren't inside <ul> or <ol>
    const hasOrphanedLi = /<li[^>]*>/.test(html) && !/<ul[^>]*>/.test(html) && !/<ol[^>]*>/.test(html);

    if (hasOrphanedLi) {
      // Wrap all content in a <ul> tag
      return `<ul>\n${html}\n</ul>`;
    }

    return html;
  };

  // Handle preview opening
  const handlePreview = (field, content) => {
    setPreviewField({ field, content });
    const fixedHtml = fixOrphanedListItems(content || '');
    setEditedHtml(fixedHtml);
    setIsPreviewOpen(true);
  };

  // Handle saving edited HTML back to form
  const handleSaveHtml = () => {
    const fieldName = previewField.field;
    let formFieldKey = '';

    if (fieldName === 'Product Description') {
      formFieldKey = 'corpbaseData.productDescription';
    } else if (fieldName === 'Key Features & Benefits') {
      formFieldKey = 'corpbaseData.keyFeatures';
    } else if (fieldName === 'Applications') {
      formFieldKey = 'corpbaseData.applications';
    }

    if (formFieldKey) {
      setValue(formFieldKey, editedHtml, { shouldDirty: true });
    }

    setIsPreviewOpen(false);
  };

  // Apply HTML formatting to selected text
  const applyFormatting = (tag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedHtml.substring(start, end);

    if (!selectedText) {
      alert('Please select some text first');
      return;
    }

    let wrappedText = '';
    switch (tag) {
      case 'bold':
        wrappedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        wrappedText = `<em>${selectedText}</em>`;
        break;
      case 'sub':
        wrappedText = `<sub>${selectedText}</sub>`;
        break;
      case 'sup':
        wrappedText = `<sup>${selectedText}</sup>`;
        break;
      default:
        return;
    }

    const newHtml = editedHtml.substring(0, start) + wrappedText + editedHtml.substring(end);
    setEditedHtml(newHtml);

    // Restore focus and update cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + wrappedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Insert special character at cursor position
  const insertSymbol = (symbol) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newHtml = editedHtml.substring(0, start) + symbol + editedHtml.substring(end);
    setEditedHtml(newHtml);

    // Restore focus and update cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + symbol.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Description {showGenerateButton && !readOnly && '(AI-Generated HTML)'}
              {fieldsLoading.productDescription && <LoadingSpinner />}
            </label>
            {productDescription && (
              <button
                type="button"
                onClick={() => handlePreview('Product Description', productDescription)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview HTML
              </button>
            )}
          </div>
          <textarea
            {...register('corpbaseData.productDescription')}
            rows="4"
            className={`form-input font-mono text-sm ${fieldsLoading.productDescription ? 'ring-2 ring-blue-500/50' : ''}`}
            placeholder={showGenerateButton && !readOnly ? "Click 'Generate with AI' to auto-generate HTML-formatted content..." : "HTML content"}
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
              className={`form-input ${fieldsLoading.websiteTitle ? 'ring-2 ring-blue-500/50' : ''}`}
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
              className={`form-input ${fieldsLoading.metaDescription ? 'ring-2 ring-blue-500/50' : ''}`}
              placeholder="Brief description for search engines (150-160 characters)"
              readOnly={readOnly}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Key Features & Benefits
              {fieldsLoading.keyFeatures && <LoadingSpinner />}
            </label>
            {keyFeatures && (
              <button
                type="button"
                onClick={() => handlePreview('Key Features & Benefits', keyFeatures)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview HTML
              </button>
            )}
          </div>
          <textarea
            {...register('corpbaseData.keyFeatures')}
            rows="3"
            className={`form-input font-mono text-sm ${fieldsLoading.keyFeatures ? 'ring-2 ring-blue-500/50' : ''}`}
            placeholder="<ul>&#10;<li>High purity and quality</li>&#10;<li>Suitable for research applications</li>&#10;</ul>"
            readOnly={readOnly}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Applications
                {fieldsLoading.applications && <LoadingSpinner />}
              </label>
              {applications && (
                <button
                  type="button"
                  onClick={() => handlePreview('Applications', applications)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview HTML
                </button>
              )}
            </div>
            <textarea
              {...register('corpbaseData.applications')}
              rows="3"
              className={`form-input font-mono text-sm ${fieldsLoading.applications ? 'ring-2 ring-blue-500/50' : ''}`}
              placeholder="<ul>&#10;<li>Research and Development</li>&#10;<li>Laboratory Analysis</li>&#10;</ul>"
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
              className={`form-input ${fieldsLoading.targetIndustries ? 'ring-2 ring-blue-500/50' : ''}`}
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

      {/* HTML Preview Modal */}
      {isPreviewOpen && previewField && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity bg-gray-500/75" onClick={() => setIsPreviewOpen(false)}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    HTML Preview: {previewField.field}
                  </h3>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Preview Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Rendered HTML Preview
                    </h4>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                      ✓ Accurate website rendering
                    </span>
                  </div>
                  <div
                    className="p-4 bg-white border-2 border-blue-200 rounded-lg shadow-sm min-h-[100px]
                               [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-gray-800
                               [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3 [&_ul]:space-y-1.5
                               [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3 [&_ol]:space-y-1.5
                               [&_li]:text-gray-700 [&_li]:leading-relaxed
                               [&_strong]:font-semibold [&_strong]:text-gray-900
                               [&_em]:italic [&_em]:text-gray-700
                               [&_sub]:text-xs [&_sub]:align-sub
                               [&_sup]:text-xs [&_sup]:align-super
                               text-base"
                    dangerouslySetInnerHTML={{ __html: fixOrphanedListItems(editedHtml) }}
                  />
                </div>

                {/* HTML Editor Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      HTML Source Code Editor
                    </h4>
                    <span className="text-xs text-gray-500">Select text and click a button to format</span>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="space-y-2 mb-3">
                    {/* Text Formatting Row */}
                    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                      <span className="text-xs text-gray-600 font-medium self-center mr-2">Format:</span>
                      <button
                        type="button"
                        onClick={() => applyFormatting('bold')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Bold (wraps with <strong>)"
                      >
                        <span className="font-bold text-base">B</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('italic')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Italic (wraps with <em>)"
                      >
                        <span className="italic text-base font-serif">I</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('sub')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Subscript (wraps with <sub>)"
                      >
                        <span className="font-medium">X<sub className="text-xs">2</sub></span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('sup')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        title="Superscript (wraps with <sup>)"
                      >
                        <span className="font-medium">X<sup className="text-xs">2</sup></span>
                      </button>
                    </div>

                    {/* Special Characters Row */}
                    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                      <span className="text-xs text-gray-600 font-medium self-center mr-2">Symbols:</span>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&deg;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Degree symbol (&deg;)"
                      >
                        °
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&plusmn;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Plus-minus symbol (&plusmn;)"
                      >
                        ±
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&ge;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Greater than or equal to (&ge;)"
                      >
                        ≥
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&le;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Less than or equal to (&le;)"
                      >
                        ≤
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&trade;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Trademark symbol (&trade;)"
                      >
                        ™
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&reg;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                        title="Registered trademark (&reg;)"
                      >
                        ®
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&alpha;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium italic"
                        title="Greek letter alpha (&alpha;)"
                      >
                        α
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&beta;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium italic"
                        title="Greek letter beta (&beta;)"
                      >
                        β
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSymbol('&mu;')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium italic"
                        title="Greek letter mu / micro (&mu;)"
                      >
                        μ
                      </button>
                    </div>
                  </div>

                  {/* Editable HTML Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={editedHtml}
                    onChange={(e) => setEditedHtml(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono overflow-x-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="10"
                    placeholder="Enter or edit HTML here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Format:</strong> Select text and click a button to wrap with tags. <strong>Symbols:</strong> Click to insert HTML entity codes (e.g., &amp;deg;, &amp;plusmn;) - guaranteed to work across all systems and browsers.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHtml}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorpBaseDataForm;
