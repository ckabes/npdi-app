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
  DynamicCustomSections,
  ProductTicketForm
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
    // Ticket cannot be edited if completed, canceled, or NPDI initiated
    if (ticket.status === 'COMPLETED' || ticket.status === 'CANCELED' || ticket.status === 'NPDI_INITIATED') {
      return false;
    }
    // PMOps and Admin can edit tickets in any status (except COMPLETED, CANCELED, or NPDI_INITIATED)
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
        <ProductTicketForm
          mode="edit"
          ticket={ticket}
          template={template}
          loadingTemplate={loadingTemplate}
          register={registerEdit}
          handleSubmit={handleSubmitEdit}
          control={controlEdit}
          setValue={setValueEdit}
          watch={watchEdit}
          errors={editErrors}
          isDirty={true}
          onSubmit={handleUpdateTicket}
          onCancel={() => setEditMode(false)}
          user={user}
          showHeader={false}
        />
      ) : (
        <>
          {/* PMOps Tabbed View */}
          <div className="space-y-6">
              {/* Ticket Info - Full Width, Compact Horizontal Layout */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Ticket Information</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Created by</p>
                        <p className="text-sm text-gray-900 font-medium truncate" title={(() => {
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
                          })()}>
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