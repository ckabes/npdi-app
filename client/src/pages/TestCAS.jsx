import React, { useState } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const TestCAS = () => {
  const [casNumber, setCasNumber] = useState('64-17-5');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testLookup = async () => {
    if (!casNumber) {
      toast.error('Enter a CAS number');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    console.log('Testing CAS lookup:', casNumber);
    
    try {
      const startTime = Date.now();
      const response = await productAPI.lookupCAS(casNumber);
      const endTime = Date.now();
      
      console.log('Lookup completed in', endTime - startTime, 'ms');
      console.log('Full response:', response);
      
      setResult({
        data: response.data.data,
        duration: endTime - startTime
      });
      
      toast.success(`Lookup completed in ${endTime - startTime}ms`);
    } catch (err) {
      console.error('Lookup failed:', err);
      setError({
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
        full: err
      });
      toast.error('Lookup failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">CAS Lookup Test</h1>
      
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-medium">Test CAS Number Lookup</h2>
        </div>
        <div className="card-body">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CAS Number
              </label>
              <input
                type="text"
                value={casNumber}
                onChange={(e) => setCasNumber(e.target.value)}
                className="form-input"
                placeholder="64-17-5"
              />
            </div>
            <button
              onClick={testLookup}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Testing...' : 'Test Lookup'}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Predefined test cases:</p>
            <div className="flex gap-2 mt-2">
              {['64-17-5', '7732-18-5', '67-56-1'].map(cas => (
                <button
                  key={cas}
                  onClick={() => setCasNumber(cas)}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {cas}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-millipore-blue mr-3"></div>
              <span>Looking up chemical data...</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-red-200 mb-6">
          <div className="card-header bg-red-50">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
          </div>
          <div className="card-body">
            <p className="text-red-700 mb-2">Status: {error.status}</p>
            <p className="text-red-700 mb-4">Message: {error.message}</p>
            <details>
              <summary className="text-sm text-gray-600 cursor-pointer">Full error details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(error.full, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="card border-green-200">
            <div className="card-header bg-green-50">
              <h3 className="text-lg font-medium text-green-800">
                Success (completed in {result.duration}ms)
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Product Name:</strong> {result.data.productName || 'N/A'}</p>
                    <p><strong>CAS:</strong> {result.data.chemicalProperties?.casNumber || 'N/A'}</p>
                    <p><strong>Formula:</strong> {result.data.chemicalProperties?.molecularFormula || 'N/A'}</p>
                    <p><strong>MW:</strong> {result.data.chemicalProperties?.molecularWeight || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">SKUs Generated</h4>
                  <div className="space-y-1 text-sm">
                    {result.data.skuVariants?.map(sku => (
                      <p key={sku.type}><strong>{sku.type}:</strong> {sku.sku}</p>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Hazard Info</h4>
                <p className="text-sm"><strong>Signal Word:</strong> {result.data.hazardClassification?.signalWord || 'N/A'}</p>
                <p className="text-sm"><strong>Hazard Statements:</strong> {result.data.hazardClassification?.hazardStatements?.length || 0} found</p>
              </div>
              
              <details className="mt-6">
                <summary className="text-sm text-gray-600 cursor-pointer">Full JSON Response</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCAS;