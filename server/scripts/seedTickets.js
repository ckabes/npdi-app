require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const ProductTicket = require('../models/ProductTicket');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding tickets...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate 1000 unique CAS numbers with chemical data
const generateCASDatabase = () => {
  const casData = [];

  // Common solvents and reagents (100 entries)
  const commonChemicals = [
    { cas: '64-17-5', name: 'Ethanol', formula: 'C2H6O', mw: 46.07, state: 'Liquid' },
    { cas: '67-64-1', name: 'Acetone', formula: 'C3H6O', mw: 58.08, state: 'Liquid' },
    { cas: '67-56-1', name: 'Methanol', formula: 'CH4O', mw: 32.04, state: 'Liquid' },
    { cas: '75-09-2', name: 'Dichloromethane', formula: 'CH2Cl2', mw: 84.93, state: 'Liquid' },
    { cas: '64-19-7', name: 'Acetic Acid', formula: 'C2H4O2', mw: 60.05, state: 'Liquid' },
    { cas: '71-43-2', name: 'Benzene', formula: 'C6H6', mw: 78.11, state: 'Liquid' },
    { cas: '108-88-3', name: 'Toluene', formula: 'C7H8', mw: 92.14, state: 'Liquid' },
    { cas: '100-41-4', name: 'Ethylbenzene', formula: 'C8H10', mw: 106.17, state: 'Liquid' },
    { cas: '1330-20-7', name: 'Xylene', formula: 'C8H10', mw: 106.16, state: 'Liquid' },
    { cas: '110-54-3', name: 'n-Hexane', formula: 'C6H14', mw: 86.18, state: 'Liquid' },
    { cas: '71-36-3', name: 'n-Butanol', formula: 'C4H10O', mw: 74.12, state: 'Liquid' },
    { cas: '78-93-3', name: 'Methyl Ethyl Ketone', formula: 'C4H8O', mw: 72.11, state: 'Liquid' },
    { cas: '109-99-9', name: 'Tetrahydrofuran', formula: 'C4H8O', mw: 72.11, state: 'Liquid' },
    { cas: '141-78-6', name: 'Ethyl Acetate', formula: 'C4H8O2', mw: 88.11, state: 'Liquid' },
    { cas: '67-63-0', name: 'Isopropanol', formula: 'C3H8O', mw: 60.10, state: 'Liquid' },
    { cas: '75-05-8', name: 'Acetonitrile', formula: 'C2H3N', mw: 41.05, state: 'Liquid' },
    { cas: '127-18-4', name: 'Tetrachloroethylene', formula: 'C2Cl4', mw: 165.83, state: 'Liquid' },
    { cas: '79-01-6', name: 'Trichloroethylene', formula: 'C2HCl3', mw: 131.39, state: 'Liquid' },
    { cas: '56-23-5', name: 'Carbon Tetrachloride', formula: 'CCl4', mw: 153.82, state: 'Liquid' },
    { cas: '107-06-2', name: '1,2-Dichloroethane', formula: 'C2H4Cl2', mw: 98.96, state: 'Liquid' },
    { cas: '75-15-0', name: 'Carbon Disulfide', formula: 'CS2', mw: 76.14, state: 'Liquid' },
    { cas: '7664-41-7', name: 'Ammonia Solution', formula: 'NH3', mw: 17.03, state: 'Liquid' },
    { cas: '7647-01-0', name: 'Hydrochloric Acid', formula: 'HCl', mw: 36.46, state: 'Liquid' },
    { cas: '7697-37-2', name: 'Nitric Acid', formula: 'HNO3', mw: 63.01, state: 'Liquid' },
    { cas: '7664-93-9', name: 'Sulfuric Acid', formula: 'H2SO4', mw: 98.08, state: 'Liquid' },
    { cas: '1310-73-2', name: 'Sodium Hydroxide', formula: 'NaOH', mw: 40.00, state: 'Solid' },
    { cas: '7681-52-9', name: 'Sodium Hypochlorite', formula: 'NaClO', mw: 74.44, state: 'Liquid' },
    { cas: '7722-84-1', name: 'Hydrogen Peroxide', formula: 'H2O2', mw: 34.01, state: 'Liquid' },
    { cas: '50-00-0', name: 'Formaldehyde', formula: 'CH2O', mw: 30.03, state: 'Liquid' },
    { cas: '110-82-7', name: 'Cyclohexane', formula: 'C6H12', mw: 84.16, state: 'Liquid' },
    { cas: '142-82-5', name: 'n-Heptane', formula: 'C7H16', mw: 100.20, state: 'Liquid' },
    { cas: '111-65-9', name: 'n-Octane', formula: 'C8H18', mw: 114.23, state: 'Liquid' },
    { cas: '111-84-2', name: 'n-Nonane', formula: 'C9H20', mw: 128.26, state: 'Liquid' },
    { cas: '124-18-5', name: 'n-Decane', formula: 'C10H22', mw: 142.28, state: 'Liquid' },
    { cas: '98-95-3', name: 'Nitrobenzene', formula: 'C6H5NO2', mw: 123.11, state: 'Liquid' },
    { cas: '100-47-0', name: 'Benzonitrile', formula: 'C7H5N', mw: 103.12, state: 'Liquid' },
    { cas: '108-95-2', name: 'Phenol', formula: 'C6H6O', mw: 94.11, state: 'Solid' },
    { cas: '106-44-5', name: 'p-Cresol', formula: 'C7H8O', mw: 108.14, state: 'Solid' },
    { cas: '95-48-7', name: 'o-Cresol', formula: 'C7H8O', mw: 108.14, state: 'Liquid' },
    { cas: '108-39-4', name: 'm-Cresol', formula: 'C7H8O', mw: 108.14, state: 'Liquid' },
    { cas: '121-44-8', name: 'Triethylamine', formula: 'C6H15N', mw: 101.19, state: 'Liquid' },
    { cas: '109-89-7', name: 'Diethylamine', formula: 'C4H11N', mw: 73.14, state: 'Liquid' },
    { cas: '108-91-8', name: 'Cyclohexylamine', formula: 'C6H13N', mw: 99.17, state: 'Liquid' },
    { cas: '62-53-3', name: 'Aniline', formula: 'C6H7N', mw: 93.13, state: 'Liquid' },
    { cas: '123-91-1', name: '1,4-Dioxane', formula: 'C4H8O2', mw: 88.11, state: 'Liquid' },
    { cas: '60-29-7', name: 'Diethyl Ether', formula: 'C4H10O', mw: 74.12, state: 'Liquid' },
    { cas: '109-93-3', name: 'Divinyl Ether', formula: 'C4H6O', mw: 70.09, state: 'Liquid' },
    { cas: '110-86-1', name: 'Pyridine', formula: 'C5H5N', mw: 79.10, state: 'Liquid' },
    { cas: '109-06-8', name: '2-Methylpyridine', formula: 'C6H7N', mw: 93.13, state: 'Liquid' },
    { cas: '872-50-4', name: 'N-Methylpyrrolidone', formula: 'C5H9NO', mw: 99.13, state: 'Liquid' },
    { cas: '110-91-8', name: 'Morpholine', formula: 'C4H9NO', mw: 87.12, state: 'Liquid' },
    { cas: '110-89-4', name: 'Piperidine', formula: 'C5H11N', mw: 85.15, state: 'Liquid' },
    { cas: '123-75-1', name: 'Pyrrolidine', formula: 'C4H9N', mw: 71.12, state: 'Liquid' },
    { cas: '110-02-1', name: 'Thiophene', formula: 'C4H4S', mw: 84.14, state: 'Liquid' },
    { cas: '110-00-9', name: 'Furan', formula: 'C4H4O', mw: 68.07, state: 'Liquid' },
    { cas: '108-46-3', name: 'Resorcinol', formula: 'C6H6O2', mw: 110.11, state: 'Solid' },
    { cas: '123-31-9', name: 'Hydroquinone', formula: 'C6H6O2', mw: 110.11, state: 'Solid' },
    { cas: '120-80-9', name: 'Catechol', formula: 'C6H6O2', mw: 110.11, state: 'Solid' },
    { cas: '98-86-2', name: 'Acetophenone', formula: 'C8H8O', mw: 120.15, state: 'Liquid' },
    { cas: '100-52-7', name: 'Benzaldehyde', formula: 'C7H6O', mw: 106.12, state: 'Liquid' },
    { cas: '65-85-0', name: 'Benzoic Acid', formula: 'C7H6O2', mw: 122.12, state: 'Solid' },
    { cas: '108-90-7', name: 'Chlorobenzene', formula: 'C6H5Cl', mw: 112.56, state: 'Liquid' },
    { cas: '95-50-1', name: '1,2-Dichlorobenzene', formula: 'C6H4Cl2', mw: 147.00, state: 'Liquid' },
    { cas: '106-46-7', name: '1,4-Dichlorobenzene', formula: 'C6H4Cl2', mw: 147.00, state: 'Solid' },
    { cas: '108-86-1', name: 'Bromobenzene', formula: 'C6H5Br', mw: 157.01, state: 'Liquid' },
    { cas: '591-50-4', name: 'Iodobenzene', formula: 'C6H5I', mw: 204.01, state: 'Liquid' },
    { cas: '98-08-8', name: 'Trifluorotoluene', formula: 'C7H5F3', mw: 146.11, state: 'Liquid' },
    { cas: '100-66-3', name: 'Anisole', formula: 'C7H8O', mw: 108.14, state: 'Liquid' },
    { cas: '103-65-1', name: 'Propylbenzene', formula: 'C9H12', mw: 120.19, state: 'Liquid' },
    { cas: '98-82-8', name: 'Isopropylbenzene', formula: 'C9H12', mw: 120.19, state: 'Liquid' },
    { cas: '104-51-8', name: 'n-Butylbenzene', formula: 'C10H14', mw: 134.22, state: 'Liquid' },
    { cas: '98-06-6', name: 'tert-Butylbenzene', formula: 'C10H14', mw: 134.22, state: 'Liquid' },
    { cas: '91-20-3', name: 'Naphthalene', formula: 'C10H8', mw: 128.17, state: 'Solid' },
    { cas: '83-32-9', name: 'Acenaphthene', formula: 'C12H10', mw: 154.21, state: 'Solid' },
    { cas: '86-73-7', name: 'Fluorene', formula: 'C13H10', mw: 166.22, state: 'Solid' },
    { cas: '85-01-8', name: 'Phenanthrene', formula: 'C14H10', mw: 178.23, state: 'Solid' },
    { cas: '120-12-7', name: 'Anthracene', formula: 'C14H10', mw: 178.23, state: 'Solid' },
    { cas: '129-00-0', name: 'Pyrene', formula: 'C16H10', mw: 202.25, state: 'Solid' },
    { cas: '50-32-8', name: 'Benzo[a]pyrene', formula: 'C20H12', mw: 252.31, state: 'Solid' },
    { cas: '74-82-8', name: 'Methane', formula: 'CH4', mw: 16.04, state: 'Gas' },
    { cas: '74-84-0', name: 'Ethane', formula: 'C2H6', mw: 30.07, state: 'Gas' },
    { cas: '74-98-6', name: 'Propane', formula: 'C3H8', mw: 44.10, state: 'Gas' },
    { cas: '106-97-8', name: 'Butane', formula: 'C4H10', mw: 58.12, state: 'Gas' },
    { cas: '109-66-0', name: 'Pentane', formula: 'C5H12', mw: 72.15, state: 'Liquid' },
    { cas: '78-78-4', name: 'Isopentane', formula: 'C5H12', mw: 72.15, state: 'Liquid' },
    { cas: '463-82-1', name: 'Neopentane', formula: 'C5H12', mw: 72.15, state: 'Gas' },
    { cas: '107-83-5', name: '2-Methylpentane', formula: 'C6H14', mw: 86.18, state: 'Liquid' },
    { cas: '96-14-0', name: '3-Methylpentane', formula: 'C6H14', mw: 86.18, state: 'Liquid' },
    { cas: '79-29-8', name: '2,3-Dimethylbutane', formula: 'C6H14', mw: 86.18, state: 'Liquid' },
    { cas: '592-27-8', name: '2-Methylheptane', formula: 'C8H18', mw: 114.23, state: 'Liquid' },
    { cas: '589-34-4', name: '3-Methylheptane', formula: 'C8H18', mw: 114.23, state: 'Liquid' },
    { cas: '111-66-0', name: '1-Octene', formula: 'C8H16', mw: 112.21, state: 'Liquid' },
    { cas: '112-40-3', name: 'Dodecane', formula: 'C12H26', mw: 170.33, state: 'Liquid' },
    { cas: '629-50-5', name: 'Tridecane', formula: 'C13H28', mw: 184.36, state: 'Liquid' },
    { cas: '629-59-4', name: 'Tetradecane', formula: 'C14H30', mw: 198.39, state: 'Liquid' },
    { cas: '544-76-3', name: 'Hexadecane', formula: 'C16H34', mw: 226.44, state: 'Solid' },
    { cas: '593-45-3', name: 'Octadecane', formula: 'C18H38', mw: 254.49, state: 'Solid' },
    { cas: '112-95-8', name: 'Eicosane', formula: 'C20H42', mw: 282.55, state: 'Solid' },
    { cas: '74-85-1', name: 'Ethylene', formula: 'C2H4', mw: 28.05, state: 'Gas' },
    { cas: '115-07-1', name: 'Propylene', formula: 'C3H6', mw: 42.08, state: 'Gas' },
    { cas: '106-98-9', name: '1-Butene', formula: 'C4H8', mw: 56.11, state: 'Gas' },
    { cas: '74-86-2', name: 'Acetylene', formula: 'C2H2', mw: 26.04, state: 'Gas' }
  ];

  casData.push(...commonChemicals);

  // Generate additional synthetic compounds (900 more entries)
  const prefixes = ['Methyl', 'Ethyl', 'Propyl', 'Butyl', 'Pentyl', 'Hexyl', 'Heptyl', 'Octyl', 'Nonyl', 'Decyl'];
  const suffixes = ['benzene', 'aniline', 'phenol', 'pyridine', 'furan', 'thiophene', 'benzaldehyde', 'benzoate', 'acetate', 'propionate'];
  const modifiers = ['chloro', 'bromo', 'fluoro', 'nitro', 'amino', 'hydroxy', 'methoxy', 'ethoxy', 'cyano', 'sulfo'];
  const positions = ['2', '3', '4', '2,3', '2,4', '2,5', '2,6', '3,4', '3,5'];

  let counter = 0;
  while (casData.length < 1000) {
    counter++;
    const prefix = prefixes[counter % prefixes.length];
    const suffix = suffixes[Math.floor(counter / prefixes.length) % suffixes.length];
    const modifier = counter % 3 === 0 ? modifiers[counter % modifiers.length] + '-' : '';
    const position = counter % 5 === 0 ? positions[counter % positions.length] + '-' : '';

    const name = `${position}${modifier}${prefix}${suffix}`;
    const carbonCount = 6 + (counter % 15);
    const hydrogenCount = carbonCount * 2 + 2 - (counter % 5);
    const oxygenCount = counter % 4;
    const nitrogenCount = suffix.includes('amine') || suffix.includes('pyridine') ? 1 : 0;

    let formula = `C${carbonCount}H${hydrogenCount}`;
    if (nitrogenCount > 0) formula += `N${nitrogenCount}`;
    if (oxygenCount > 0) formula += `O${oxygenCount}`;

    const mw = carbonCount * 12 + hydrogenCount * 1 + nitrogenCount * 14 + oxygenCount * 16;
    const state = mw < 80 ? 'Liquid' : (mw > 200 ? 'Solid' : (Math.random() > 0.5 ? 'Liquid' : 'Solid'));

    // Generate a plausible CAS number format
    const part1 = (100000 + counter * 17) % 9999999;
    const part2 = (counter * 3) % 99;
    const part3 = (counter * 7) % 9;
    const cas = `${part1}-${String(part2).padStart(2, '0')}-${part3}`;

    casData.push({ cas, name, formula, mw, state });
  }

  return casData;
};

