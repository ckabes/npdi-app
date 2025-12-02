import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { productAPI, templatesAPI } from '../services/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import SKUAssignment from '../components/SKUAssignment';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  DocumentIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { StatusBadge, PriorityBadge } from '../components/badges';
import {
  DynamicFormRenderer,
  DynamicFormSection,
  ChemicalPropertiesForm,
  QualitySpecificationsForm,
  PricingCalculationForm,
  SKUVariantsForm,
  CorpBaseDataForm,
  DynamicCustomSections
} from '../components/forms';
import UNSPSCSelector from '../components/forms/UNSPSCSelector';
import PMOpsTabView from '../components/PMOpsTabView';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPMOPS, isAdmin, isProductManager } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isUNSPSCSelectorOpen, setIsUNSPSCSelectorOpen] = useState(false);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const formInitializedRef = useRef(false);
  const pmopsTabViewRef = useRef(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  // Initialize form with proper defaults based on ticket data
  const getDefaultFormValues = () => {
    if (!ticket || !editMode) return {};
    
    return {
      ...ticket,
      skuVariants: ticket.skuVariants && ticket.skuVariants.length > 0 
        ? ticket.skuVariants 
        : [{
            type: 'PREPACK',
            sku: '',
            packageSize: { value: 100, unit: 'g' },
            pricing: { listPrice: 0, currency: 'USD' }
          }]
    };
  };
  
  const { register: registerEdit, handleSubmit: handleSubmitEdit, setValue: setValueEdit, watch: watchEdit, control: controlEdit, reset: resetEdit, formState: { errors: editErrors } } = useForm();
  const { fields: editFields, append: editAppend, remove: editRemove } = useFieldArray({ control: controlEdit, name: 'skuVariants' });
  const { fields: editCompositionFields, append: editAppendComposition, remove: editRemoveComposition } = useFieldArray({ control: controlEdit, name: 'composition.components' });
  const { fields: editQualityFields, append: editAppendQuality, remove: editRemoveQuality } = useFieldArray({ control: controlEdit, name: 'quality.attributes' });

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Load user's template for edit mode form configuration
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!user?.email || !user?.role) return;

      try {
        setLoadingTemplate(true);
        const response = await templatesAPI.getUserTemplate(user.email, user.role);

        // Handle PM Ops case (no template)
        if (isPMOPS || !response.data) {
          setTemplate(null);
        } else {
          setTemplate(response.data);
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        setTemplate(null);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [user, isPMOPS]);

  useEffect(() => {
    if (ticket && editMode && !formInitializedRef.current) {
      // Only populate once when entering edit mode
      formInitializedRef.current = true;

      // Reset the entire form with ticket data
      const formData = getDefaultFormValues();
      resetEdit(formData);
    }

    // Reset form initialization when exiting edit mode
    if (!editMode && formInitializedRef.current) {
      formInitializedRef.current = false;
    }
  }, [ticket, editMode, resetEdit]);

  const fetchTicket = async () => {
    try {
      const response = await productAPI.getTicket(id);
      setTicket(response.data.ticket);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket details');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (data) => {
    setCommentLoading(true);
    try {
      await productAPI.addComment(id, data);
      toast.success('Comment added successfully');
      reset();
      fetchTicket();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const reason = prompt('Please provide a reason for this status change (optional):');
    try {
      await productAPI.updateStatus(id, { status: newStatus, reason: reason || '' });
      toast.success('Status updated successfully');
      fetchTicket();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };


  const handleExportDataExcel = async () => {
    try {
      toast.loading('Generating Data Export...');
      const response = await productAPI.exportDataExcel(id);

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Data_Export_${ticket.ticketNumber || id}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Data Export downloaded successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.dismiss();
      toast.error('Failed to export data');
    }
  };

  const handleUpdateTicket = async (data) => {
    setUpdateLoading(true);
    try {
      await productAPI.updateTicket(id, data);
      toast.success('Ticket updated successfully');
      setEditMode(false);
      fetchTicket();
    } catch (error) {
      console.error('Failed to update ticket:', error);

      // Enhanced error handling with validation details
      const errorData = error.response?.data;

      if (errorData?.validationErrors && errorData.validationErrors.length > 0) {
        // Show each validation error
        errorData.validationErrors.forEach((msg, index) => {
          setTimeout(() => {
            toast.error(msg, { duration: 5000 });
          }, index * 100); // Stagger toasts slightly
        });
      } else if (errorData?.message) {
        toast.error(errorData.message, { duration: 5000 });
      } else {
        toast.error('Failed to update ticket. Please check your input and try again.');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddBulkSKU = async () => {
    // Check if BULK SKU already exists
    if (ticket.skuVariants && ticket.skuVariants.some(sku => sku.type === 'BULK')) {
      toast.error('A BULK SKU already exists. Only one BULK SKU is allowed per product.');
      return;
    }

    setUpdateLoading(true);
    try {
      const baseUnitValue = ticket.baseUnit?.value || 1;
      const baseUnitUnit = ticket.baseUnit?.unit || 'g';
      const partNumber = ticket.partNumber?.baseNumber;

      // Generate SKU code
      const skuCode = partNumber ? `${partNumber}-BULK` : 'BULK';

      // Create new BULK SKU variant
      const newBulkSKU = {
        type: 'BULK',
        sku: skuCode,
        description: `${ticket.requestInfo?.productName || 'Product'} - Bulk packaging`,
        packageSize: {
          value: baseUnitValue,
          unit: baseUnitUnit
        },
        pricing: {
          standardCost: ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || 0,
          calculatedCost: 0,
          margin: ticket.margin || 50,
          limitPrice: 0,
          listPrice: 0,
          currency: 'USD'
        }
      };

      // Add the new BULK SKU to existing variants
      const updatedSkuVariants = [...(ticket.skuVariants || []), newBulkSKU];

      await productAPI.updateTicket(id, { skuVariants: updatedSkuVariants });
      toast.success('BULK SKU added successfully');
      fetchTicket();
    } catch (error) {
      console.error('Failed to add BULK SKU:', error);
      toast.error('Failed to add BULK SKU. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const canEdit = () => {
    // Ticket cannot be edited once NPDI is initiated
    if (ticket.status === 'NPDI_INITIATED') {
      return false;
    }
    // PMOps and Admin can edit tickets in any status (except NPDI_INITIATED)
    if (isPMOPS || isAdmin) {
      return true;
    }
    // Product Managers can edit tickets in DRAFT or SUBMITTED status
    if (isProductManager && (ticket.status === 'DRAFT' || ticket.status === 'SUBMITTED')) {
      return true;
    }
    return false;
  };

  const canEditPricing = () => {
    // Pricing can only be edited when:
    // 1. Product Manager editing DRAFT or SUBMITTED tickets (original creation/editing)
    // 2. PMOps/Admin explicitly editing tickets AFTER they reach IN_PROCESS status
    if (isProductManager && (ticket.status === 'DRAFT' || ticket.status === 'SUBMITTED')) {
      return true; // Product Manager can set pricing during draft creation/editing and submitted status
    }
    if ((isPMOPS || isAdmin) && ticket.status === 'IN_PROCESS' && editMode) {
      return true; // PMOps can edit pricing only when explicitly editing IN_PROCESS tickets
    }
    return false; // No pricing edits during SKU assignment or other states
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-millipore-blue"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ticket not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested ticket could not be found or you don't have access to it.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/tickets')}
            className="btn btn-primary"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* MilliporeSigma Header */}
      <div className="bg-gradient-to-r from-millipore-blue to-millipore-blue-dark rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/tickets')}
              className="text-white hover:text-blue-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <img src="/M.png" alt="MilliporeSigma" className="h-12" />
            <div className="text-white">
              <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
              <p className="text-blue-100">{ticket.productName}</p>
              {ticket.chemicalProperties?.autoPopulated && (
                <p className="text-xs text-blue-200 mt-1">✓ Enhanced with PubChem data</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-3">
            {/* Status and Priority Badges */}
            <div className="flex items-center space-x-3">
              <PriorityBadge priority={ticket.priority} />
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                ticket.status === 'IN_PROCESS' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'NPDI_INITIATED' ? 'bg-orange-100 text-orange-800' :
                ticket.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                ticket.status === 'DRAFT' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'SUBMITTED' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status.replace('_', ' ')}
              </div>
            </div>
            
            {/* Status Dropdown for PMOps */}
            {(isPMOPS || isAdmin) && !editMode && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-sm border border-white/20 bg-white/10 text-white rounded-md px-3 py-1 hover:bg-white/20 transition-colors"
              >
                <option value="DRAFT" className="text-gray-900">Draft</option>
                <option value="SUBMITTED" className="text-gray-900">Submitted</option>
                <option value="IN_PROCESS" className="text-gray-900">In Process</option>
                <option value="NPDI_INITIATED" className="text-gray-900">NPDI Initiated</option>
                <option value="COMPLETED" className="text-gray-900">Completed</option>
                <option value="CANCELED" className="text-gray-900">Canceled</option>
              </select>
            )}
            
            {/* Edit Controls and Export Buttons */}
            <div className="flex items-center space-x-2">
              {canEdit() && (
                <>
                  {editMode ? (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                      <span className="text-white text-sm font-medium">Editing Mode</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  ) : (
                    <button
                      onClick={toggleEditMode}
                      className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 border border-white/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{ticket.status === 'DRAFT' ? 'Edit Draft' : 'Edit Ticket'}</span>
                    </button>
                  )}
                </>
              )}

              {/* Export Buttons - PMOps Only */}
              {isPMOPS && !editMode && (
                <>
                  <button
                    onClick={handleExportDataExcel}
                    className="bg-green-600/90 backdrop-blur-sm hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 border border-green-500/30"
                    title="Download Data Export (Excel)"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Data Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Manager - Ticket Cannot Be Edited Info Banner */}
      {isProductManager && !isPMOPS && !isAdmin && (ticket.status === 'IN_PROCESS' || ticket.status === 'COMPLETED' || ticket.status === 'CANCELED') && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-white flex-1">
              <h3 className="text-xl font-bold">Ticket Editing Not Available</h3>
              <p className="text-blue-100 mt-1">
                This ticket is currently in <strong>{ticket.status.replace(/_/g, ' ')}</strong> status and cannot be edited by Product Managers.
              </p>
              <p className="text-blue-100 text-sm mt-2">
                ℹ️ If you need to make changes to this ticket, please contact PMOps to change the status back to <strong>SUBMITTED</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Ticket Banner */}
      {ticket.priority === 'URGENT' && (
        <div className="bg-red-600 border-l-4 border-red-800 shadow-lg">
          <div className="px-6 py-3">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-bold text-lg tracking-wide">URGENT TICKET</span>
            </div>
          </div>
        </div>
      )}

      {/* NPDI Initiated Banner */}
      {ticket.status === 'NPDI_INITIATED' && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-white flex-1">
                <h2 className="text-2xl font-bold">NPDI Initiated: {ticket.ticketNumber}</h2>
                <p className="text-green-100 mt-1">
                  This ticket has been initiated in the NPDI system on {new Date(ticket.npdiTracking?.initiatedAt).toLocaleDateString()}.
                </p>
                <p className="text-green-100 text-sm mt-2 font-medium">
                  🔒 This ticket is now <strong>locked and cannot be edited</strong>. All changes must be made through the NPDI system.
                </p>
              </div>
            </div>
            {(isPMOPS || isAdmin) && (
              <div>
                <button
                  onClick={async () => {
                    if (window.confirm('Mark this ticket as COMPLETED? This will close the ticket and archive it.')) {
                      try {
                        await productAPI.updateTicket(ticket._id, {
                          status: 'COMPLETED'
                        });
                        toast.success('Ticket marked as completed!');
                        fetchTicket();
                      } catch (error) {
                        console.error('Failed to mark as completed:', error);
                        toast.error('Failed to mark ticket as completed');
                      }
                    }
                  }}
                  className="bg-white text-green-600 hover:bg-green-50 font-bold py-3 px-6 rounded-lg shadow-lg transition-all hover:shadow-xl flex items-center space-x-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Mark as Completed</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PMOps SKU Assignment Status Banner */}
      {(isPMOPS || isAdmin) && !editMode && !ticket.partNumber?.baseNumber && ticket.status === 'SUBMITTED' && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">Part Number Assignment Required</h2>
                <p className="text-yellow-100">This ticket needs a part number assigned before processing can continue.</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    Ticket: {ticket.ticketNumber}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    SBU: {ticket.sbu}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    Status: {ticket.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-white text-right">
              <button
                onClick={() => {
                  if (pmopsTabViewRef.current) {
                    pmopsTabViewRef.current.navigateToTab('skus');
                  }
                }}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-200 rounded-lg p-4 cursor-pointer border border-white/20 hover:border-white/40"
                title="Navigate to SKUs tab to assign part number"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">Go to SKUs</span>
                  <span className="text-2xl">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing BULK SKU Reminder */}
      {(isPMOPS || isAdmin) && !editMode && ticket.skuVariants && ticket.skuVariants.length > 0 && !ticket.skuVariants.some(sku => sku.type === 'BULK') && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-white">
                <h3 className="text-lg font-bold">⚠️ Missing BULK SKU</h3>
                {ticket.baseUnit ? (
                  <p className="text-blue-100 text-sm">Would you like me to add one with a base unit of {ticket.baseUnit.value} {ticket.baseUnit.unit}?</p>
                ) : (
                  <p className="text-blue-100 text-sm">Please set a base unit in the pricing section before adding a BULK SKU.</p>
                )}
              </div>
            </div>
            {ticket.baseUnit ? (
              <button
                onClick={handleAddBulkSKU}
                disabled={updateLoading}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLoading ? 'Adding...' : 'Add Bulk SKU'}
              </button>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-xs font-medium">To-Do</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NPDI Tracking Number Assignment - Top Priority (appears when ready) */}
      {(isPMOPS || isAdmin) && !editMode && ticket.status === 'IN_PROCESS' && ticket.partNumber?.baseNumber && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">NPDI Initiation</h3>
            <p className="text-sm text-gray-600">All to-dos completed - Enter official NPDI tracking number to initiate</p>
            <p className="text-xs text-gray-500 mt-1">Current ticket: <span className="font-semibold text-gray-700">{ticket.ticketNumber}</span></p>
          </div>
          <div className="p-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
              const npdiNumber = e.target.npdiTrackingNumber.value;
              if (npdiNumber && npdiNumber.trim()) {
                try {
                  // IMPORTANT: This changes the ticket number from the original system-generated number
                  // (e.g., NPDI-2025-0055) to the new NPDI tracking number from the external NPDI system
                  // (e.g., NPDI-2025-0054). The original number is preserved in activity history.
                  const updateData = {
                    npdiTracking: {
                      trackingNumber: npdiNumber.trim(),
                      initiatedBy: user?.email,
                      initiatedAt: new Date().toISOString()
                    },
                    ticketNumber: npdiNumber.trim(), // Replace system number with NPDI tracking number
                    status: 'NPDI_INITIATED'
                  };

                  console.log('Sending NPDI update:', updateData);
                  const response = await productAPI.updateTicket(ticket._id, updateData);
                  console.log('NPDI update response:', response);

                  toast.success(`NPDI initiated! Ticket number updated to ${npdiNumber}`);
                  fetchTicket();
                } catch (error) {
                  console.error('NPDI initiation error:', error);
                  console.error('Error response:', error.response);
                  const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message || 'Unknown error';
                  toast.error(`Failed to save NPDI tracking number: ${errorMsg}`);
                }
              }
            }}
              onKeyDown={(e) => {
                // Prevent Enter key from submitting this critical form
                // User must explicitly click "Initiate NPDI" button
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-5 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-900">
                      Official NPDI Tracking Number *
                    </label>
                    <p className="text-sm text-blue-800 font-medium">This will become the new ticket number and initiate NPDI (ticket will be locked)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    name="npdiTrackingNumber"
                    type="text"
                    className="form-input border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-lg font-medium flex-1"
                    placeholder="e.g., 100000000000000778902025"
                    defaultValue={ticket.npdiTracking?.trackingNumber || ''}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary px-8 py-3 text-base shadow-md hover:shadow-lg transition-shadow"
                  >
                    Initiate NPDI
                  </button>
                </div>
                <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-amber-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-semibold text-amber-800">⚠️ Warning: This action is permanent</p>
                      <p className="text-amber-700 mt-1">
                        • The ticket number will change from <strong>{ticket.ticketNumber}</strong> to the NPDI number you enter<br/>
                        • The ticket will become <strong>non-editable and locked</strong><br/>
                        • All changes must be made through the NPDI system<br/>
                        • The original ticket number will be preserved in activity history
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editMode && canEdit() ? (
        // Edit Form Mode - Complete CreateTicket replica
        <div className="w-full">
          {/* Edit Mode Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">Editing: {ticket.ticketNumber}</h1>
                  <p className="text-blue-100">Make changes to your {ticket.status.toLowerCase()} ticket below</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (ticket.status === 'DRAFT') {
                      const data = watchEdit();
                      try {
                        await productAPI.updateTicket(id, { ...data, status: 'DRAFT' });
                        toast.success('Draft saved successfully!');
                        setEditMode(false);
                        fetchTicket();
                      } catch (error) {
                        toast.error('Failed to save draft');
                      }
                    } else {
                      setEditMode(false);
                    }
                  }}
                  disabled={updateLoading}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-white/20 disabled:opacity-50"
                >
                  {ticket.status === 'DRAFT' ? 'Save & Exit' : 'Exit Edit Mode'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <form
              key={`edit-form-${ticket._id}`}
              onSubmit={handleSubmitEdit(handleUpdateTicket)}
              onKeyDown={(e) => {
                // Prevent Enter key from submitting the form
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="space-y-8"
            >
              {/* Render all sections dynamically based on template configuration */}
              {!loadingTemplate && template?.formConfiguration ? (
                <>
                  {/* Render template-configured sections */}
                  {template.formConfiguration.sections
                    ?.filter(section => section.visible)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(section => {
                      // Use specialized components for sections that need special functionality
                      switch (section.sectionKey) {
                        case 'chemical':
                          return (
                            <div key={section.sectionKey} id="chemical-properties-section">
                              <ChemicalPropertiesForm
                                register={registerEdit}
                                watch={watchEdit}
                                setValue={setValueEdit}
                                errors={editErrors}
                                autoPopulated={false}
                                casLookupLoading={false}
                                onCASLookup={() => {}}
                                readOnly={false}
                                showAutoPopulateButton={false}
                              />
                            </div>
                          );

                        case 'composition':
                          // Check if composition section is visible
                          if (!section.visible) return null;
                          return (
                            <div key={section.sectionKey} className="card">
                              <div className="card-header">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900">Product Composition</h3>
                                    <p className="text-sm text-gray-500 mt-1">Define the chemical components that make up this product</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => editAppendComposition({
                                      proprietary: false,
                                      componentCAS: '',
                                      weightPercent: 0,
                                      componentName: '',
                                      componentFormula: ''
                                    })}
                                    className="btn btn-sm btn-secondary"
                                  >
                                    + Add Component
                                  </button>
                                </div>
                              </div>
                              <div className="card-body">
                                {editCompositionFields.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">
                                    <p>No components added yet.</p>
                                    <p className="text-sm mt-2">Click "+ Add Component" above to add manually.</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Proprietary
                                          </th>
                                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Component CAS
                                          </th>
                                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Weight %
                                          </th>
                                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Component Name
                                          </th>
                                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Component Formula
                                          </th>
                                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {editCompositionFields.map((field, index) => (
                                          <tr key={field.id}>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                              <select
                                                {...registerEdit(`composition.components.${index}.proprietary`)}
                                                className="form-select text-sm"
                                              >
                                                <option value="false">No</option>
                                                <option value="true">Yes</option>
                                              </select>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                              <input
                                                {...registerEdit(`composition.components.${index}.componentCAS`)}
                                                type="text"
                                                className="form-input text-sm w-32"
                                                placeholder="CAS Number"
                                              />
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                              <input
                                                {...registerEdit(`composition.components.${index}.weightPercent`, {
                                                  valueAsNumber: true,
                                                  min: 0,
                                                  max: 100
                                                })}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                className="form-input text-sm w-24"
                                                placeholder="0-100"
                                              />
                                            </td>
                                            <td className="px-3 py-4">
                                              <input
                                                {...registerEdit(`composition.components.${index}.componentName`)}
                                                type="text"
                                                className="form-input text-sm w-48"
                                                placeholder="Component Name"
                                              />
                                            </td>
                                            <td className="px-3 py-4">
                                              <input
                                                {...registerEdit(`composition.components.${index}.componentFormula`)}
                                                type="text"
                                                className="form-input text-sm w-32"
                                                placeholder="Formula"
                                              />
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                              <button
                                                type="button"
                                                onClick={() => editRemoveComposition(index)}
                                                className="text-red-600 hover:text-red-900 text-sm"
                                              >
                                                Remove
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {editCompositionFields.length > 0 && (
                                  <div className="mt-4 text-sm text-gray-600">
                                    {(() => {
                                      const totalWeight = editCompositionFields.reduce((sum, _, idx) => {
                                        const weight = watchEdit(`composition.components.${idx}.weightPercent`) || 0;
                                        return sum + parseFloat(weight);
                                      }, 0);
                                      const roundedTotal = parseFloat(totalWeight.toFixed(2));
                                      const isOffBy = Math.abs(roundedTotal - 100) > 0.1;

                                      return (
                                        <>
                                          <p className="font-medium">Total Weight: {roundedTotal.toFixed(2)}%</p>
                                          {isOffBy && (
                                            <p className="text-orange-600 mt-1">⚠ Warning: Total weight should equal 100%</p>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          );

                        case 'quality':
                          // Check if quality section is visible
                          if (!section.visible) return null;
                          return (
                            <QualitySpecificationsForm
                              key={section.sectionKey}
                              register={registerEdit}
                              watch={watchEdit}
                              qualityFields={editQualityFields}
                              appendQuality={editAppendQuality}
                              removeQuality={editRemoveQuality}
                              readOnly={false}
                              editMode={true}
                            />
                          );

                        case 'pricing':
                          return (
                            <React.Fragment key={section.sectionKey}>
                              {/* Base Unit Section - appears before pricing */}
                              <div className="card">
                                <div className="card-header">
                                  <h3 className="text-lg font-medium text-gray-900">Base Unit Size</h3>
                                </div>
                                <div className="card-body">
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 mb-4">
                                      Define the base unit size for this product. This will be used for:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
                                      <li>BULK SKU package size (automatically set to this value)</li>
                                      <li>Pricing calculations (cost per base unit)</li>
                                    </ul>
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-1 max-w-md">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Base Unit
                                        </label>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            {...registerEdit('baseUnit.value')}
                                            type="number"
                                            step="0.01"
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                                            placeholder="Value"
                                          />
                                          <select
                                            {...registerEdit('baseUnit.unit')}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                                          >
                                            <option value="mg">mg</option>
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="mL">mL</option>
                                            <option value="L">L</option>
                                          </select>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                          Example: Set to "100 g" if your bulk product comes in 100 gram units
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <PricingCalculationForm
                                register={registerEdit}
                                watch={watchEdit}
                                readOnly={false}
                              />

                              {/* SKU Variants - shown after pricing */}
                              <SKUVariantsForm
                                register={registerEdit}
                                watch={watchEdit}
                                setValue={setValueEdit}
                                fields={editFields}
                                append={editAppend}
                                remove={editRemove}
                                onCalculatePricing={() => {}}
                                onGenerateStandardSKUs={() => {}}
                                onSKUTypeChange={() => {}}
                                onPackageUnitChange={() => {}}
                                onPackageValueChange={() => {}}
                                readOnly={false}
                                showActionButtons={false}
                                errors={editErrors}
                              />
                            </React.Fragment>
                          );

                        case 'corpbase':
                          return (
                            <div key={section.sectionKey} id="corpbase-section">
                              <CorpBaseDataForm
                                register={registerEdit}
                                setValue={setValueEdit}
                                watch={watchEdit}
                                onGenerateDescription={() => {}}
                                readOnly={false}
                                showGenerateButton={false}
                                isGenerating={false}
                                fieldsLoading={{}}
                              />
                            </div>
                          );

                        // For all other sections (productionType, basic, vendor, custom sections), use DynamicFormSection
                        default:
                          return (
                            <DynamicFormSection
                              key={section.sectionKey}
                              section={section}
                              register={registerEdit}
                              errors={editErrors}
                              watch={watchEdit}
                              setValue={setValueEdit}
                              readOnly={false}
                            />
                          );
                      }
                    })}
                </>
              ) : (
                // Fallback: use full dynamic renderer if template not loaded
                <DynamicFormRenderer
                  register={registerEdit}
                  errors={editErrors}
                  watch={watchEdit}
                  setValue={setValueEdit}
                  readOnly={false}
                  formConfiguration={template?.formConfiguration}
                />
              )}

              {/* Submit Buttons - Enhanced Styling */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Ready to save your changes?</p>
                    <p>Your changes will be {ticket.status === 'DRAFT' ? 'saved as a draft or submitted for review' : 'saved immediately'}.</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>

                    {ticket.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            const data = watchEdit();
                            setUpdateLoading(true);
                            try {
                              await productAPI.updateTicket(id, { ...data, status: 'DRAFT' });
                              toast.success('Draft saved successfully!');
                              setEditMode(false);
                              fetchTicket();
                            } catch (error) {
                              toast.error('Failed to save draft');
                            } finally {
                              setUpdateLoading(false);
                            }
                          }}
                          disabled={updateLoading}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>{updateLoading ? 'Saving...' : 'Save Draft'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const data = watchEdit();
                            setUpdateLoading(true);
                            try {
                              const submitData = { ...data, status: 'SUBMITTED' };
                              await productAPI.updateTicket(id, submitData);
                              toast.success('Ticket submitted successfully!');
                              setEditMode(false);
                              fetchTicket();
                            } catch (error) {
                              toast.error('Failed to submit ticket');
                            } finally {
                              setUpdateLoading(false);
                            }
                          }}
                          disabled={updateLoading}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>{updateLoading ? 'Submitting...' : 'Submit Ticket'}</span>
                        </button>
                      </>
                    )}

                    {ticket.status !== 'DRAFT' && (
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{updateLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* PMOps Tabbed View */}
          {isPMOPS || isAdmin ? (
            <div className="space-y-6">
              {/* Ticket Info - Full Width, Compact Horizontal Layout */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Ticket Information</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Created by</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {(() => {
                            // First check if createdByUser is populated (ObjectId reference)
                            if (ticket.createdByUser?.firstName && ticket.createdByUser?.lastName) {
                              return `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`;
                            }
                            if (ticket.createdByUser?.name) return ticket.createdByUser.name;

                            // Fall back to createdBy email string
                            if (ticket.createdBy) return ticket.createdBy;

                            // Fall back to statusHistory for creator info
                            const creationEntry = ticket.statusHistory?.find(h => h.action === 'TICKET_CREATED');
                            if (creationEntry?.userInfo?.firstName && creationEntry?.userInfo?.lastName) {
                              return `${creationEntry.userInfo.firstName} ${creationEntry.userInfo.lastName}`;
                            }
                            if (creationEntry?.userInfo?.name) return creationEntry.userInfo.name;

                            return 'Unknown User';
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm text-gray-900">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm text-gray-900">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <TagIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <StatusBadge status={ticket.status} />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500">Priority</p>
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Tabbed Content - Full Width */}
              <PMOpsTabView ref={pmopsTabViewRef} ticket={ticket} onTicketUpdate={fetchTicket} />

              {/* Comments - Full Width, Below Content */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                </div>
                <div className="card-body space-y-6">
                  {/* Add Comment Form */}
                  <form
                    onSubmit={handleSubmit(handleAddComment)}
                    onKeyDown={(e) => {
                      // Allow Enter in textarea for multi-line comments
                      // Prevent Enter from submitting form accidentally
                      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <textarea
                        {...register('content', { required: 'Comment is required' })}
                        rows="3"
                        className="form-input"
                        placeholder="Add a comment..."
                      />
                      {errors.content && (
                        <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={commentLoading}
                        className="btn btn-primary"
                      >
                        {commentLoading ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  {ticket.comments && ticket.comments.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {ticket.comments.map((comment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="h-6 w-6 bg-millipore-blue rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {comment.userInfo?.firstName?.[0]}{comment.userInfo?.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">
                                {comment.userInfo?.firstName} {comment.userInfo?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Activity History - Full Width, Below Comments */}
              {ticket.statusHistory && ticket.statusHistory.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Activity History</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {ticket.statusHistory.length} activities
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {ticket.statusHistory.slice().reverse().map((history, index) => {
                        const getActionIcon = (action) => {
                          // Icons removed - using color-coded backgrounds instead
                          return null;
                        };

                        const getActionColor = (action) => {
                          switch(action) {
                            case 'TICKET_CREATED':
                              return 'text-blue-600 bg-blue-50 border-blue-200';
                            case 'STATUS_CHANGE':
                              return 'text-purple-600 bg-purple-50 border-purple-200';
                            case 'SKU_ASSIGNMENT':
                              return 'text-green-600 bg-green-50 border-green-200';
                            case 'TICKET_EDIT':
                              return 'text-orange-600 bg-orange-50 border-orange-200';
                            case 'COMMENT_ADDED':
                              return 'text-gray-600 bg-gray-50 border-gray-200';
                            case 'NPDI_INITIATED':
                              return 'text-emerald-600 bg-emerald-50 border-emerald-200';
                            default:
                              return 'text-gray-600 bg-gray-50 border-gray-200';
                          }
                        };

                        return (
                          <div key={index} className={`border rounded-lg p-3 ${getActionColor(history.action)}`}>
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                  <div className="flex items-center space-x-2">
                                    <StatusBadge status={history.status} />
                                    <span className="text-xs font-medium text-gray-700 capitalize">
                                      {(history.action || 'status_change').replace('_', ' ').toLowerCase()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(history.changedAt).toLocaleDateString()} at{' '}
                                    {new Date(history.changedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  {(history.changedBy || history.userInfo) && (
                                    <div className="text-xs text-gray-600 font-medium">
                                      by {history.changedBy?.firstName || history.userInfo?.firstName}{' '}
                                      {history.changedBy?.lastName || history.userInfo?.lastName}
                                      {history.userInfo?.role && (
                                        <span className="text-xs text-gray-500 ml-1">
                                          ({history.userInfo.role})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {history.reason && (
                                  <p className="text-sm text-gray-700 mt-1 leading-relaxed break-words overflow-wrap-anywhere">
                                    {history.reason}
                                  </p>
                                )}

                                {/* Special display for NPDI Initiation */}
                                {history.action === 'NPDI_INITIATED' && history.details && (
                                  <div className="mt-3 bg-white rounded-lg border border-emerald-200 p-3">
                                    <div className="text-xs font-semibold text-emerald-800 mb-2">Ticket Number Change:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-gray-500 font-medium">Original Number:</span>
                                        <div className="text-gray-900 font-mono font-semibold mt-1">
                                          {history.details.previousTicketNumber}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-emerald-600 font-medium">NPDI Number:</span>
                                        <div className="text-emerald-700 font-mono font-semibold mt-1">
                                          {history.details.newTicketNumber}
                                        </div>
                                      </div>
                                    </div>
                                    {history.details.initiatedAt && (
                                      <div className="mt-2 pt-2 border-t border-emerald-100 text-xs text-gray-600">
                                        <span className="font-medium">Initiated:</span> {new Date(history.details.initiatedAt).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Generic details display for other actions */}
                                {history.action !== 'NPDI_INITIATED' && history.details && (
                                  <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2 break-words overflow-wrap-anywhere">
                                    <strong>Details:</strong>
                                    {typeof history.details === 'object'
                                      ? Object.entries(history.details).map(([key, value]) => (
                                          <span key={key} className="ml-2 inline-block">
                                            {key}: {JSON.stringify(value)}
                                          </span>
                                        ))
                                      : history.details
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Product Information</h3>
            </div>
            <div className="card-body">
              {/* Product Name - Full width at top */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Product Name
                  <span className="text-xs text-gray-400 ml-2">(Commercial/Marketing name)</span>
                </label>
                {editMode && canEdit() ? (
                  <input
                    {...registerEdit('productName')}
                    type="text"
                    className="form-input text-base font-medium"
                    defaultValue={ticket.productName}
                    placeholder="e.g., Sigma-Aldrich Premium Grade Acetone"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{ticket.productName || 'Not specified'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">SBU</label>
                  {editMode && canEdit() ? (
                    <select
                      {...registerEdit('sbu')}
                      className="mt-1 form-select text-sm"
                      defaultValue={ticket.sbu}
                    >
                      <option value="775">SBU 775</option>
                      <option value="P90">SBU P90</option>
                      <option value="440">SBU 440</option>
                      <option value="P87">SBU P87</option>
                      <option value="P89">SBU P89</option>
                      <option value="P85">SBU P85</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{ticket.sbu}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Priority</label>
                  {editMode && canEdit() ? (
                    <select
                      {...registerEdit('priority')}
                      className="mt-1 form-select text-sm"
                      defaultValue={ticket.priority}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  ) : (
                    <p className="mt-1">
                      <PriorityBadge priority={ticket.priority} />
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Production Type</label>
                  {editMode && canEdit() ? (
                    <select
                      {...registerEdit('productionType')}
                      className="mt-1 form-select text-sm"
                      defaultValue={ticket.productionType}
                    >
                      <option value="Produced">Produced</option>
                      <option value="Procured">Procured</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.productionType === 'Produced'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {ticket.productionType || 'Produced'}
                      </span>
                    </p>
                  )}
                </div>

                {/* New Fields Row 2 */}
                {ticket.primaryPlant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Primary Plant</label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.primaryPlant}</p>
                  </div>
                )}

                {ticket.productScope?.scope && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Product Scope</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {ticket.productScope.scope}
                      {ticket.productScope.scope === 'Other' && ticket.productScope.otherSpecification && (
                        <span className="text-gray-600"> - {ticket.productScope.otherSpecification}</span>
                      )}
                    </p>
                  </div>
                )}

                {ticket.distributionType?.type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Distribution Type</label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.distributionType.type}</p>
                    {(ticket.distributionType.type === 'Purchase on Demand' || ticket.distributionType.type === 'Dock to Stock') && (
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {ticket.distributionType.coaCreator && <p>COA Creator: {ticket.distributionType.coaCreator}</p>}
                        {ticket.distributionType.labelingType && <p>Labeling: {ticket.distributionType.labelingType}</p>}
                        {ticket.distributionType.labelingResponsibility && <p>Labeling Responsibility: {ticket.distributionType.labelingResponsibility}</p>}
                        {ticket.distributionType.vendorLabelSource && <p>Vendor Label Source: {ticket.distributionType.vendorLabelSource}</p>}
                      </div>
                    )}
                  </div>
                )}

                {ticket.retestOrExpiration && (ticket.retestOrExpiration.hasExpirationDate || ticket.retestOrExpiration.hasRetestDate || ticket.retestOrExpiration.hasShelfLife) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Product Dating</label>
                    <div className="mt-1 text-sm text-gray-900 space-y-1">
                      {ticket.retestOrExpiration.hasExpirationDate && ticket.retestOrExpiration.expirationPeriod?.value && (
                        <p>Expiration: {ticket.retestOrExpiration.expirationPeriod.value} {ticket.retestOrExpiration.expirationPeriod.unit}</p>
                      )}
                      {ticket.retestOrExpiration.hasRetestDate && ticket.retestOrExpiration.retestPeriod?.value && (
                        <p>Retest: {ticket.retestOrExpiration.retestPeriod.value} {ticket.retestOrExpiration.retestPeriod.unit}</p>
                      )}
                      {ticket.retestOrExpiration.hasShelfLife && ticket.retestOrExpiration.shelfLifePeriod?.value && (
                        <p>Shelf Life: {ticket.retestOrExpiration.shelfLifePeriod.value} {ticket.retestOrExpiration.shelfLifePeriod.unit}</p>
                      )}
                    </div>
                  </div>
                )}

                {ticket.sialProductHierarchy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">SIAL Product Hierarchy</label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.sialProductHierarchy}</p>
                  </div>
                )}

                {ticket.materialGroup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Material Group</label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.materialGroup}</p>
                  </div>
                )}

                {ticket.countryOfOrigin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Country of Origin</label>
                    <p className="mt-1 text-sm text-gray-900">{ticket.countryOfOrigin}</p>
                  </div>
                )}

                {ticket.brand && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Brand</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {ticket.brand}
                      </span>
                    </p>
                  </div>
                )}

                {ticket.businessLine?.line && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Business Line</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {ticket.businessLine.line}
                      {ticket.businessLine.line === 'Other' && ticket.businessLine.otherSpecification && (
                        <span className="text-gray-600"> - {ticket.businessLine.otherSpecification}</span>
                      )}
                    </p>
                  </div>
                )}

                {ticket.similarProducts && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Similar Products</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">
                      {ticket.similarProducts}
                    </p>
                  </div>
                )}
              </div>

              {/* Intellectual Property */}
              {ticket.intellectualProperty?.hasIP && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Intellectual Property</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {ticket.intellectualProperty.patentNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Patent Number</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{ticket.intellectualProperty.patentNumber}</p>
                      </div>
                    )}
                    {ticket.intellectualProperty.licenseNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">License Number</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{ticket.intellectualProperty.licenseNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor Information - Only shown if Procured */}
              {ticket.productionType === 'Procured' && ticket.vendorInformation && (
                Object.values(ticket.vendorInformation).some(val => val) && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Vendor Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {ticket.vendorInformation.vendorName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Vendor Name</label>
                          <p className="mt-1 text-sm text-gray-900">{ticket.vendorInformation.vendorName}</p>
                        </div>
                      )}
                      {ticket.vendorInformation.vendorProductName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Vendor Product Name</label>
                          <p className="mt-1 text-sm text-gray-900">{ticket.vendorInformation.vendorProductName}</p>
                        </div>
                      )}
                      {ticket.vendorInformation.vendorSAPNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Vendor SAP Number</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono">{ticket.vendorInformation.vendorSAPNumber}</p>
                        </div>
                      )}
                      {ticket.vendorInformation.vendorProductNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Vendor Product #</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono">{ticket.vendorInformation.vendorProductNumber}</p>
                        </div>
                      )}
                      {ticket.vendorInformation.vendorCostPerUOM?.value && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Vendor Cost</label>
                          <p className="mt-1 text-sm text-gray-900">
                            ${ticket.vendorInformation.vendorCostPerUOM.value} / {ticket.vendorInformation.vendorCostPerUOM.unit}
                          </p>
                        </div>
                      )}
                      {ticket.vendorInformation.amountToBePurchased?.value && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Amount to Purchase</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {ticket.vendorInformation.amountToBePurchased.value} {ticket.vendorInformation.amountToBePurchased.unit}
                          </p>
                        </div>
                      )}
                      {ticket.vendorInformation.vendorLeadTimeWeeks && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Lead Time</label>
                          <p className="mt-1 text-sm text-gray-900">{ticket.vendorInformation.vendorLeadTimeWeeks} weeks</p>
                        </div>
                      )}
                      {ticket.vendorInformation.purchaseUOM && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Purchase UOM</label>
                          <p className="mt-1 text-sm text-gray-900">{ticket.vendorInformation.purchaseUOM}</p>
                        </div>
                      )}
                      {ticket.vendorInformation.purchaseCurrency && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Purchase Currency</label>
                          <p className="mt-1 text-sm text-gray-900">{ticket.vendorInformation.purchaseCurrency}</p>
                        </div>
                      )}
                      {ticket.vendorInformation.countryOfOrigin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Country of Origin</label>
                          <p className="mt-1 text-sm text-gray-900">{ticket.vendorInformation.countryOfOrigin}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Enhanced Chemical Properties */}
          {ticket.chemicalProperties && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Chemical Properties</h3>
                  {ticket.chemicalProperties.autoPopulated && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-600 font-medium">PubChem Enhanced</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">CAS Number</label>
                    {editMode && canEdit() ? (
                      <input
                        {...registerEdit('chemicalProperties.casNumber')}
                        type="text"
                        className="mt-1 form-input text-sm font-mono"
                        defaultValue={ticket.chemicalProperties.casNumber}
                        placeholder="e.g., 64-17-5"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                        {ticket.chemicalProperties.casNumber}
                      </p>
                    )}
                  </div>
                  {ticket.chemicalProperties.molecularFormula && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Molecular Formula</label>
                      <p className="mt-1 text-lg text-gray-900 font-mono font-semibold">
                        {ticket.chemicalProperties.molecularFormula}
                      </p>
                    </div>
                  )}
                  {(ticket.chemicalProperties.molecularWeight || (editMode && canEdit())) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Molecular Weight</label>
                      {editMode && canEdit() ? (
                        <div className="flex items-center mt-1">
                          <input
                            {...registerEdit('chemicalProperties.molecularWeight')}
                            type="number"
                            step="0.01"
                            className="form-input text-sm flex-1"
                            defaultValue={ticket.chemicalProperties.molecularWeight}
                            placeholder="g/mol"
                          />
                          <span className="ml-2 text-sm text-gray-500">g/mol</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          <span className="font-semibold">{ticket.chemicalProperties.molecularWeight}</span> g/mol
                        </p>
                      )}
                    </div>
                  )}
                  
                  {ticket.chemicalProperties.iupacName && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-500">IUPAC Name</label>
                      <p className="mt-1 text-sm text-gray-900 italic">
                        {ticket.chemicalProperties.iupacName}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Physical State</label>
                    {editMode && canEdit() ? (
                      <select
                        {...registerEdit('chemicalProperties.physicalState')}
                        className="mt-1 form-select text-sm"
                        defaultValue={ticket.chemicalProperties.physicalState}
                      >
                        <option value="Solid">Solid</option>
                        <option value="Liquid">Liquid</option>
                        <option value="Gas">Gas</option>
                        <option value="Powder">Powder</option>
                        <option value="Crystal">Crystal</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {ticket.chemicalProperties.physicalState}
                      </p>
                    )}
                  </div>
                  
                  {ticket.chemicalProperties.pubchemCID && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">PubChem CID</label>
                      <p className="mt-1 text-sm text-gray-900">
                        <a 
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${ticket.chemicalProperties.pubchemCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-millipore-blue hover:text-millipore-blue-dark font-mono"
                        >
                          {ticket.chemicalProperties.pubchemCID} ↗
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {ticket.chemicalProperties.pubchemData?.lastUpdated && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Data Updated</label>
                      <p className="mt-1 text-xs text-gray-600">
                        {new Date(ticket.chemicalProperties.pubchemData.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {ticket.chemicalProperties.shippingConditions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Shipping Conditions</label>
                      {editMode && canEdit() ? (
                        <select
                          {...registerEdit('chemicalProperties.shippingConditions')}
                          className="mt-1 form-select text-sm"
                          defaultValue={ticket.chemicalProperties.shippingConditions}
                        >
                          <option value="Standard">Standard (Ambient)</option>
                          <option value="Wet Ice">Wet Ice (2-8°C)</option>
                          <option value="Dry Ice">Dry Ice (-20°C to -80°C)</option>
                          <option value="Liquid Nitrogen">Liquid Nitrogen (-196°C)</option>
                        </select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {ticket.chemicalProperties.shippingConditions}
                        </p>
                      )}
                    </div>
                  )}

                  {/* New Chemical Property Fields */}
                  {ticket.chemicalProperties.materialSource && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Material Source</label>
                      <p className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {ticket.chemicalProperties.materialSource}
                        </span>
                      </p>
                    </div>
                  )}

                  {ticket.chemicalProperties.animalComponent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Animal Component</label>
                      <p className="mt-1 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.chemicalProperties.animalComponent === 'Animal Component Free'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {ticket.chemicalProperties.animalComponent}
                        </span>
                      </p>
                    </div>
                  )}

                  {ticket.chemicalProperties.storageTemperature && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Storage Temperature</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono bg-blue-50 px-2 py-1 rounded">
                        {ticket.chemicalProperties.storageTemperature}
                      </p>
                    </div>
                  )}

                  {ticket.chemicalProperties.purity && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-500">Purity Range</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {ticket.chemicalProperties.purity.min}% - {ticket.chemicalProperties.purity.max}%
                      </p>
                    </div>
                  )}
                </div>

                {/* SMILES, InChI, InChI Key in gray boxes */}
                <div className="mt-6 space-y-4">
                  {ticket.chemicalProperties.canonicalSMILES && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Canonical SMILES</label>
                      <p className="text-xs text-gray-700 font-mono break-all">
                        {ticket.chemicalProperties.canonicalSMILES}
                      </p>
                    </div>
                  )}

                  {ticket.chemicalProperties.inchi && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-2">InChI</label>
                      {editMode && canEdit() ? (
                        <textarea
                          {...registerEdit('chemicalProperties.inchi')}
                          rows="2"
                          className="form-input text-xs font-mono"
                          defaultValue={ticket.chemicalProperties.inchi}
                        />
                      ) : (
                        <p className="text-xs text-gray-700 font-mono break-all">
                          {ticket.chemicalProperties.inchi}
                        </p>
                      )}
                    </div>
                  )}

                  {ticket.chemicalProperties.inchiKey && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-2">InChI Key</label>
                      {editMode && canEdit() ? (
                        <input
                          {...registerEdit('chemicalProperties.inchiKey')}
                          type="text"
                          className="form-input text-xs font-mono"
                          defaultValue={ticket.chemicalProperties.inchiKey}
                        />
                      ) : (
                        <p className="text-xs text-gray-700 font-mono break-all">
                          {ticket.chemicalProperties.inchiKey}
                        </p>
                      )}
                    </div>
                  )}

                  {ticket.chemicalProperties.synonyms && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-blue-900 mb-2">Synonyms</label>
                      {editMode && canEdit() ? (
                        <textarea
                          {...registerEdit('chemicalProperties.synonyms')}
                          rows="3"
                          className="form-input text-sm"
                          defaultValue={ticket.chemicalProperties.synonyms}
                        />
                      ) : (
                        <p className="text-sm text-blue-900">
                          {ticket.chemicalProperties.synonyms}
                        </p>
                      )}
                    </div>
                  )}

                  {ticket.chemicalProperties.hazardStatements && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <label className="block text-sm font-medium text-red-900 mb-2">Hazard Statements (GHS)</label>
                      {editMode && canEdit() ? (
                        <textarea
                          {...registerEdit('chemicalProperties.hazardStatements')}
                          rows="4"
                          className="form-input text-sm"
                          defaultValue={ticket.chemicalProperties.hazardStatements}
                          placeholder="GHS hazard statements (H-codes), one per line"
                        />
                      ) : (
                        <p className="text-sm text-red-900 whitespace-pre-line">
                          {ticket.chemicalProperties.hazardStatements}
                        </p>
                      )}
                    </div>
                  )}

                  {ticket.chemicalProperties.unNumber && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <label className="block text-sm font-medium text-amber-900 mb-2">UN Number</label>
                      {editMode && canEdit() ? (
                        <input
                          {...registerEdit('chemicalProperties.unNumber')}
                          type="text"
                          className="form-input text-sm font-mono"
                          defaultValue={ticket.chemicalProperties.unNumber}
                          placeholder="e.g., UN1170"
                        />
                      ) : (
                        <p className="text-sm text-amber-900 font-mono">
                          {ticket.chemicalProperties.unNumber}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-amber-700">
                        United Nations number for hazardous materials transport
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional PubChem Properties - Only show visible ones */}
                {ticket.chemicalProperties.additionalProperties?.visibleProperties?.length > 0 && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                      Additional Properties
                      {ticket.chemicalProperties.autoPopulated && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          PubChem Data
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ticket.chemicalProperties.additionalProperties.visibleProperties.map(propKey => {
                        const propertyLabels = {
                          meltingPoint: 'Melting Point',
                          boilingPoint: 'Boiling Point',
                          flashPoint: 'Flash Point',
                          density: 'Density',
                          vaporPressure: 'Vapor Pressure',
                          vaporDensity: 'Vapor Density',
                          refractiveIndex: 'Refractive Index',
                          logP: 'LogP',
                          polarSurfaceArea: 'Polar Surface Area',
                          hydrogenBondDonor: 'H-Bond Donors',
                          hydrogenBondAcceptor: 'H-Bond Acceptors',
                          rotatableBonds: 'Rotatable Bonds',
                          exactMass: 'Exact Mass',
                          monoisotopicMass: 'Monoisotopic Mass',
                          complexity: 'Complexity',
                          heavyAtomCount: 'Heavy Atom Count',
                          charge: 'Charge'
                        };

                        const value = ticket.chemicalProperties.additionalProperties[propKey];
                        if (!value) return null;

                        return (
                          <div key={propKey}>
                            <label className="block text-sm font-medium text-gray-500">{propertyLabels[propKey]}</label>
                            <p className="mt-1 text-sm text-gray-900 bg-green-50 px-2 py-1 rounded">
                              {value}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PMOps SKU Assignment Section (if needed) */}
          {(isPMOPS || isAdmin) && !editMode && ticket.status === 'SUBMITTED' && !ticket.partNumber?.baseNumber && (
            <SKUAssignment ticket={ticket} onUpdate={fetchTicket} />
          )}

          {/* SKU Variants Display */}
          {ticket.skuVariants && ticket.skuVariants.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">SKU Variants & Pricing</h3>
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-600 font-medium">
                      {ticket.partNumber?.baseNumber ? 'SKUs Assigned' : 'SKUs Configured'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {ticket.partNumber?.baseNumber && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-blue-900">Base Part Number</label>
                        <p className="text-lg font-bold text-blue-900 font-mono">{ticket.partNumber.baseNumber}</p>
                        <p className="text-xs text-blue-700">
                          Assigned on {new Date(ticket.partNumber.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(ticket.partNumber.baseNumber, 'Part number')}
                        className="btn btn-secondary text-sm flex items-center"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {ticket.skuVariants.map((sku, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            sku.type === 'BULK' ? 'bg-blue-100 text-blue-800' :
                            sku.type === 'CONF' ? 'bg-purple-100 text-purple-800' :
                            sku.type === 'SPEC' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {sku.type}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-semibold">{sku.sku}</span>
                            <button
                              onClick={() => copyToClipboard(sku.sku, 'SKU')}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <ClipboardDocumentIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>
                            {/* Only show pricing for non-VAR/SPEC/CONF types */}
                            {!['VAR', 'SPEC', 'CONF'].includes(sku.type) && sku.pricing?.listPrice && (
                              <div className="mb-1">
                                <p className="text-lg font-semibold text-green-700">${sku.pricing.listPrice}</p>
                                <p className="text-xs text-gray-500">List Price</p>
                              </div>
                            )}
                            <p className="text-sm text-gray-500">{sku.packageSize?.value} {sku.packageSize?.unit}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700">{sku.description}</p>

                      {/* Physical Dimensions - Only for PREPACK */}
                      {!editMode && sku.type === 'PREPACK' && (sku.grossWeight?.value || sku.netWeight?.value || sku.volume?.value) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Physical Dimensions</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            {sku.grossWeight?.value && (
                              <div>
                                <span className="text-gray-600">Gross Weight:</span>
                                <p className="font-medium text-gray-900">{sku.grossWeight.value} {sku.grossWeight.unit}</p>
                              </div>
                            )}
                            {sku.netWeight?.value && (
                              <div>
                                <span className="text-gray-600">Net Weight:</span>
                                <p className="font-medium text-gray-900">{sku.netWeight.value} {sku.netWeight.unit}</p>
                              </div>
                            )}
                            {sku.volume?.value && (
                              <div>
                                <span className="text-gray-600">Volume:</span>
                                <p className="font-medium text-gray-900">{sku.volume.value} {sku.volume.unit}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pricing Details - Only for non-VAR/SPEC/CONF types */}
                      {!editMode && !['VAR', 'SPEC', 'CONF'].includes(sku.type) && sku.pricing && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Pricing Details</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {/* Standard Cost - Always show for BULK SKUs, preserve from Raw Material Cost */}
                            {(sku.pricing.standardCost || (sku.type === 'BULK' && ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit)) && (
                              <div>
                                <span className="text-green-700 font-medium">
                                  Standard Cost:
                                  {sku.type === 'BULK' && <span className="text-green-600 ml-1">(Raw Material)</span>}
                                </span>
                                <p className="font-bold text-green-800">
                                  ${sku.pricing.standardCost || ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit}
                                </p>
                              </div>
                            )}
                            {sku.pricing.margin && !isPMOPS && (
                              <div>
                                <span className="text-gray-600">Margin:</span>
                                <p className="font-medium text-gray-900">{sku.pricing.margin}%</p>
                              </div>
                            )}
                            {sku.pricing.limitPrice && !isPMOPS && (
                              <div>
                                <span className="text-gray-600">Limit Price:</span>
                                <p className="font-medium text-gray-900">${sku.pricing.limitPrice}</p>
                              </div>
                            )}
                            {sku.pricing.listPrice && (
                              <div>
                                <span className="text-gray-600">List Price:</span>
                                <p className="font-medium text-green-700">${sku.pricing.listPrice}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Forecasted Sales Volume - Only for PREPACK */}
                      {!editMode && sku.type === 'PREPACK' && sku.forecastedSalesVolume && (
                        sku.forecastedSalesVolume.year1 || sku.forecastedSalesVolume.year2 || sku.forecastedSalesVolume.year3
                      ) && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-xs font-medium text-blue-900 mb-2">Forecasted Sales Volume (Containers)</h5>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            {sku.forecastedSalesVolume.year1 && (
                              <div>
                                <span className="text-blue-700">Year 1:</span>
                                <p className="font-medium text-blue-900">
                                  {sku.forecastedSalesVolume.year1.toLocaleString()} containers
                                </p>
                              </div>
                            )}
                            {sku.forecastedSalesVolume.year2 && (
                              <div>
                                <span className="text-blue-700">Year 2:</span>
                                <p className="font-medium text-blue-900">
                                  {sku.forecastedSalesVolume.year2.toLocaleString()} containers
                                </p>
                              </div>
                            )}
                            {sku.forecastedSalesVolume.year3 && (
                              <div>
                                <span className="text-blue-700">Year 3:</span>
                                <p className="font-medium text-blue-900">
                                  {sku.forecastedSalesVolume.year3.toLocaleString()} containers
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Base Unit Size - Only visible to Product Managers in edit mode */}
          {isProductManager && editMode && canEdit() && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Base Unit Size</h3>
              </div>
              <div className="card-body">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-4">
                    Define the base unit size for this product. This will be used for:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
                    <li>Calculating standard costs and pricing</li>
                    <li>Default package size for BULK SKU variants</li>
                  </ul>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Unit
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          {...registerEdit('baseUnit.value')}
                          type="number"
                          step="0.01"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                          placeholder="Value"
                          defaultValue={ticket.baseUnit?.value || 1}
                        />
                        <select
                          {...registerEdit('baseUnit.unit')}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-millipore-blue focus:border-millipore-blue text-sm"
                          defaultValue={ticket.baseUnit?.unit || 'kg'}
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="mL">mL</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Example: Set to "1 kg" if this product's base packaging is 1 kilogram
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Base Unit Size Display - View mode for Product Managers */}
          {isProductManager && !editMode && ticket.baseUnit && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Base Unit Size</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Base Unit</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {ticket.baseUnit?.value || 1} {ticket.baseUnit?.unit || 'kg'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Used for cost calculations and BULK SKU sizing</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Information - Only visible to Product Managers */}
          {(ticket.standardCost || ticket.pricingData) && isProductManager && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Pricing Information</h3>
              </div>
              <div className="card-body">
                {editMode && canEdit() && isProductManager ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Standard Costs</h4>
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Base Costing Unit</label>
                        <select
                          {...registerEdit('pricingData.baseUnit')}
                          className="form-select text-sm w-32"
                          defaultValue={ticket.pricingData?.baseUnit || 'g'}
                        >
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="mL">mL</option>
                          <option value="L">L</option>
                          <option value="units">units</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Standard Cost ($/{watchEdit('pricingData.baseUnit') || 'unit'})</label>
                          <input
                            {...registerEdit('pricingData.standardCosts.rawMaterialCostPerUnit')}
                            type="number"
                            step="0.01"
                            className="form-input text-sm"
                            defaultValue={ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || 0.50}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Packaging Cost ($/unit)</label>
                          <input
                            {...registerEdit('pricingData.standardCosts.packagingCost')}
                            type="number"
                            step="0.01"
                            className="form-input text-sm"
                            defaultValue={ticket.pricingData?.standardCosts?.packagingCost || 2.50}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Labor & Overhead ($/unit)</label>
                          <input
                            {...registerEdit('pricingData.standardCosts.laborOverheadCost')}
                            type="number"
                            step="0.01"
                            className="form-input text-sm"
                            defaultValue={ticket.pricingData?.standardCosts?.laborOverheadCost || 5.00}
                          />
                        </div>
                      </div>
                      {/* Standard Cost Display */}
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Standard Cost per Base Unit:</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white">
                            ${parseFloat(watchEdit('pricingData.standardCosts.rawMaterialCostPerUnit') || ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || 0).toFixed(2)} / {watchEdit('pricingData.baseUnit') || ticket.pricingData?.baseUnit || 'unit'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Target Margin</h4>
                      <div className="max-w-xs">
                        <label className="block text-xs font-medium text-gray-600">Target Margin (%)</label>
                        <input
                          {...registerEdit('pricingData.targetMargin')}
                          type="number"
                          className="form-input text-sm"
                          defaultValue={ticket.pricingData?.targetMargin || 50}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Single target margin applied to all SKU sizes
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {!isPMOPS && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Standard Cost per Base Unit</label>
                        <p className="text-lg font-semibold text-gray-900">
                          ${ticket.pricingData?.standardCosts?.rawMaterialCostPerUnit || ticket.standardCost || 0} / {ticket.pricingData?.baseUnit || 'unit'}
                        </p>
                        <p className="text-xs text-gray-500">From Product Manager</p>
                      </div>
                    )}
                    {!isPMOPS && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Target Margin</label>
                        <p className="text-lg font-semibold text-gray-900">{ticket.pricingData?.targetMargin || ticket.margin || 50}%</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-500">SKU Status</label>
                      <p className="text-sm">
                        {ticket.partNumber ? (
                          <span className="text-green-600 font-medium">✓ SKUs Assigned</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">⏳ Awaiting Assignment</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CorpBase Website Data */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-gray-900">CorpBase Website Data</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    AI-Powered
                  </span>
                </div>
                {ticket.corpbaseData?.aiGenerated && (
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-purple-600 font-medium">AI Generated</span>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body space-y-6">
              {/* Product Description */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Product Description</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {ticket.corpbaseData?.productDescription || 'Not provided'}
                  </p>
                  {ticket.corpbaseData?.aiGenerated && ticket.corpbaseData?.generatedAt && (
                    <p className="text-xs text-purple-600 mt-2">
                      ✨ AI-generated on {new Date(ticket.corpbaseData.generatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* SEO Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Website Title (SEO)</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900">
                      {ticket.corpbaseData?.websiteTitle || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Meta Description (SEO)</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900">
                      {ticket.corpbaseData?.metaDescription || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Features & Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Key Features & Benefits</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {ticket.corpbaseData?.keyFeatures || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Applications and Target Industries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Applications</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {ticket.corpbaseData?.applications || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Target Industries</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {ticket.corpbaseData?.targetIndustries || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* UNSPSC Code */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  UNSPSC Code
                  <span className="text-xs text-gray-400 ml-2">(United Nations Standard Products and Services Code)</span>
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900 font-mono">
                    {ticket.corpbaseData?.unspscCode || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Hazard Classification with GHS Data */}
          {ticket.hazardClassification && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Safety & Hazard Classification</h3>
                  {ticket.hazardClassification.pubchemGHS?.autoImported && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-600 font-medium">GHS from PubChem</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                {/* Signal Word - Prominent Display */}
                {ticket.hazardClassification.signalWord && (
                  <div className="mb-6 text-center">
                    <div className={`inline-flex items-center px-6 py-3 rounded-lg text-lg font-bold ${
                      ticket.hazardClassification.signalWord === 'DANGER' 
                        ? 'bg-red-100 text-red-800 border-2 border-red-300' 
                        : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                    }`}>
                      <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {ticket.hazardClassification.signalWord}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {ticket.hazardClassification.ghsClass && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">GHS Classification</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {ticket.hazardClassification.ghsClass}
                      </p>
                    </div>
                  )}
                  
                  {ticket.hazardClassification.transportClass && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Transport Class</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {ticket.hazardClassification.transportClass}
                      </p>
                    </div>
                  )}
                  
                  {ticket.hazardClassification.unNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">UN Number</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {ticket.hazardClassification.unNumber}
                      </p>
                    </div>
                  )}
                </div>
                
                
                {/* Hazard Statements */}
                {ticket.hazardClassification.hazardStatements && ticket.hazardClassification.hazardStatements.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Hazard Statements</label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                        {ticket.hazardClassification.hazardStatements.map((statement, index) => (
                          <li key={index}>{statement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Precautionary Statements */}
                {ticket.hazardClassification.precautionaryStatements && ticket.hazardClassification.precautionaryStatements.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Precautionary Statements</label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                        {ticket.hazardClassification.precautionaryStatements.map((statement, index) => (
                          <li key={index}>{statement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quality Specifications */}
          {ticket.quality && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quality Specifications</h3>
              </div>
              <div className="card-body space-y-6">
                {/* MQ Quality Level */}
                {ticket.quality.mqQualityLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">MQ Quality Level</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${
                      ticket.quality.mqQualityLevel === 'N/A'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {ticket.quality.mqQualityLevel}
                    </span>
                  </div>
                )}

                {/* Quality Attributes Table */}
                {ticket.quality.attributes && ticket.quality.attributes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-3">Quality Attributes</label>
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
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {ticket.quality.attributes.map((attr, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {attr.testAttribute}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  attr.dataSource === 'QC'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {attr.dataSource}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {attr.valueRange}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {attr.comments || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!ticket.quality.attributes || ticket.quality.attributes.length === 0) && ticket.quality.mqQualityLevel === 'N/A' && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No quality specifications defined</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Composition */}
          {ticket.composition && ticket.composition.components && ticket.composition.components.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Product Composition</h3>
              </div>
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proprietary
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Component CAS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weight %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Component Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Component Formula
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ticket.composition.components.map((component, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              component.proprietary
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {component.proprietary ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {component.componentCAS || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                            {component.weightPercent}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {component.componentName || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {component.componentFormula || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p className="font-medium">
                    Total Weight: {ticket.composition.components.reduce((sum, comp) => sum + parseFloat(comp.weightPercent || 0), 0).toFixed(2)}%
                  </p>
                  {Math.abs(ticket.composition.components.reduce((sum, comp) => sum + parseFloat(comp.weightPercent || 0), 0) - 100) > 0.01 && (
                    <p className="text-orange-600 mt-1">⚠ Note: Total weight does not equal 100%</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Ticket Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created by</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {(() => {
                      // First check if createdByUser is populated (ObjectId reference)
                      if (ticket.createdByUser?.firstName && ticket.createdByUser?.lastName) {
                        return `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}`;
                      }
                      if (ticket.createdByUser?.name) return ticket.createdByUser.name;

                      // Fall back to createdBy email string
                      if (ticket.createdBy) return ticket.createdBy;

                      // Fall back to statusHistory for creator info
                      const creationEntry = ticket.statusHistory?.find(h => h.action === 'TICKET_CREATED');
                      if (creationEntry?.userInfo?.firstName && creationEntry?.userInfo?.lastName) {
                        return `${creationEntry.userInfo.firstName} ${creationEntry.userInfo.lastName}`;
                      }
                      if (creationEntry?.userInfo?.name) return creationEntry.userInfo.name;

                      return 'Unknown User';
                    })()}
                  </p>
                  {(() => {
                    // Show role if available from statusHistory
                    const creationEntry = ticket.statusHistory?.find(h => h.action === 'TICKET_CREATED');
                    if (creationEntry?.userInfo?.role) {
                      return <p className="text-xs text-gray-500">{creationEntry.userInfo.role}</p>;
                    }
                    if (ticket.createdByUser?.email && ticket.createdByUser?.firstName) {
                      return <p className="text-xs text-gray-500">{ticket.createdByUser.email}</p>;
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <TagIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Status History */}
          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Activity History</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {ticket.statusHistory.length} activities
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {ticket.statusHistory.slice().reverse().map((history, index) => {
                    const getActionIcon = (action) => {
                      // Icons removed - using color-coded backgrounds instead
                      return null;
                    };

                    const getActionColor = (action) => {
                      switch(action) {
                        case 'TICKET_CREATED':
                          return 'text-blue-600 bg-blue-50 border-blue-200';
                        case 'STATUS_CHANGE':
                          return 'text-purple-600 bg-purple-50 border-purple-200';
                        case 'SKU_ASSIGNMENT':
                          return 'text-green-600 bg-green-50 border-green-200';
                        case 'TICKET_EDIT':
                          return 'text-orange-600 bg-orange-50 border-orange-200';
                        case 'COMMENT_ADDED':
                          return 'text-gray-600 bg-gray-50 border-gray-200';
                        case 'NPDI_INITIATED':
                          return 'text-emerald-600 bg-emerald-50 border-emerald-200';
                        default:
                          return 'text-gray-600 bg-gray-50 border-gray-200';
                      }
                    };

                    return (
                      <div key={index} className={`border rounded-lg p-3 ${getActionColor(history.action)}`}>
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={history.status} />
                                <span className="text-xs font-medium text-gray-700 capitalize">
                                  {(history.action || 'status_change').replace('_', ' ').toLowerCase()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(history.changedAt).toLocaleDateString()} at{' '}
                                {new Date(history.changedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {(history.changedBy || history.userInfo) && (
                                <div className="text-xs text-gray-600 font-medium">
                                  by {history.changedBy?.firstName || history.userInfo?.firstName}{' '}
                                  {history.changedBy?.lastName || history.userInfo?.lastName}
                                  {history.userInfo?.role && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({history.userInfo.role})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {history.reason && (
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed break-words overflow-wrap-anywhere">
                                {history.reason}
                              </p>
                            )}

                            {/* Special display for NPDI Initiation */}
                            {history.action === 'NPDI_INITIATED' && history.details && (
                              <div className="mt-3 bg-white rounded-lg border border-emerald-200 p-3">
                                <div className="text-xs font-semibold text-emerald-800 mb-2">Ticket Number Change:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500 font-medium">Original Number:</span>
                                    <div className="text-gray-900 font-mono font-semibold mt-1">
                                      {history.details.previousTicketNumber}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-emerald-600 font-medium">NPDI Number:</span>
                                    <div className="text-emerald-700 font-mono font-semibold mt-1">
                                      {history.details.newTicketNumber}
                                    </div>
                                  </div>
                                </div>
                                {history.details.initiatedAt && (
                                  <div className="mt-2 pt-2 border-t border-emerald-100 text-xs text-gray-600">
                                    <span className="font-medium">Initiated:</span> {new Date(history.details.initiatedAt).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Generic details display for other actions */}
                            {history.action !== 'NPDI_INITIATED' && history.details && (
                              <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2 break-words overflow-wrap-anywhere">
                                <strong>Details:</strong>
                                {typeof history.details === 'object'
                                  ? Object.entries(history.details).map(([key, value]) => (
                                      <span key={key} className="ml-2 inline-block">
                                        {key}: {JSON.stringify(value)}
                                      </span>
                                    ))
                                  : history.details
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Comments</h3>
            </div>
            <div className="card-body space-y-6">
              {/* Add Comment Form */}
              <form
                onSubmit={handleSubmit(handleAddComment)}
                onKeyDown={(e) => {
                  // Allow Enter in textarea for multi-line comments
                  // Prevent Enter from submitting form accidentally
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <textarea
                    {...register('content', { required: 'Comment is required' })}
                    rows="3"
                    className="form-input"
                    placeholder="Add a comment..."
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="btn btn-primary"
                  >
                    {commentLoading ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-4">
                  {ticket.comments.map((comment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 bg-millipore-blue rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {comment.userInfo?.firstName?.[0]}{comment.userInfo?.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {comment.userInfo?.firstName} {comment.userInfo?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No comments yet. Be the first to add a comment.
                </p>
              )}
            </div>
          </div>
          </div>
        </div>
          )}
        </>
      )}

      {/* UNSPSC Selector Modal */}
      {editMode && (
        <UNSPSCSelector
          isOpen={isUNSPSCSelectorOpen}
          onClose={() => setIsUNSPSCSelectorOpen(false)}
          onSelect={(code) => {
            setValueEdit('corpbaseData.unspscCode', code, { shouldDirty: true });
            setIsUNSPSCSelectorOpen(false);
          }}
          currentValue={watchEdit('corpbaseData.unspscCode')}
        />
      )}
    </div>
  );
};

export default TicketDetails;