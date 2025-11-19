require('dotenv').config();
const mongoose = require('mongoose');
const ProductTicket = require('../models/ProductTicket');
const axios = require('axios');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Real CAS numbers that can be looked up in PubChem
const casNumbers = [
  '64-17-5',      // Ethanol
  '67-56-1',      // Methanol
  '67-64-1',      // Acetone
  '7732-18-5',    // Water
  '50-00-0',      // Formaldehyde
  '7664-93-9',    // Sulfuric Acid
  '1310-73-2',    // Sodium Hydroxide
  '7647-01-0',    // Hydrochloric Acid
  '107-21-1',     // Ethylene Glycol
  '75-09-2',      // Dichloromethane
  '141-78-6',     // Ethyl Acetate
  '108-88-3',     // Toluene
  '71-43-2',      // Benzene
  '110-54-3',     // Hexane
  '79-01-6',      // Trichloroethylene
  '75-05-8',      // Acetonitrile
  '67-66-3',      // Chloroform
  '74-87-3',      // Methyl Chloride
  '56-81-5',      // Glycerol
  '64-19-7',      // Acetic Acid
  '7664-41-7',    // Ammonia
  '7697-37-2',    // Nitric Acid
  '110-82-7',     // Cyclohexane
  '100-41-4',     // Ethylbenzene
  '108-95-2',     // Phenol
  '67-63-0',      // Isopropanol
  '74-98-6',      // Propane
  '78-93-3',      // Methyl Ethyl Ketone
  '109-99-9',     // Tetrahydrofuran
  '123-91-1',     // 1,4-Dioxane
  '110-86-1',     // Pyridine
  '98-95-3',      // Nitrobenzene
  '100-42-5',     // Styrene
  '107-06-2',     // 1,2-Dichloroethane
  '95-47-6',      // o-Xylene
  '106-42-3',     // p-Xylene
  '108-38-3',     // m-Xylene
  '62-53-3',      // Aniline
  '98-86-2',      // Acetophenone
  '100-52-7',     // Benzaldehyde
];

const users = [
  { email: 'john.smith@milliporesigma.com', firstName: 'John', lastName: 'Smith' },
  { email: 'jane.doe@milliporesigma.com', firstName: 'Jane', lastName: 'Doe' },
  { email: 'mike.johnson@milliporesigma.com', firstName: 'Mike', lastName: 'Johnson' },
  { email: 'sarah.williams@milliporesigma.com', firstName: 'Sarah', lastName: 'Williams' },
  { email: 'robert.brown@milliporesigma.com', firstName: 'Robert', lastName: 'Brown' },
  { email: 'emily.davis@milliporesigma.com', firstName: 'Emily', lastName: 'Davis' },
  { email: 'david.miller@milliporesigma.com', firstName: 'David', lastName: 'Miller' },
  { email: 'lisa.wilson@milliporesigma.com', firstName: 'Lisa', lastName: 'Wilson' },
];

const sbus = ['775', 'P90', '440', 'P87', 'P89', 'P85'];
const statuses = ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const brands = ['Sigma-Aldrich', 'SAFC', 'Supelco', 'Millipore', 'Merck'];

// Helper to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date between 6 months ago and today
const randomDate = () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const today = new Date();
  const diffTime = today.getTime() - sixMonthsAgo.getTime();
  const randomTime = Math.random() * diffTime;
  return new Date(sixMonthsAgo.getTime() + randomTime);
};

// Helper to generate 6-digit part number
const generatePartNumber = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// Helper to generate NPDI tracking number (starts with 100000)
const generateNPDITracking = () => {
  const baseNumber = 10000016485;
  const offset = Math.floor(Math.random() * 1000);
  return String(baseNumber + offset);
};

