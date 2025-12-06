import React, { useState, useEffect } from 'react';
import {
  CircleStackIcon,
  DocumentIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * MongoDB Explorer Component
 * Provides a Windows Explorer-like interface for browsing MongoDB collections and documents
 */
const MongoDBExplorer = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetail, setDocumentDetail] = useState(null);
  const [loading, setLoading] = useState({
    collections: false,
    documents: false,
    detail: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  // Fetch documents when collection changes
  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments(selectedCollection, 1);
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    try {
      setLoading(prev => ({ ...prev, collections: true }));
      const response = await adminAPI.getCollections();
      setCollections(response.data.collections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
    }
  };

  const fetchDocuments = async (collectionName, page = 1) => {
    try {
      setLoading(prev => ({ ...prev, documents: true }));
      const response = await adminAPI.getDocuments(collectionName, {
        page,
        limit: pagination.limit,
        sort: '_id',
        order: 'desc'
      });
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
      setSelectedDocument(null);
      setDocumentDetail(null);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  };

  const fetchDocumentDetail = async (collectionName, documentId) => {
    try {
      setLoading(prev => ({ ...prev, detail: true }));
      const response = await adminAPI.getDocumentById(collectionName, documentId);
      setDocumentDetail(response.data.document);
    } catch (error) {
      console.error('Error fetching document detail:', error);
      toast.error('Failed to load document details');
    } finally {
      setLoading(prev => ({ ...prev, detail: false }));
    }
  };

  const handleCollectionClick = (collection) => {
    setSelectedCollection(collection.name);
  };

  const handleDocumentClick = (document) => {
    setSelectedDocument(document._id);
    fetchDocumentDetail(selectedCollection, document._id);
  };

  const handlePageChange = (newPage) => {
    if (selectedCollection && newPage >= 1 && newPage <= pagination.pages) {
      fetchDocuments(selectedCollection, newPage);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatValue = (value) => {
    if (value === null) return <span className="text-gray-400 italic">null</span>;
    if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-blue-600">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-green-600">{value}</span>;
    if (typeof value === 'string') return <span className="text-purple-600">"{value}"</span>;
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
      return <span className="text-orange-600">{new Date(value).toLocaleString()}</span>;
    }
    return <span className="text-gray-700">{String(value)}</span>;
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CircleStackIcon className="h-8 w-8 text-millipore-blue mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">MongoDB Explorer</h2>
              <p className="text-sm text-gray-500">Browse collections and documents</p>
            </div>
          </div>
          <button
            onClick={fetchCollections}
            disabled={loading.collections}
            className="btn btn-secondary flex items-center"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading.collections ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Three-panel layout: Collections | Documents | Detail */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-250px)]">
        {/* Left Panel: Collections */}
        <div className="col-span-3 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <h3 className="text-white font-semibold flex items-center">
              <FolderIcon className="h-5 w-5 mr-2" />
              Collections ({collections.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading.collections ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {collections.map((collection) => (
                  <button
                    key={collection.name}
                    onClick={() => handleCollectionClick(collection)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      selectedCollection === collection.name ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        {selectedCollection === collection.name ? (
                          <FolderOpenIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                        ) : (
                          <FolderIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {collection.name}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 ml-7 flex items-center text-xs text-gray-500 space-x-3">
                      <span>{collection.documentCount} docs</span>
                      <span>{formatBytes(collection.sizeBytes)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel: Documents List */}
        <div className="col-span-4 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
            <h3 className="text-white font-semibold flex items-center">
              <DocumentIcon className="h-5 w-5 mr-2" />
              {selectedCollection ? `${selectedCollection} Documents` : 'Select a Collection'}
            </h3>
          </div>

          {selectedCollection && (
            <>
              <div className="flex-1 overflow-y-auto">
                {loading.documents ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No documents found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {documents.map((doc) => {
                      const docId = doc._id?.toString() || 'unknown';
                      const isSelected = selectedDocument?.toString() === docId;

                      return (
                        <button
                          key={docId}
                          onClick={() => handleDocumentClick(doc)}
                          className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors ${
                            isSelected ? 'bg-purple-100 border-l-4 border-purple-600' : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-xs font-mono text-gray-700 truncate">{docId}</span>
                          </div>
                          {/* Show some key fields as preview */}
                          <div className="mt-1 ml-6 text-xs text-gray-500">
                            {Object.keys(doc)
                              .filter(key => key !== '_id' && !key.startsWith('__'))
                              .slice(0, 2)
                              .map(key => (
                                <div key={key} className="truncate">
                                  <span className="font-medium">{key}:</span> {String(doc[key]).substring(0, 30)}
                                </div>
                              ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel: Document Detail Tree View */}
        <div className="col-span-5 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
            <h3 className="text-white font-semibold">Document Details</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading.detail ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : !documentDetail ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Select a document to view details</p>
              </div>
            ) : (
              <DocumentTreeView data={documentDetail} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Recursive tree view component for displaying nested objects
 */
const DocumentTreeView = ({ data, level = 0 }) => {
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, value]) => (
        <TreeNode key={key} fieldKey={key} value={value} level={level} />
      ))}
    </div>
  );
};

const TreeNode = ({ fieldKey, value, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand first level
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const indent = level * 20;

  const getValuePreview = () => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (isArray) return `Array[${value.length}]`;
    if (isObject) return `{${Object.keys(value).length} fields}`;
    if (typeof value === 'string') return `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
    return String(value);
  };

  return (
    <div>
      <div
        className={`flex items-start py-1 px-2 rounded hover:bg-gray-50 ${
          isExpandable ? 'cursor-pointer' : ''
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-5 flex-shrink-0">
          {isExpandable && (
            isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )
          )}
        </div>

        {/* Field Key */}
        <span className="font-medium text-sm text-blue-700 mr-2">{fieldKey}:</span>

        {/* Value or Preview */}
        {!isExpanded && (
          <span className="text-sm text-gray-600">{getValuePreview()}</span>
        )}
      </div>

      {/* Nested content */}
      {isExpanded && isExpandable && (
        <div>
          {isArray ? (
            value.map((item, index) => (
              <TreeNode key={index} fieldKey={`[${index}]`} value={item} level={level + 1} />
            ))
          ) : (
            <DocumentTreeView data={value} level={level + 1} />
          )}
        </div>
      )}

      {/* Primitive value display when expanded */}
      {isExpanded && !isExpandable && (
        <div className="text-sm ml-7" style={{ paddingLeft: `${indent}px` }}>
          {formatValue(value)}
        </div>
      )}
    </div>
  );
};

const formatValue = (value) => {
  if (value === null) return <span className="text-gray-400 italic">null</span>;
  if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
  if (typeof value === 'boolean') return <span className="text-blue-600">{value.toString()}</span>;
  if (typeof value === 'number') return <span className="text-green-600">{value}</span>;
  if (typeof value === 'string') {
    // Check if it's a date string
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return <span className="text-orange-600">{new Date(value).toLocaleString()}</span>;
    }
    return <span className="text-purple-600 break-all">"{value}"</span>;
  }
  return <span className="text-gray-700 break-all">{String(value)}</span>;
};

export default MongoDBExplorer;
