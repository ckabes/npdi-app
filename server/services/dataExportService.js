const ExcelJS = require('exceljs');

/**
 * Data Export Service
 *
 * Creates a comprehensive Excel export of all ticket data
 * Format: Field Name | Value
 * Organized into sections for easy copying into external systems
 */

const generateDataExport = async (ticket) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ticket Data Export');

  // Set column widths
  worksheet.columns = [
    { key: 'field', width: 40 },
    { key: 'value', width: 60 }
  ];

  let currentRow = 1;

  // Helper function to add a section header
  const addSectionHeader = (title) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = title;
    row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(currentRow, 1, currentRow, 2);
    row.height = 25;
    currentRow++;
    currentRow++; // Add blank row after header
  };

  // Helper function to add a field
  const addField = (fieldName, value) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = fieldName;
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };

    // Handle arrays and objects
    let displayValue = value;
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (value && typeof value === 'object') {
      displayValue = JSON.stringify(value, null, 2);
    } else if (value === null || value === undefined) {
      displayValue = '';
    }

    row.getCell(2).value = displayValue;
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    currentRow++;
  };

  // Helper function to add a sub-section
  const addSubSection = (title) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = title;
    row.getCell(1).font = { bold: true, size: 12 };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E2F3' }
    };
    worksheet.mergeCells(currentRow, 1, currentRow, 2);
    row.height = 20;
    currentRow++;
  };

  // ============================================================================
  // BASIC INFORMATION
  // ============================================================================
  addSectionHeader('BASIC INFORMATION');
  addField('Ticket Number', ticket.ticketNumber);
  addField('Product Name', ticket.productName);
  addField('Production Type', ticket.productionType);
  addField('Strategic Business Unit (SBU)', ticket.sbu);
  addField('Primary Plant', ticket.primaryPlant);
  addField('Brand', ticket.brand);
  addField('Status', ticket.status);
  addField('Priority', ticket.priority);
  addField('Created By (Email)', ticket.createdBy);
  addField('Created By (Name)', ticket.createdByUser ? `${ticket.createdByUser.firstName} ${ticket.createdByUser.lastName}` : '');
  addField('Assigned To', ticket.assignedTo);
  addField('Created At', ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '');
  addField('Updated At', ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '');
  currentRow++;

  // ============================================================================
  // PRODUCT SCOPE & DISTRIBUTION
  // ============================================================================
  addSectionHeader('PRODUCT SCOPE & DISTRIBUTION');
  addField('Product Scope', ticket.productScope?.scope);
  addField('Other Scope Specification', ticket.productScope?.otherSpecification);
  addField('Distribution Type', ticket.distributionType?.type);
  addField('COA Creator', ticket.distributionType?.coaCreator);
  addField('Labeling Type', ticket.distributionType?.labelingType);
  addField('Labeling Responsibility', ticket.distributionType?.labelingResponsibility);
  addField('Vendor Label Source', ticket.distributionType?.vendorLabelSource);
  addField('Country of Origin', ticket.countryOfOrigin);
  addField('SIAL Product Hierarchy', ticket.sialProductHierarchy);
  addField('Material Group', ticket.materialGroup);
  currentRow++;

  // ============================================================================
  // BUSINESS LINE
  // ============================================================================
  if (ticket.businessLine) {
    addSectionHeader('BUSINESS LINE');
    addField('Business Line', ticket.businessLine.line);
    addField('Main Group GPH', ticket.businessLine.mainGroupGPH);
    addField('Other Specification', ticket.businessLine.otherSpecification);
    currentRow++;
  }

  // ============================================================================
  // CHEMICAL PROPERTIES
  // ============================================================================
  if (ticket.chemicalProperties) {
    const chem = ticket.chemicalProperties;
    addSectionHeader('CHEMICAL PROPERTIES');
    addField('CAS Number', chem.casNumber);
    addField('Molecular Formula', chem.molecularFormula);
    addField('Molecular Weight', chem.molecularWeight);
    addField('IUPAC Name', chem.iupacName);
    addField('Canonical SMILES', chem.canonicalSMILES);
    addField('Isomeric SMILES', chem.isomericSMILES);
    addField('InChI', chem.inchi);
    addField('InChI Key', chem.inchiKey);
    addField('PubChem CID', chem.pubchemCID);
    addField('Synonyms', chem.synonyms);
    addField('Physical State', chem.physicalState);
    addField('Material Source', chem.materialSource);
    addField('Animal Component', chem.animalComponent);
    addField('Storage Temperature', chem.storageTemperature);
    addField('Shipping Conditions', chem.shippingConditions);
    addField('Auto-Populated from PubChem', chem.autoPopulated ? 'Yes' : 'No');

    // Storage Conditions
    if (chem.storageConditions) {
      addSubSection('Storage Conditions');
      if (chem.storageConditions.temperature) {
        addField('Temperature Range', `${chem.storageConditions.temperature.min || ''} to ${chem.storageConditions.temperature.max || ''} ${chem.storageConditions.temperature.unit || ''}`);
      }
      addField('Humidity', chem.storageConditions.humidity);
      addField('Light Protection', chem.storageConditions.light);
      addField('Atmosphere', chem.storageConditions.atmosphere);
    }

    // Solubility
    if (chem.solubility && chem.solubility.length > 0) {
      addSubSection('Solubility');
      chem.solubility.forEach((sol, idx) => {
        addField(`Solvent ${idx + 1}`, sol.solvent);
        addField(`Value ${idx + 1}`, sol.value);
      });
    }

    currentRow++;
  }

  // ============================================================================
  // HAZARD CLASSIFICATION
  // ============================================================================
  if (ticket.hazardClassification) {
    const hazard = ticket.hazardClassification;
    addSectionHeader('HAZARD CLASSIFICATION');
    addField('GHS Class', hazard.ghsClass);
    addField('Signal Word', hazard.signalWord);
    addField('Hazard Statements', hazard.hazardStatements);
    addField('Precautionary Statements', hazard.precautionaryStatements);
    addField('Transport Class', hazard.transportClass);
    addField('UN Number', hazard.unNumber);
    addField('Auto-Imported from PubChem', hazard.pubchemGHS?.autoImported ? 'Yes' : 'No');
    currentRow++;
  }

  // ============================================================================
  // QUALITY SPECIFICATIONS
  // ============================================================================
  if (ticket.quality) {
    const quality = ticket.quality;
    addSectionHeader('QUALITY SPECIFICATIONS');
    addField('MQ Quality Level', quality.mqQualityLevel);

    if (quality.attributes && quality.attributes.length > 0) {
      addSubSection('Quality Attributes');
      quality.attributes.forEach((attr, idx) => {
        addField(`Attribute ${idx + 1} - Test`, attr.testAttribute);
        addField(`Attribute ${idx + 1} - Data Source`, attr.dataSource);
        addField(`Attribute ${idx + 1} - Value Range`, attr.valueRange);
        addField(`Attribute ${idx + 1} - Comments`, attr.comments);
      });
    }
    currentRow++;
  }

  // ============================================================================
  // COMPOSITION
  // ============================================================================
  if (ticket.composition && ticket.composition.components && ticket.composition.components.length > 0) {
    addSectionHeader('PRODUCT COMPOSITION');
    ticket.composition.components.forEach((comp, idx) => {
      addSubSection(`Component ${idx + 1}`);
      addField('Proprietary', comp.proprietary ? 'Yes' : 'No');
      addField('Component Name', comp.componentName);
      addField('Component CAS', comp.componentCAS);
      addField('Component Formula', comp.componentFormula);
      addField('Weight Percent', comp.weightPercent);
    });
    currentRow++;
  }

  // ============================================================================
  // REGULATORY INFORMATION
  // ============================================================================
  if (ticket.regulatoryInfo) {
    const reg = ticket.regulatoryInfo;
    addSectionHeader('REGULATORY INFORMATION');
    addField('FDA Status', reg.fdaStatus);
    addField('EPA Registration', reg.epaRegistration);
    addField('REACH Registration', reg.reachRegistration);
    addField('TSCA Listed', reg.tsca ? 'Yes' : 'No');
    addField('EINECS Number', reg.einecs);
    addField('RoHS Compliant', reg.rohsCompliant ? 'Yes' : 'No');
    addField('Kosher Status', reg.kosherStatus);
    addField('Halal Status', reg.halalStatus);
    currentRow++;
  }

  // ============================================================================
  // SKU VARIANTS & PART NUMBER
  // ============================================================================
  addSectionHeader('SKU VARIANTS & PART NUMBERS');
  addField('Base Part Number', ticket.partNumber?.baseNumber);
  addField('Assigned By', ticket.partNumber?.assignedBy);
  addField('Assigned At', ticket.partNumber?.assignedAt ? new Date(ticket.partNumber.assignedAt).toLocaleString() : '');

  if (ticket.skuVariants && ticket.skuVariants.length > 0) {
    ticket.skuVariants.forEach((sku, idx) => {
      addSubSection(`SKU Variant ${idx + 1} - ${sku.type}`);
      addField('SKU Number', sku.sku);
      addField('Type', sku.type);
      addField('Description', sku.description);
      addField('Package Size', `${sku.packageSize?.value || ''} ${sku.packageSize?.unit || ''}`);
      addField('Gross Weight', sku.grossWeight?.value ? `${sku.grossWeight.value} ${sku.grossWeight.unit || ''}` : '');
      addField('Net Weight', sku.netWeight?.value ? `${sku.netWeight.value} ${sku.netWeight.unit || ''}` : '');
      addField('Volume', sku.volume?.value ? `${sku.volume.value} ${sku.volume.unit || ''}` : '');

      if (sku.pricing) {
        addField('Standard Cost', sku.pricing.standardCost);
        addField('Calculated Cost', sku.pricing.calculatedCost);
        addField('Margin %', sku.pricing.calculatedMarginPercent);
        addField('Limit Price', sku.pricing.limitPrice);
        addField('List Price', sku.pricing.listPrice);
        addField('Currency', sku.pricing.currency);
      }

      if (sku.forecastedSalesVolume) {
        addField('Year 1 Forecast', sku.forecastedSalesVolume.year1);
        addField('Year 2 Forecast', sku.forecastedSalesVolume.year2);
        addField('Year 3 Forecast', sku.forecastedSalesVolume.year3);
      }
    });
  }
  currentRow++;

  // ============================================================================
  // PRICING DATA
  // ============================================================================
  if (ticket.pricingData) {
    const pricing = ticket.pricingData;
    addSectionHeader('PRICING CALCULATIONS');
    addField('Base Unit', pricing.baseUnit);
    addField('Target Margin %', pricing.targetMargin);

    if (pricing.standardCosts) {
      addSubSection('Standard Costs');
      addField('Raw Material Cost Per Unit', pricing.standardCosts.rawMaterialCostPerUnit);
    }

    addField('Calculated At', pricing.calculatedAt ? new Date(pricing.calculatedAt).toLocaleString() : '');
    currentRow++;
  }

  // ============================================================================
  // CORPBASE WEBSITE DATA
  // ============================================================================
  if (ticket.corpbaseData) {
    const corpbase = ticket.corpbaseData;
    addSectionHeader('CORPBASE WEBSITE DATA');
    addField('Product Description', corpbase.productDescription);
    addField('Website Title (SEO)', corpbase.websiteTitle);
    addField('Meta Description (SEO)', corpbase.metaDescription);
    addField('Key Features & Benefits', corpbase.keyFeatures);
    addField('Applications', corpbase.applications);
    addField('Target Industries', corpbase.targetIndustries);
    addField('Target Markets', corpbase.targetMarkets);
    addField('Competitive Advantages', corpbase.competitiveAdvantages);
    addField('Technical Specifications', corpbase.technicalSpecifications);
    addField('Quality Standards', corpbase.qualityStandards);
    addField('UNSPSC Code', corpbase.unspscCode);
    addField('AI Generated', corpbase.aiGenerated ? 'Yes' : 'No');
    addField('Generated At', corpbase.generatedAt ? new Date(corpbase.generatedAt).toLocaleString() : '');
    currentRow++;
  }

  // ============================================================================
  // VENDOR INFORMATION
  // ============================================================================
  if (ticket.vendorInformation) {
    const vendor = ticket.vendorInformation;
    addSectionHeader('VENDOR INFORMATION');
    addField('Vendor Name', vendor.vendorName);
    addField('Vendor Product Name', vendor.vendorProductName);
    addField('Vendor SAP Number', vendor.vendorSAPNumber);
    addField('Vendor Product Number', vendor.vendorProductNumber);
    addField('Vendor Cost Per UOM', vendor.vendorCostPerUOM?.value ? `${vendor.vendorCostPerUOM.value} ${vendor.vendorCostPerUOM.unit || ''}` : '');
    addField('Amount To Be Purchased', vendor.amountToBePurchased?.value ? `${vendor.amountToBePurchased.value} ${vendor.amountToBePurchased.unit || ''}` : '');
    addField('Vendor Lead Time (Weeks)', vendor.vendorLeadTimeWeeks);
    addField('Purchase UOM', vendor.purchaseUOM);
    addField('Purchase Currency', vendor.purchaseCurrency);
    addField('Country of Origin (Vendor)', vendor.countryOfOrigin);
    currentRow++;
  }

  // ============================================================================
  // INTELLECTUAL PROPERTY
  // ============================================================================
  if (ticket.intellectualProperty) {
    const ip = ticket.intellectualProperty;
    addSectionHeader('INTELLECTUAL PROPERTY');
    addField('Has Intellectual Property', ip.hasIP ? 'Yes' : 'No');
    addField('Patent Number', ip.patentNumber);
    addField('License Number', ip.licenseNumber);
    currentRow++;
  }

  // ============================================================================
  // RETEST / EXPIRATION
  // ============================================================================
  if (ticket.retestOrExpiration) {
    const retest = ticket.retestOrExpiration;
    addSectionHeader('RETEST / EXPIRATION');
    addField('Has Expiration Date', retest.hasExpirationDate ? 'Yes' : 'No');
    if (retest.expirationPeriod) {
      addField('Expiration Period', `${retest.expirationPeriod.value || ''} ${retest.expirationPeriod.unit || ''}`);
    }
    addField('Has Retest Date', retest.hasRetestDate ? 'Yes' : 'No');
    if (retest.retestPeriod) {
      addField('Retest Period', `${retest.retestPeriod.value || ''} ${retest.retestPeriod.unit || ''}`);
    }
    addField('Has Shelf Life', retest.hasShelfLife ? 'Yes' : 'No');
    if (retest.shelfLifePeriod) {
      addField('Shelf Life Period', `${retest.shelfLifePeriod.value || ''} ${retest.shelfLifePeriod.unit || ''}`);
    }
    currentRow++;
  }

  // ============================================================================
  // LAUNCH TIMELINE
  // ============================================================================
  if (ticket.launchTimeline) {
    const timeline = ticket.launchTimeline;
    addSectionHeader('LAUNCH TIMELINE');
    addField('Target Launch Date', timeline.targetLaunchDate ? new Date(timeline.targetLaunchDate).toLocaleDateString() : '');

    if (timeline.milestones && timeline.milestones.length > 0) {
      addSubSection('Milestones');
      timeline.milestones.forEach((milestone, idx) => {
        addField(`Milestone ${idx + 1} - Name`, milestone.name);
        addField(`Milestone ${idx + 1} - Due Date`, milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '');
        addField(`Milestone ${idx + 1} - Completed`, milestone.completed ? 'Yes' : 'No');
        addField(`Milestone ${idx + 1} - Completed Date`, milestone.completedDate ? new Date(milestone.completedDate).toLocaleDateString() : '');
        addField(`Milestone ${idx + 1} - Notes`, milestone.notes);
      });
    }
    currentRow++;
  }

  // ============================================================================
  // NPDI TRACKING
  // ============================================================================
  if (ticket.npdiTracking) {
    const npdi = ticket.npdiTracking;
    addSectionHeader('NPDI TRACKING');
    addField('NPDI Tracking Number', npdi.trackingNumber);
    addField('Initiated By', npdi.initiatedBy);
    addField('Initiated At', npdi.initiatedAt ? new Date(npdi.initiatedAt).toLocaleString() : '');
    currentRow++;
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================
  if (ticket.comments && ticket.comments.length > 0) {
    addSectionHeader('COMMENTS & ACTIVITY');
    ticket.comments.forEach((comment, idx) => {
      addSubSection(`Comment ${idx + 1}`);
      addField('User', comment.userInfo?.email || comment.user);
      addField('Name', `${comment.userInfo?.firstName || ''} ${comment.userInfo?.lastName || ''}`);
      addField('Timestamp', new Date(comment.timestamp).toLocaleString());
      addField('Content', comment.content);
    });
    currentRow++;
  }

  // ============================================================================
  // STATUS HISTORY
  // ============================================================================
  if (ticket.statusHistory && ticket.statusHistory.length > 0) {
    addSectionHeader('STATUS HISTORY');
    ticket.statusHistory.forEach((history, idx) => {
      addSubSection(`History Entry ${idx + 1}`);
      addField('Action', history.action);
      addField('Status', history.status);
      addField('Changed By', history.changedBy);
      addField('User Name', history.userInfo ? `${history.userInfo.firstName || ''} ${history.userInfo.lastName || ''}` : '');
      addField('User Role', history.userInfo?.role || '');
      addField('Changed At', new Date(history.changedAt).toLocaleString());
      addField('Reason', history.reason);
      if (history.details) {
        addField('Details', JSON.stringify(history.details, null, 2));
      }
    });
    currentRow++;
  }

  // Apply borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return workbook;
};

module.exports = {
  generateDataExport
};