// Fetch chemical data from PubChem
const fetchChemicalData = async (casNumber) => {
  try {
    console.log(`Fetching PubChem data for CAS ${casNumber}...`);
    const response = await axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${casNumber}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`);

    if (response.data && response.data.PropertyTable && response.data.PropertyTable.Properties) {
      const props = response.data.PropertyTable.Properties[0];
      return {
        molecularFormula: props.MolecularFormula,
        molecularWeight: props.MolecularWeight,
        iupacName: props.IUPACName || casNumber,
        cid: props.CID
      };
    }
  } catch (error) {
    console.log(`Could not fetch data for CAS ${casNumber}, using defaults`);
  }
  return {
    molecularFormula: 'Unknown',
    molecularWeight: 0,
    iupacName: casNumber,
    cid: null
  };
};

const generateTicket = async (index) => {
  const createdDate = randomDate();
  const updatedDate = new Date(createdDate.getTime() + Math.random() * (new Date().getTime() - createdDate.getTime()));
  const user = randomItem(users);
  const casNumber = randomItem(casNumbers);
  const status = randomItem(statuses);
  const sbu = randomItem(sbus);
  const priority = randomItem(priorities);
  const brand = randomItem(brands);

  // Fetch chemical data from PubChem
  const chemData = await fetchChemicalData(casNumber);

  const year = createdDate.getFullYear();
  const ticketNumber = `NPDI-${year}-${String(index + 1).padStart(4, '0')}`;

  // Determine if ticket has part number (70% chance if SUBMITTED or later)
  const hasPartNumber = status !== 'DRAFT' && Math.random() > 0.3;
  const partNumber = hasPartNumber ? generatePartNumber() : null;

  // Determine if ticket has NPDI tracking (only if NPDI_INITIATED or COMPLETED)
  const hasNPDI = (status === 'NPDI_INITIATED' || status === 'COMPLETED');
  const npdiTrackingNumber = hasNPDI ? generateNPDITracking() : null;

  const ticket = {
    ticketNumber: hasNPDI ? npdiTrackingNumber : ticketNumber,
    productName: chemData.iupacName,
    productionType: Math.random() > 0.5 ? 'Produced' : 'Procured',
    sbu,
    primaryPlant: randomItem(['St. Louis', 'Buchs', 'Carlsbad', 'Darmstadt', 'Shanghai']),
    brand,
    priority,
    status,
    createdBy: user.email,
    createdAt: createdDate,
    updatedAt: updatedDate,

    chemicalProperties: {
      casNumber,
      molecularFormula: chemData.molecularFormula,
      molecularWeight: chemData.molecularWeight,
      iupacName: chemData.iupacName,
      pubchemCID: chemData.cid,
      physicalState: randomItem(['Solid', 'Liquid', 'Gas', 'Powder']),
      storageConditions: {
        temperature: {
          value: randomItem(['2-8', '15-25', '-20', 'Ambient']),
          unit: '°C'
        }
      },
      autoPopulated: true
    },

    composition: {
      components: [{
        proprietary: false,
        componentCAS: casNumber,
        weightPercent: 100,
        componentName: chemData.iupacName,
        componentFormula: chemData.molecularFormula,
        createdAt: createdDate
      }]
    },

    quality: {
      mqQualityLevel: randomItem(['MQ100', 'MQ200', 'MQ300', 'MQ400', 'MQ500']),
      attributes: [
        {
          testAttribute: 'Chemical Purity',
          dataSource: 'QC',
          valueRange: randomItem(['≥99.0%', '≥99.5%', '≥99.8%', '≥99.9%', '≥98.0%']),
          comments: 'Determined by Gas Chromatography (GC)',
          createdAt: createdDate
        },
        {
          testAttribute: 'Identity',
          dataSource: 'QC',
          valueRange: 'Conforms',
          comments: 'Confirmed by NMR Spectroscopy',
          createdAt: createdDate
        },
        {
          testAttribute: 'Water Content',
          dataSource: 'QC',
          valueRange: randomItem(['≤0.1%', '≤0.5%', '≤1.0%', '≤0.05%']),
          comments: 'Karl Fischer titration',
          createdAt: createdDate
        },
        {
          testAttribute: 'Appearance',
          dataSource: 'Vendor',
          valueRange: randomItem(['Clear colorless liquid', 'White to off-white powder', 'Colorless liquid', 'White crystalline solid']),
          comments: 'Visual inspection',
          createdAt: createdDate
        }
      ]
    },

    corpbaseData: {
      productDescription: `High purity ${chemData.iupacName} suitable for laboratory and research applications. Manufactured to strict quality standards.`,
      websiteTitle: `${chemData.iupacName} | ${brand} | CAS ${casNumber}`,
      metaDescription: `Buy ${chemData.iupacName} (CAS ${casNumber}) from ${brand}. High quality chemical for research and laboratory use.`,
      keyFeatures: `• High purity grade\n• Suitable for research applications\n• Available in multiple package sizes\n• Quality assured by ${brand}`,
      applications: `• Chemical synthesis\n• Analytical chemistry\n• Research and development\n• Quality control`,
      targetIndustries: `• Pharmaceutical\n• Biotechnology\n• Academic Research\n• Chemical Manufacturing`
    },

    statusHistory: [
      {
        status: 'DRAFT',
        changedBy: user.email,
        reason: `Ticket created by ${user.firstName} ${user.lastName}`,
        action: 'TICKET_CREATED',
        changedAt: createdDate,
        userInfo: user
      }
    ]
  };

  // Add part number if applicable
  if (partNumber) {
    ticket.partNumber = {
      baseNumber: partNumber,
      assignedBy: 'pmops@milliporesigma.com',
      assignedAt: new Date(createdDate.getTime() + 86400000) // 1 day later
    };

    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: 'pmops@milliporesigma.com',
      reason: `SKU base number assigned: "${partNumber}" by PM Ops Team`,
      action: 'SKU_ASSIGNMENT',
      changedAt: new Date(createdDate.getTime() + 86400000)
    });
  }

  // Add status progression history
  if (status !== 'DRAFT') {
    const statusOrder = ['SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED'];
    const currentStatusIndex = statusOrder.indexOf(status);

    for (let i = 0; i <= currentStatusIndex; i++) {
      const statusDate = new Date(createdDate.getTime() + (i + 1) * 172800000); // 2 days apart
      ticket.statusHistory.push({
        status: statusOrder[i],
        changedBy: i === 0 ? user.email : 'pmops@milliporesigma.com',
        reason: `Status changed to ${statusOrder[i]} by ${i === 0 ? user.firstName + ' ' + user.lastName : 'PM Ops Team'}`,
        action: 'STATUS_CHANGE',
        changedAt: statusDate
      });
    }
  }

  // Add NPDI tracking if applicable
  if (hasNPDI) {
    ticket.npdiTracking = {
      trackingNumber: npdiTrackingNumber,
      initiatedBy: 'pmops@milliporesigma.com',
      initiatedAt: new Date(createdDate.getTime() + 604800000) // 7 days later
    };

    ticket.statusHistory.push({
      status: 'NPDI_INITIATED',
      changedBy: 'pmops@milliporesigma.com',
      reason: `NPDI initiated by PM Ops Team. Ticket number changed from "${ticketNumber}" to "${npdiTrackingNumber}". NPDI Tracking: ${npdiTrackingNumber}`,
      action: 'NPDI_INITIATED',
      changedAt: new Date(createdDate.getTime() + 604800000),
      details: {
        previousTicketNumber: ticketNumber,
        newTicketNumber: npdiTrackingNumber,
        npdiTrackingNumber: npdiTrackingNumber,
        initiatedAt: new Date(createdDate.getTime() + 604800000)
      }
    });
  }

  // Add SKU variants for non-draft tickets
  if (status !== 'DRAFT' && partNumber) {
    const packageSizes = [
      { value: 100, unit: 'g' },
      { value: 500, unit: 'g' },
      { value: 1, unit: 'kg' },
      { value: 100, unit: 'mL' },
      { value: 500, unit: 'mL' },
      { value: 5, unit: 'kg' },
      { value: 25, unit: 'kg' }
    ];

    const skuVariants = [];

    // Add PREPACK variants (2-4 different package sizes)
    const numPrepack = Math.floor(Math.random() * 3) + 2;
    packageSizes.slice(0, numPrepack).forEach((pkg, idx) => {
      skuVariants.push({
        sku: `${partNumber}-${String(skuVariants.length + 1).padStart(2, '0')}`,
        type: 'PREPACK',
        description: `${pkg.value}${pkg.unit} prepack`,
        packageSize: pkg,
        pricing: {
          listPrice: Math.floor(Math.random() * 500) + 50,
          currency: 'USD'
        },
        createdBy: 'pmops@milliporesigma.com',
        assignedAt: new Date(createdDate.getTime() + 86400000)
      });
    });

    // For tickets IN_PROCESS or later, add VAR/SPEC/CONF SKUs
    if (status === 'IN_PROCESS' || status === 'NPDI_INITIATED' || status === 'COMPLETED') {
      // Add BULK variant
      skuVariants.push({
        sku: `${partNumber}-BULK`,
        type: 'BULK',
        description: 'Bulk quantity (customer specified)',
        packageSize: { value: 1, unit: 'bulk' },
        pricing: {
          listPrice: Math.floor(Math.random() * 5000) + 1000,
          currency: 'USD'
        },
        createdBy: 'pmops@milliporesigma.com',
        assignedAt: new Date(createdDate.getTime() + 172800000)
      });

      // Add VAR (Variant) - different purity grade
      const variantPurity = randomItem(['95%', '98%', '99.5%', '99.9%']);
      skuVariants.push({
        sku: `${partNumber}-VAR01`,
        type: 'VAR',
        description: `${variantPurity} purity variant`,
        packageSize: randomItem(packageSizes.slice(0, 3)),
        pricing: {
          listPrice: Math.floor(Math.random() * 600) + 80,
          currency: 'USD'
        },
        createdBy: 'pmops@milliporesigma.com',
        assignedAt: new Date(createdDate.getTime() + 172800000)
      });

      // Add SPEC (Special) - custom specification
      skuVariants.push({
        sku: `${partNumber}-SPEC`,
        type: 'SPEC',
        description: 'Special order - custom specifications',
        packageSize: { value: 1, unit: 'kg' },
        pricing: {
          listPrice: Math.floor(Math.random() * 1000) + 200,
          currency: 'USD'
        },
        createdBy: 'pmops@milliporesigma.com',
        assignedAt: new Date(createdDate.getTime() + 172800000)
      });

      // Add CONF (Configuration) - specific configuration
      skuVariants.push({
        sku: `${partNumber}-CONF`,
        type: 'CONF',
        description: 'Custom configuration for specific application',
        packageSize: { value: 250, unit: 'g' },
        pricing: {
          listPrice: Math.floor(Math.random() * 750) + 150,
          currency: 'USD'
        },
        createdBy: 'pmops@milliporesigma.com',
        assignedAt: new Date(createdDate.getTime() + 172800000)
      });
    }

    ticket.skuVariants = skuVariants;
  }

  // For SUBMITTED tickets without part number, add a comment that SKUs need to be assigned
  if (status === 'SUBMITTED' && !partNumber) {
    ticket.comments = [{
      user: 'pmops@milliporesigma.com',
      content: 'TODO: Assign part number and generate SKU variants (VAR/SPEC/CONF) once approved.',
      timestamp: new Date(createdDate.getTime() + 43200000), // 12 hours later
      userInfo: {
        firstName: 'PM',
        lastName: 'Ops',
        email: 'pmops@milliporesigma.com',
        role: 'PMOps'
      }
    }];
  }

  return ticket;
};

const seedTickets = async () => {
  try {
    await connectDB();

    console.log('\n🗑️  Deleting all existing tickets...');
    const deleteResult = await ProductTicket.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} tickets`);

    console.log('\n🌱 Creating 50 new realistic tickets...');
    const tickets = [];

    for (let i = 0; i < 50; i++) {
      console.log(`\nGenerating ticket ${i + 1}/50...`);
      const ticket = await generateTicket(i);
      tickets.push(ticket);

      // Small delay to avoid rate limiting PubChem API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n💾 Inserting tickets into database...');
    const result = await ProductTicket.insertMany(tickets, { ordered: false });
    console.log(`✅ Successfully created ${result.length} tickets!`);

    // Print summary
    console.log('\n📊 Summary:');
    const statusCounts = await ProductTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    statusCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    const sbuCounts = await ProductTicket.aggregate([
      { $group: { _id: '$sbu', count: { $sum: 1 } } }
    ]);
    console.log('\n   By SBU:');
    sbuCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedTickets();