const casDatabase = generateCASDatabase();
const casNumbers = casDatabase.map(item => item.cas);
const chemicalData = casDatabase.reduce((acc, item) => {
  acc[item.cas] = item;
  return acc;
}, {});


const users = [
  { email: 'john.smith@milliporesigma.com', firstName: 'John', lastName: 'Smith', role: 'PRODUCT_MANAGER' },
  { email: 'sarah.johnson@milliporesigma.com', firstName: 'Sarah', lastName: 'Johnson', role: 'PM_OPS' },
  { email: 'mike.wilson@milliporesigma.com', firstName: 'Mike', lastName: 'Wilson', role: 'ADMIN' },
  { email: 'emily.chen@milliporesigma.com', firstName: 'Emily', lastName: 'Chen', role: 'PRODUCT_MANAGER' },
  { email: 'david.kumar@milliporesigma.com', firstName: 'David', lastName: 'Kumar', role: 'PM_OPS' },
  { email: 'lisa.martinez@milliporesigma.com', firstName: 'Lisa', lastName: 'Martinez', role: 'PRODUCT_MANAGER' },
  { email: 'james.taylor@milliporesigma.com', firstName: 'James', lastName: 'Taylor', role: 'ADMIN' },
  { email: 'anna.wong@milliporesigma.com', firstName: 'Anna', lastName: 'Wong', role: 'PRODUCT_MANAGER' }
];

const statuses = ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const sbus = ['775', 'P90', '440', 'P87', 'P89', 'P85'];
const brands = ['Sigma-Aldrich', 'SAFC', 'Supelco', 'Millipore', 'Merck'];
const physicalStates = ['Solid', 'Liquid', 'Gas', 'Powder', 'Crystal'];
const productLines = ['Chemical Products', 'Reagents', 'Standards', 'Specialty Chemicals', 'Research Biochemicals'];

// Helper function to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random date within last 90 days
const randomDateWithinDays = (daysAgo) => {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return date;
};

// Generate realistic comments spread across ticket lifecycle
const generateComments = (createdBy, createdAt, updatedAt) => {
  const commentTemplates = [
    'Initial ticket created for new product introduction',
    'PubChem data has been populated automatically',
    'Pricing calculations completed based on raw material costs',
    'Quality attributes verified with QC team',
    'SKU variants generated for standard package sizes',
    'Regulatory documentation review in progress',
    'Updated hazard classification based on GHS standards',
    'Chemical properties validated against PubChem database',
    'Vendor information has been updated',
    'Quality team has approved the specifications',
    'Manufacturing plant confirmed capacity',
    'Marketing team reviewed product description',
    'Compliance check completed successfully',
    'Launch timeline looks feasible',
    'All stakeholders have been notified'
  ];

  const totalDuration = updatedAt.getTime() - createdAt.getTime();
  const numComments = Math.floor(Math.random() * 5) + 2; // 2-6 comments
  const comments = [];

  for (let i = 0; i < numComments; i++) {
    // Spread comments evenly across the ticket's lifetime
    const progress = (i + 1) / (numComments + 1); // Avoid starting at 0% or ending at 100%
    const commentTime = createdAt.getTime() + (totalDuration * progress);
    const commentDate = new Date(commentTime);

    const user = randomElement(users);
    comments.push({
      user: user.email,
      content: randomElement(commentTemplates),
      timestamp: commentDate,
      userInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  }

  // Sort comments by timestamp
  return comments.sort((a, b) => a.timestamp - b.timestamp);
};

// Generate SKU variants
const generateSKUVariants = (productName, casNumber) => {
  const variants = [
    { type: 'BULK', size: 1, unit: 'kg' },
    { type: 'CONF', size: 100, unit: 'g' },
    { type: 'CONF', size: 500, unit: 'g' },
    { type: 'SPEC', size: 25, unit: 'g' },
    { type: 'SPEC', size: 100, unit: 'mL' }
  ];

  return variants.map((v, idx) => ({
    type: v.type,
    sku: `${casNumber.replace(/-/g, '')}-${v.size}${v.unit.toUpperCase()}`,
    description: `${productName} - ${v.size}${v.unit}`,
    packageSize: {
      value: v.size,
      unit: v.unit
    },
    pricing: {
      standardCost: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      calculatedCost: parseFloat((Math.random() * 100 + 50).toFixed(2)),
      margin: 50 + Math.floor(Math.random() * 20),
      limitPrice: parseFloat((Math.random() * 150 + 100).toFixed(2)),
      listPrice: parseFloat((Math.random() * 200 + 150).toFixed(2)),
      currency: 'USD'
    },
    inventory: {
      minimumStock: Math.floor(Math.random() * 50) + 10,
      leadTime: Math.floor(Math.random() * 30) + 7,
      supplier: randomElement(['Internal', 'Vendor A', 'Vendor B'])
    },
    createdBy: randomElement(users).email,
    assignedAt: new Date()
  }));
};

// Generate quality attributes
const generateQualityAttributes = () => {
  const attributes = [
    { testAttribute: 'Purity', valueRange: '≥98%', dataSource: 'QC' },
    { testAttribute: 'Water Content', valueRange: '≤0.5%', dataSource: 'QC' },
    { testAttribute: 'Residue on Ignition', valueRange: '≤0.05%', dataSource: 'QC' },
    { testAttribute: 'Heavy Metals', valueRange: '≤10 ppm', dataSource: 'Vendor' },
    { testAttribute: 'pH (5% solution)', valueRange: '6.5-7.5', dataSource: 'QC' }
  ];

  const numAttributes = Math.floor(Math.random() * 3) + 2; // 2-4 attributes
  return attributes.slice(0, numAttributes).map(attr => ({
    ...attr,
    comments: 'Verified by quality control',
    createdAt: new Date()
  }));
};

// Generate composition components
const generateComposition = () => {
  const numComponents = Math.floor(Math.random() * 3) + 1; // 1-3 components
  const components = [];
  let remainingPercent = 100;

  for (let i = 0; i < numComponents; i++) {
    const isLast = i === numComponents - 1;
    const percent = isLast ? remainingPercent : Math.floor(Math.random() * (remainingPercent - 10)) + 10;
    remainingPercent -= percent;

    components.push({
      proprietary: Math.random() > 0.7,
      componentCAS: randomElement(casNumbers),
      weightPercent: percent,
      componentName: `Component ${i + 1}`,
      componentFormula: 'C' + Math.floor(Math.random() * 20 + 1) + 'H' + Math.floor(Math.random() * 40 + 1),
      createdAt: new Date()
    });
  }

  return { components };
};

// Generate status history with realistic time progression
const generateStatusHistory = (createdAt, createdBy, finalStatus) => {
  const history = [];
  let currentDate = new Date(createdAt);

  // Always start with DRAFT/creation
  history.push({
    status: 'DRAFT',
    changedBy: createdBy,
    changedAt: currentDate,
    reason: 'Ticket created',
    action: 'TICKET_CREATED',
    userInfo: {
      firstName: users.find(u => u.email === createdBy)?.firstName || 'System',
      lastName: users.find(u => u.email === createdBy)?.lastName || 'User',
      role: users.find(u => u.email === createdBy)?.role || 'PRODUCT_MANAGER'
    }
  });

  // Define status progression and time ranges
  const statusProgression = {
    'DRAFT': { next: 'SUBMITTED', minDays: 1, maxDays: 7, reason: 'Ticket submitted for review' },
    'SUBMITTED': { next: 'IN_PROCESS', minDays: 2, maxDays: 14, reason: 'Started processing ticket' },
    'IN_PROCESS': { next: 'NPDI_INITIATED', minDays: 5, maxDays: 30, reason: 'NPDI process initiated' },
    'NPDI_INITIATED': { next: 'COMPLETED', minDays: 10, maxDays: 45, reason: 'Product development completed' }
  };

  let currentStatus = 'DRAFT';

  // Progress through statuses until we reach the final status
  while (currentStatus !== finalStatus && statusProgression[currentStatus]) {
    const progression = statusProgression[currentStatus];
    const nextStatus = progression.next;

    // Add random days for this transition
    const daysToAdd = Math.floor(Math.random() * (progression.maxDays - progression.minDays + 1)) + progression.minDays;
    currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const changedByUser = randomElement(users);
    history.push({
      status: nextStatus,
      changedBy: changedByUser.email,
      changedAt: currentDate,
      reason: progression.reason,
      action: 'STATUS_CHANGE',
      userInfo: {
        firstName: changedByUser.firstName,
        lastName: changedByUser.lastName,
        role: changedByUser.role
      }
    });

    currentStatus = nextStatus;

    // Stop if we've reached the final status
    if (currentStatus === finalStatus) break;
  }

  return history;
};

// Generate a realistic product ticket
const generateTicket = (casNumber) => {
  const chemInfo = chemicalData[casNumber];
  const productName = chemInfo.name;
  const createdAt = randomDateWithinDays(90);
  const createdByUser = randomElement(users);
  const status = randomElement(statuses);
  const assignedToUser = status !== 'DRAFT' ? randomElement(users) : null;

  // Generate status history based on final status
  const statusHistory = generateStatusHistory(createdAt, createdByUser.email, status);

  // Get the most recent date from status history for updatedAt
  const lastStatusChange = statusHistory[statusHistory.length - 1];
  const updatedAt = lastStatusChange.changedAt;

  return {
    productName: productName,
    productLine: randomElement(productLines),
    productionType: Math.random() > 0.3 ? 'Produced' : 'Procured',
    sbu: randomElement(sbus),
    primaryPlant: randomElement(['St. Louis, MO', 'Milwaukee, WI', 'Darmstadt, Germany', 'Shanghai, China', 'Bangalore, India']),
    productScope: {
      scope: randomElement(['Worldwide', 'North America', 'Europe', 'Asia']),
      otherSpecification: ''
    },
    distributionType: randomElement(['Standard', 'Purchase on Demand', 'Dock-to-Stock']),
    retestOrExpiration: {
      type: randomElement(['None', 'Retest', 'Expiration']),
      shelfLife: {
        value: Math.floor(Math.random() * 36) + 12,
        unit: 'months'
      }
    },
    brand: randomElement(brands),
    status: status,
    priority: randomElement(priorities),
    createdBy: createdByUser.email,
    assignedTo: assignedToUser ? assignedToUser.email : null,

    // Chemical Properties
    chemicalProperties: {
      casNumber: casNumber,
      molecularFormula: chemInfo.formula,
      molecularWeight: chemInfo.mw,
      iupacName: `IUPAC name for ${productName}`,
      canonicalSMILES: 'CC(C)O',
      physicalState: chemInfo.state,
      materialSource: randomElement(['Synthetic', 'Fermentation', 'Recombinant', 'Plant']),
      animalComponent: randomElement(['Animal Component Free', 'Animal Component Containing']),
      storageTemperature: randomElement(['CL (2-8 deg)', 'F0 (-20 C)', 'RT (Ambient)']),
      shippingConditions: randomElement(['Standard', 'Wet Ice', 'Dry Ice']),
      autoPopulated: true,
      pubchemData: {
        lastUpdated: createdAt
      }
    },

    // Hazard Classification
    hazardClassification: {
      ghsClass: randomElement(['H200-H299', 'H300-H399', 'H400-H499']),
      hazardStatements: ['H225 - Highly flammable liquid and vapor', 'H319 - Causes serious eye irritation'],
      precautionaryStatements: ['P210 - Keep away from heat/sparks/open flames', 'P280 - Wear protective gloves/eye protection'],
      signalWord: randomElement(['WARNING', 'DANGER']),
      transportClass: '3',
      unNumber: 'UN' + Math.floor(Math.random() * 3000 + 1000),
      pubchemGHS: {
        autoImported: true,
        lastUpdated: createdAt
      }
    },

    // Quality
    quality: {
      mqQualityLevel: randomElement(['MQ100', 'MQ200', 'MQ300', 'MQ400']),
      attributes: generateQualityAttributes()
    },

    // Composition
    composition: generateComposition(),

    // SKU Variants
    skuVariants: generateSKUVariants(productName, casNumber),

    // Regulatory Info
    regulatoryInfo: {
      tsca: Math.random() > 0.3,
      rohsCompliant: Math.random() > 0.5,
      fdaStatus: randomElement(['Listed', 'Not Listed', 'Pending']),
      reachRegistration: Math.random() > 0.5 ? 'REACH-' + Math.floor(Math.random() * 10000) : null
    },

    // Pricing Data
    pricingData: {
      baseUnit: randomElement(['g', 'kg', 'mL', 'L']),
      standardCosts: {
        rawMaterialCostPerUnit: parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
        packagingCost: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        laborOverheadCost: parseFloat((Math.random() * 15 + 3).toFixed(2))
      },
      targetMargin: 50 + Math.floor(Math.random() * 30),
      calculatedAt: createdAt
    },

    // CorpBase Data
    corpbaseData: {
      productDescription: `High-quality ${productName} suitable for research and industrial applications. This product meets stringent quality standards and is backed by comprehensive analytical data.`,
      websiteTitle: `${productName} | High Purity Chemical | Research Grade`,
      metaDescription: `Premium ${productName} for laboratory and research use. Available in multiple package sizes with fast shipping.`,
      keyFeatures: [
        'High purity grade',
        'Comprehensive analytical data provided',
        'Multiple package sizes available',
        'Fast shipping and reliable supply'
      ],
      applications: [
        'Chemical synthesis',
        'Research and development',
        'Analytical chemistry',
        'Quality control testing'
      ],
      targetIndustries: 'Pharmaceutical, Biotechnology, Academic Research',
      aiGenerated: false
    },

    // Part Number
    partNumber: {
      baseNumber: 'PN-' + Math.floor(Math.random() * 900000 + 100000),
      assignedBy: randomElement(users).email,
      assignedAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days after creation
    },

    // Business Justification
    businessJustification: {
      marketAnalysis: `Growing demand for ${productName} in pharmaceutical and research markets.`,
      competitiveAnalysis: 'Limited suppliers in the market with consistent quality.',
      salesForecast: {
        year1: Math.floor(Math.random() * 500000 + 100000),
        year2: Math.floor(Math.random() * 750000 + 200000),
        year3: Math.floor(Math.random() * 1000000 + 300000)
      },
      roi: parseFloat((Math.random() * 50 + 20).toFixed(1))
    },

    // Launch Timeline (based on actual status progression)
    launchTimeline: {
      targetLaunchDate: new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from creation
      milestones: [
        {
          name: 'Product Development Complete',
          dueDate: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
          completed: ['IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED'].includes(status),
          completedDate: ['IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED'].includes(status)
            ? statusHistory.find(h => h.status === 'IN_PROCESS')?.changedAt
            : null,
          notes: 'Development phase completed'
        },
        {
          name: 'Regulatory Approval',
          dueDate: new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000),
          completed: ['NPDI_INITIATED', 'COMPLETED'].includes(status),
          completedDate: ['NPDI_INITIATED', 'COMPLETED'].includes(status)
            ? statusHistory.find(h => h.status === 'NPDI_INITIATED')?.changedAt
            : null,
          notes: 'All regulatory requirements met'
        },
        {
          name: 'Market Launch',
          dueDate: new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000),
          completed: status === 'COMPLETED',
          completedDate: status === 'COMPLETED'
            ? statusHistory.find(h => h.status === 'COMPLETED')?.changedAt
            : null,
          notes: 'Product launched to market'
        }
      ]
    },

    // Status History (use generated history instead of letting pre-save hook create it)
    statusHistory: statusHistory,

    // Comments (spread across the ticket lifecycle)
    comments: generateComments(createdByUser.email, createdAt, updatedAt),

    // Timestamps
    createdAt: createdAt,
    updatedAt: updatedAt
  };
};

// Main seeding function
const seedTickets = async () => {
  try {
    await connectDB();

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('Starting ticket generation...');
    console.log(`Available CAS numbers: ${casNumbers.length}\n`);

    // Check if tickets already exist
    const existingCount = await ProductTicket.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing tickets.`);
      readline.question('Do you want to delete existing tickets and reseed? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await ProductTicket.deleteMany({});
          console.log('Existing tickets deleted.\n');
          askForNumber(readline);
        } else {
          console.log('Seeding cancelled.');
          readline.close();
          process.exit(0);
        }
      });
    } else {
      askForNumber(readline);
    }
  } catch (error) {
    console.error('Error seeding tickets:', error);
    process.exit(1);
  }
};

const askForNumber = (readline) => {
  readline.question('How many tickets would you like to generate? ', async (answer) => {
    const numTickets = parseInt(answer);
    if (isNaN(numTickets) || numTickets < 1) {
      console.log('Please enter a valid number greater than 0.');
      askForNumber(readline);
    } else {
      readline.close();
      await generateAndSaveTickets(numTickets);
    }
  });
};

const generateAndSaveTickets = async (numTickets) => {
  console.log(`\nGenerating ${numTickets} product tickets...\n`);

  // Shuffle CAS numbers to get random selection
  const shuffledCAS = [...casNumbers].sort(() => Math.random() - 0.5);

  const tickets = [];
  for (let i = 0; i < numTickets; i++) {
    // Randomly select from available CAS numbers (cycle if more tickets than CAS numbers)
    const casIndex = i % shuffledCAS.length;
    const casNumber = shuffledCAS[casIndex];
    const ticket = generateTicket(casNumber);
    tickets.push(ticket);
  }

  // Save all tickets with proper ticket numbers
  console.log('Saving tickets to database...');
  const year = new Date().getFullYear();
  const existingCount = await ProductTicket.countDocuments();

  // Add ticket numbers to each ticket before saving
  tickets.forEach((ticket, index) => {
    ticket.ticketNumber = `NPDI-${year}-${String(existingCount + index + 1).padStart(4, '0')}`;
  });

  const savedTickets = await ProductTicket.insertMany(tickets, { ordered: false });

  console.log(`\n✓ Successfully created ${savedTickets.length} product tickets!`);
  console.log('\nSummary:');
  console.log(`  - Total Tickets: ${savedTickets.length}`);

  // Count by status
  const statusCounts = {};
  savedTickets.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  console.log('\nTickets by Status:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });

  // Count by priority
  const priorityCounts = {};
  savedTickets.forEach(t => {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });

  console.log('\nTickets by Priority:');
  Object.entries(priorityCounts).forEach(([priority, count]) => {
    console.log(`  - ${priority}: ${count}`);
  });

  // Count by SBU
  const sbuCounts = {};
  savedTickets.forEach(t => {
    sbuCounts[t.sbu] = (sbuCounts[t.sbu] || 0) + 1;
  });

  console.log('\nTickets by SBU:');
  Object.entries(sbuCounts).forEach(([sbu, count]) => {
    console.log(`  - ${sbu}: ${count}`);
  });

  // Count by created by
  const createdByCounts = {};
  savedTickets.forEach(t => {
    createdByCounts[t.createdBy] = (createdByCounts[t.createdBy] || 0) + 1;
  });

  console.log('\nTickets by Creator:');
  Object.entries(createdByCounts).forEach(([email, count]) => {
    const user = users.find(u => u.email === email);
    const name = user ? `${user.firstName} ${user.lastName}` : email;
    console.log(`  - ${name}: ${count}`);
  });

  console.log('\nDate Range:');
  const dates = savedTickets.map(t => t.createdAt).sort((a, b) => a - b);
  console.log(`  - Earliest: ${dates[0].toLocaleDateString()}`);
  console.log(`  - Latest: ${dates[dates.length - 1].toLocaleDateString()}`);

  console.log('\nSample Ticket Numbers:');
  savedTickets.slice(0, Math.min(10, savedTickets.length)).forEach(t => {
    console.log(`  - ${t.ticketNumber}: ${t.productName} (${t.chemicalProperties.casNumber}) - ${t.status} - ${t.priority}`);
  });

  // Calculate average processing times for metrics
  console.log('\n📊 Processing Time Metrics:');

  const completedTickets = savedTickets.filter(t => t.status === 'COMPLETED');
  if (completedTickets.length > 0) {
    const processingTimes = completedTickets.map(t => {
      const created = new Date(t.createdAt);
      const completed = new Date(t.statusHistory[t.statusHistory.length - 1].changedAt);
      return (completed - created) / (1000 * 60 * 60 * 24); // Convert to days
    });

    const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const minTime = Math.min(...processingTimes);
    const maxTime = Math.max(...processingTimes);

    console.log(`  - Completed Tickets: ${completedTickets.length}`);
    console.log(`  - Average Processing Time: ${avgProcessingTime.toFixed(1)} days`);
    console.log(`  - Min Processing Time: ${minTime.toFixed(1)} days`);
    console.log(`  - Max Processing Time: ${maxTime.toFixed(1)} days`);
  }

  // Calculate status transition times
  const submittedToProcessing = [];
  const processingToInitiated = [];
  const initiatedToCompleted = [];

  savedTickets.forEach(t => {
    const history = t.statusHistory;

    const submitted = history.find(h => h.status === 'SUBMITTED');
    const inProcess = history.find(h => h.status === 'IN_PROCESS');
    const initiated = history.find(h => h.status === 'NPDI_INITIATED');
    const completed = history.find(h => h.status === 'COMPLETED');

    if (submitted && inProcess) {
      const days = (new Date(inProcess.changedAt) - new Date(submitted.changedAt)) / (1000 * 60 * 60 * 24);
      submittedToProcessing.push(days);
    }

    if (inProcess && initiated) {
      const days = (new Date(initiated.changedAt) - new Date(inProcess.changedAt)) / (1000 * 60 * 60 * 24);
      processingToInitiated.push(days);
    }

    if (initiated && completed) {
      const days = (new Date(completed.changedAt) - new Date(initiated.changedAt)) / (1000 * 60 * 60 * 24);
      initiatedToCompleted.push(days);
    }
  });

  if (submittedToProcessing.length > 0) {
    const avg = submittedToProcessing.reduce((a, b) => a + b, 0) / submittedToProcessing.length;
    console.log(`\n  - Avg SUBMITTED → IN_PROCESS: ${avg.toFixed(1)} days (${submittedToProcessing.length} tickets)`);
  }

  if (processingToInitiated.length > 0) {
    const avg = processingToInitiated.reduce((a, b) => a + b, 0) / processingToInitiated.length;
    console.log(`  - Avg IN_PROCESS → NPDI_INITIATED: ${avg.toFixed(1)} days (${processingToInitiated.length} tickets)`);
  }

  if (initiatedToCompleted.length > 0) {
    const avg = initiatedToCompleted.reduce((a, b) => a + b, 0) / initiatedToCompleted.length;
    console.log(`  - Avg NPDI_INITIATED → COMPLETED: ${avg.toFixed(1)} days (${initiatedToCompleted.length} tickets)`);
  }

  console.log('\n✅ Ready for PM Ops Performance Dashboard!\n');

  process.exit(0);
};

// Run the seeding
seedTickets();
