/**
 * Seed Parser Configuration
 * Migrates hard-coded knowledge tables from qualitySpecParser.js to MongoDB
 *
 * Run with: node server/scripts/seedParserConfig.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const ParserConfiguration = require('../models/ParserConfiguration');

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-portal';
    await mongoose.connect(mongoURI);
    console.log('✓ MongoDB Connected');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test Attribute Normalization Data
const testAttributeData = [
  // Common tests
  { key: 'purity', value: 'Purity', category: 'chemical' },
  { key: 'assay', value: 'Assay', category: 'chemical' },
  { key: 'identity', value: 'Identity', category: 'chemical' },
  { key: 'appearance', value: 'Appearance', category: 'physical' },
  { key: 'color', value: 'Color', category: 'physical' },
  { key: 'colour', value: 'Colour', category: 'physical' },
  { key: 'odor', value: 'Odor', category: 'physical' },
  { key: 'odour', value: 'Odour', category: 'physical' },
  { key: 'solubility', value: 'Solubility', category: 'physical' },
  { key: 'ph', value: 'pH', category: 'chemical' },

  // Water/Moisture
  { key: 'water', value: 'Water', category: 'chemical' },
  { key: 'water content', value: 'Water Content', category: 'chemical' },
  { key: 'moisture', value: 'Moisture', category: 'chemical' },
  { key: 'moisture content', value: 'Moisture Content', category: 'chemical' },
  { key: 'h2o', value: 'H₂O', category: 'chemical' },

  // Structure
  { key: 'structure', value: 'Structure', category: 'chemical' },
  { key: 'structure conformity', value: 'Structure Conformity', category: 'chemical' },
  { key: 'structural confirmation', value: 'Structural Confirmation', category: 'chemical' },

  // Impurities
  { key: 'related substances', value: 'Related Substances', category: 'chemical' },
  { key: 'impurities', value: 'Impurities', category: 'chemical' },
  { key: 'residual solvents', value: 'Residual Solvents', category: 'chemical' },
  { key: 'heavy metals', value: 'Heavy Metals', category: 'chemical' },
  { key: 'trace metals', value: 'Trace Metals', category: 'chemical' },
  { key: 'elemental impurities', value: 'Elemental Impurities', category: 'chemical' },

  // Physical Properties
  { key: 'melting point', value: 'Melting Point', category: 'physical' },
  { key: 'mp', value: 'MP', category: 'physical' },
  { key: 'boiling point', value: 'Boiling Point', category: 'physical' },
  { key: 'bp', value: 'BP', category: 'physical' },
  { key: 'particle size', value: 'Particle Size', category: 'physical' },
  { key: 'particle size distribution', value: 'Particle Size Distribution', category: 'physical' },
  { key: 'loss on drying', value: 'Loss on Drying', category: 'physical' },
  { key: 'lod', value: 'LOD', category: 'physical' },
  { key: 'viscosity', value: 'Viscosity', category: 'physical' },
  { key: 'density', value: 'Density', category: 'physical' },
  { key: 'specific gravity', value: 'Specific Gravity', category: 'physical' },
  { key: 'refractive index', value: 'Refractive Index', category: 'physical' },
  { key: 'optical rotation', value: 'Optical Rotation', category: 'physical' },
  { key: 'specific rotation', value: 'Specific Rotation', category: 'physical' },
  { key: 'crystallinity', value: 'Crystallinity', category: 'physical' },
  { key: 'polymorphic form', value: 'Polymorphic Form', category: 'physical' },
  { key: 'surface area', value: 'Surface Area', category: 'physical' },
  { key: 'bulk density', value: 'Bulk Density', category: 'physical' },
  { key: 'tapped density', value: 'Tapped Density', category: 'physical' },
  { key: 'true density', value: 'True Density', category: 'physical' },

  // Thermal Properties
  { key: 'glass transition', value: 'Glass Transition', category: 'thermal' },
  { key: 'tg', value: 'Tg', category: 'thermal' },
  { key: 'decomposition temperature', value: 'Decomposition Temperature', category: 'thermal' },

  // Dissolution & Release
  { key: 'dissolution', value: 'Dissolution', category: 'physical' },
  { key: 'dissolution rate', value: 'Dissolution Rate', category: 'physical' },
  { key: 'disintegration', value: 'Disintegration', category: 'physical' },
  { key: 'disintegration time', value: 'Disintegration Time', category: 'physical' },
  { key: 'drug release', value: 'Drug Release', category: 'physical' },
  { key: 'release rate', value: 'Release Rate', category: 'physical' },

  // Electrical Properties
  { key: 'conductivity', value: 'Conductivity', category: 'physical' },
  { key: 'resistivity', value: 'Resistivity', category: 'physical' },

  // Microbiological Tests
  { key: 'bioburden', value: 'Bioburden', category: 'microbiological' },
  { key: 'sterility', value: 'Sterility', category: 'microbiological' },
  { key: 'microbial limits', value: 'Microbial Limits', category: 'microbiological' },
  { key: 'total aerobic count', value: 'Total Aerobic Count', category: 'microbiological' },
  { key: 'tamc', value: 'TAMC', category: 'microbiological' },
  { key: 'total yeast mold count', value: 'Total Yeast Mold Count', category: 'microbiological' },
  { key: 'tymc', value: 'TYMC', category: 'microbiological' },
  { key: 'total viable count', value: 'Total Viable Count', category: 'microbiological' },
  { key: 'endotoxin', value: 'Endotoxin', category: 'microbiological' },
  { key: 'bacterial endotoxin', value: 'Bacterial Endotoxin', category: 'microbiological' },
  { key: 'pyrogen', value: 'Pyrogen', category: 'microbiological' },
  { key: 'mycoplasma', value: 'Mycoplasma', category: 'microbiological' },
  { key: 'specified microorganisms', value: 'Specified Microorganisms', category: 'microbiological' },

  // Biological Tests
  { key: 'potency', value: 'Potency', category: 'biological' },
  { key: 'biological activity', value: 'Biological Activity', category: 'biological' },
  { key: 'cell viability', value: 'Cell Viability', category: 'biological' },
  { key: 'viability', value: 'Viability', category: 'biological' },
  { key: 'viral safety', value: 'Viral Safety', category: 'biological' },
  { key: 'viral clearance', value: 'Viral Clearance', category: 'biological' },
  { key: 'adventitious agents', value: 'Adventitious Agents', category: 'biological' },
  { key: 'host cell proteins', value: 'Host Cell Proteins', category: 'biological' },
  { key: 'hcp', value: 'HCP', category: 'biological' },
  { key: 'host cell dna', value: 'Host Cell DNA', category: 'biological' },
  { key: 'residual dna', value: 'Residual DNA', category: 'biological' },
  { key: 'protein content', value: 'Protein Content', category: 'biological' },
  { key: 'protein a', value: 'Protein A', category: 'biological' },

  // Chromatographic Purity
  { key: 'single impurity', value: 'Single Impurity', category: 'chemical' },
  { key: 'total impurities', value: 'Total Impurities', category: 'chemical' },
  { key: 'chromatographic purity', value: 'Chromatographic Purity', category: 'chemical' },
  { key: 'enantiomeric purity', value: 'Enantiomeric Purity', category: 'chemical' },
  { key: 'optical purity', value: 'Optical Purity', category: 'chemical' },
  { key: 'chiral purity', value: 'Chiral Purity', category: 'chemical' }
];

// Test Method Normalization Data (partial - add all 150+ from your file)
const testMethodData = [
  // Chromatography
  { key: 'gc', value: 'GC', category: 'chromatography' },
  { key: 'hplc', value: 'HPLC', category: 'chromatography' },
  { key: 'tlc', value: 'TLC', category: 'chromatography' },
  { key: 'gc-ms', value: 'GC-MS', category: 'chromatography' },
  { key: 'lc-ms', value: 'LC-MS', category: 'chromatography' },
  { key: 'uplc', value: 'UPLC', category: 'chromatography' },
  { key: 'uhplc', value: 'UHPLC', category: 'chromatography' },
  { key: 'hplc-uv', value: 'HPLC-UV', category: 'chromatography' },
  { key: 'hplc-dad', value: 'HPLC-DAD', category: 'chromatography' },
  { key: 'hplc-ms', value: 'HPLC-MS', category: 'chromatography' },
  { key: 'lc-ms/ms', value: 'LC-MS/MS', category: 'chromatography' },
  { key: 'gc-fid', value: 'GC-FID', category: 'chromatography' },
  { key: 'gc-tcd', value: 'GC-TCD', category: 'chromatography' },
  { key: 'hptlc', value: 'HPTLC', category: 'chromatography' },
  { key: 'sfc', value: 'SFC', category: 'chromatography' },

  // Spectroscopy - NMR
  { key: 'nmr', value: 'NMR', category: 'spectroscopy' },
  { key: '1h nmr', value: '1H NMR', category: 'spectroscopy' },
  { key: '1hnmr', value: '1H NMR', category: 'spectroscopy' },
  { key: '13c nmr', value: '13C NMR', category: 'spectroscopy' },
  { key: '13cnmr', value: '13C NMR', category: 'spectroscopy' },
  { key: '31p nmr', value: '31P NMR', category: 'spectroscopy' },
  { key: '19f nmr', value: '19F NMR', category: 'spectroscopy' },
  { key: '2d nmr', value: '2D NMR', category: 'spectroscopy' },

  // Spectroscopy - IR/UV/Vis
  { key: 'ir', value: 'IR', category: 'spectroscopy' },
  { key: 'ftir', value: 'FTIR', category: 'spectroscopy' },
  { key: 'nir', value: 'NIR', category: 'spectroscopy' },
  { key: 'atr-ftir', value: 'ATR-FTIR', category: 'spectroscopy' },
  { key: 'raman', value: 'Raman', category: 'spectroscopy' },
  { key: 'uv', value: 'UV', category: 'spectroscopy' },
  { key: 'uv-vis', value: 'UV-Vis', category: 'spectroscopy' },
  { key: 'vis', value: 'Vis', category: 'spectroscopy' },
  { key: 'fluorescence', value: 'Fluorescence', category: 'spectroscopy' },

  // Mass Spectrometry
  { key: 'ms', value: 'MS', category: 'mass_spectrometry' },
  { key: 'maldi', value: 'MALDI', category: 'mass_spectrometry' },
  { key: 'maldi-tof', value: 'MALDI-TOF', category: 'mass_spectrometry' },
  { key: 'esi-ms', value: 'ESI-MS', category: 'mass_spectrometry' },
  { key: 'tof-ms', value: 'TOF-MS', category: 'mass_spectrometry' },

  // Elemental & Metals Analysis
  { key: 'icp-ms', value: 'ICP-MS', category: 'elemental_analysis' },
  { key: 'icp-oes', value: 'ICP-OES', category: 'elemental_analysis' },
  { key: 'icp-aes', value: 'ICP-AES', category: 'elemental_analysis' },
  { key: 'aas', value: 'AAS', category: 'elemental_analysis' },
  { key: 'faas', value: 'FAAS', category: 'elemental_analysis' },
  { key: 'gfaas', value: 'GFAAS', category: 'elemental_analysis' },
  { key: 'xrf', value: 'XRF', category: 'elemental_analysis' },
  { key: 'ed-xrf', value: 'ED-XRF', category: 'elemental_analysis' },
  { key: 'wdxrf', value: 'WDXRF', category: 'elemental_analysis' },

  // Structural Analysis
  { key: 'xrd', value: 'XRD', category: 'structural_analysis' },
  { key: 'xrpd', value: 'XRPD', category: 'structural_analysis' },
  { key: 'pxrd', value: 'PXRD', category: 'structural_analysis' },
  { key: 'scxrd', value: 'SCXRD', category: 'structural_analysis' },
  { key: 'saxs', value: 'SAXS', category: 'structural_analysis' },
  { key: 'waxs', value: 'WAXS', category: 'structural_analysis' },

  // Thermal Analysis
  { key: 'dsc', value: 'DSC', category: 'thermal_analysis' },
  { key: 'tga', value: 'TGA', category: 'thermal_analysis' },
  { key: 'dta', value: 'DTA', category: 'thermal_analysis' },
  { key: 'tma', value: 'TMA', category: 'thermal_analysis' },
  { key: 'dma', value: 'DMA', category: 'thermal_analysis' },

  // Microscopy
  { key: 'sem', value: 'SEM', category: 'microscopy' },
  { key: 'tem', value: 'TEM', category: 'microscopy' },
  { key: 'afm', value: 'AFM', category: 'microscopy' },
  { key: 'optical microscopy', value: 'Optical microscopy', category: 'microscopy' },
  { key: 'polarized light microscopy', value: 'Polarized light microscopy', category: 'microscopy' },

  // Microbiological Methods
  { key: 'lal', value: 'LAL', category: 'microbiological' },
  { key: 'lal assay', value: 'LAL Assay', category: 'microbiological' },
  { key: 'lal test', value: 'LAL Test', category: 'microbiological' },
  { key: 'membrane filtration', value: 'Membrane Filtration', category: 'microbiological' },
  { key: 'plate count', value: 'Plate Count', category: 'microbiological' },
  { key: 'pour plate', value: 'Pour Plate', category: 'microbiological' },
  { key: 'spread plate', value: 'Spread Plate', category: 'microbiological' },
  { key: 'mpn', value: 'MPN', category: 'microbiological' },
  { key: 'most probable number', value: 'Most Probable Number', category: 'microbiological' },
  { key: 'pcr', value: 'PCR', category: 'microbiological' },
  { key: 'qpcr', value: 'qPCR', category: 'microbiological' },
  { key: 'rt-pcr', value: 'RT-PCR', category: 'microbiological' },
  { key: 'elisa', value: 'ELISA', category: 'microbiological' },
  { key: 'gel clot', value: 'Gel Clot', category: 'microbiological' },
  { key: 'kinetic turbidimetric', value: 'Kinetic Turbidimetric', category: 'microbiological' },
  { key: 'kinetic chromogenic', value: 'Kinetic Chromogenic', category: 'microbiological' },
  { key: 'chromogenic', value: 'Chromogenic', category: 'microbiological' },
  { key: 'turbidimetric', value: 'Turbidimetric', category: 'microbiological' },

  // Biological Assays
  { key: 'cell culture', value: 'Cell Culture', category: 'biological' },
  { key: 'cell-based assay', value: 'Cell-Based Assay', category: 'biological' },
  { key: 'bioassay', value: 'Bioassay', category: 'biological' },
  { key: 'western blot', value: 'Western Blot', category: 'biological' },
  { key: 'sds-page', value: 'SDS-PAGE', category: 'biological' },
  { key: 'ce-sds', value: 'CE-SDS', category: 'biological' },
  { key: 'ihc', value: 'IHC', category: 'biological' },
  { key: 'immunohistochemistry', value: 'Immunohistochemistry', category: 'biological' },
  { key: 'flow cytometry', value: 'Flow Cytometry', category: 'biological' },
  { key: 'facs', value: 'FACS', category: 'biological' },

  // Particle Characterization
  { key: 'laser diffraction', value: 'Laser Diffraction', category: 'particle_analysis' },
  { key: 'dynamic light scattering', value: 'Dynamic Light Scattering', category: 'particle_analysis' },
  { key: 'dls', value: 'DLS', category: 'particle_analysis' },
  { key: 'static light scattering', value: 'Static Light Scattering', category: 'particle_analysis' },
  { key: 'sls', value: 'SLS', category: 'particle_analysis' },
  { key: 'nta', value: 'NTA', category: 'particle_analysis' },
  { key: 'coulter counter', value: 'Coulter Counter', category: 'particle_analysis' },
  { key: 'bet', value: 'BET', category: 'particle_analysis' },

  // Dissolution & Physical
  { key: 'usp apparatus 1', value: 'USP Apparatus 1', category: 'dissolution' },
  { key: 'usp apparatus 2', value: 'USP Apparatus 2', category: 'dissolution' },
  { key: 'usp apparatus 3', value: 'USP Apparatus 3', category: 'dissolution' },
  { key: 'usp apparatus 4', value: 'USP Apparatus 4', category: 'dissolution' },
  { key: 'paddle', value: 'Paddle', category: 'dissolution' },
  { key: 'basket', value: 'Basket', category: 'dissolution' },
  { key: 'rotating cylinder', value: 'Rotating Cylinder', category: 'dissolution' },
  { key: 'flow-through cell', value: 'Flow-Through Cell', category: 'dissolution' },

  // Electrochemical
  { key: 'hplc-ec', value: 'HPLC-EC', category: 'electrochemical' },
  { key: 'ise', value: 'ISE', category: 'electrochemical' },
  { key: 'potentiometry', value: 'Potentiometry', category: 'electrochemical' },

  // Other Methods
  { key: 'lod', value: 'LOD', category: 'other' },
  { key: 'karl fischer', value: 'Karl Fischer', category: 'other' },
  { key: 'kf', value: 'Karl Fischer', category: 'other' },
  { key: 'visual', value: 'Visual', category: 'other' },
  { key: 'visual inspection', value: 'Visual Inspection', category: 'other' },
  { key: 'organoleptic', value: 'Organoleptic', category: 'other' },
  { key: 'titration', value: 'Titration', category: 'other' },
  { key: 'potentiometric titration', value: 'Potentiometric Titration', category: 'other' },
  { key: 'ph meter', value: 'pH Meter', category: 'other' },
  { key: 'melting point apparatus', value: 'Melting Point Apparatus', category: 'other' },
  { key: 'capillary melting point', value: 'Capillary Melting Point', category: 'other' },
  { key: 'polarimeter', value: 'Polarimeter', category: 'other' },
  { key: 'refractometer', value: 'Refractometer', category: 'other' },
  { key: 'viscometer', value: 'Viscometer', category: 'other' },
  { key: 'densitometer', value: 'Densitometer', category: 'other' },
  { key: 'conductivity meter', value: 'Conductivity Meter', category: 'other' },
  { key: 'osmometer', value: 'Osmometer', category: 'other' }
];

// Default Method Mappings
const defaultMethodData = [
  // Water/Moisture
  { key: 'water', value: 'Karl Fischer', category: 'chemical' },
  { key: 'water content', value: 'Karl Fischer', category: 'chemical' },
  { key: 'moisture', value: 'Karl Fischer', category: 'chemical' },
  { key: 'moisture content', value: 'Karl Fischer', category: 'chemical' },
  { key: 'h2o', value: 'Karl Fischer', category: 'chemical' },

  // Structure/Identity
  { key: 'structure', value: '1H NMR', category: 'chemical' },
  { key: 'structure conformity', value: '1H NMR', category: 'chemical' },
  { key: 'structural confirmation', value: '1H NMR', category: 'chemical' },
  { key: 'nmr', value: '1H NMR', category: 'chemical' },
  { key: 'identity', value: 'IR', category: 'chemical' },

  // Purity/Assay
  { key: 'purity', value: 'HPLC', category: 'chemical' },
  { key: 'assay', value: 'HPLC', category: 'chemical' },
  { key: 'content', value: 'HPLC', category: 'chemical' },
  { key: 'chromatographic purity', value: 'HPLC', category: 'chemical' },

  // Physical Properties - Visual
  { key: 'appearance', value: 'Visual', category: 'physical' },
  { key: 'color', value: 'Visual', category: 'physical' },
  { key: 'colour', value: 'Visual', category: 'physical' },
  { key: 'form', value: 'Visual', category: 'physical' },
  { key: 'solubility', value: 'Visual', category: 'physical' },
  { key: 'crystallinity', value: 'Optical Microscopy', category: 'physical' },

  // Physical Properties - Sensory
  { key: 'odor', value: 'Organoleptic', category: 'physical' },
  { key: 'odour', value: 'Organoleptic', category: 'physical' },

  // Physical Properties - Instrumental
  { key: 'viscosity', value: 'Viscometer', category: 'physical' },
  { key: 'density', value: 'Densitometer', category: 'physical' },
  { key: 'specific gravity', value: 'Densitometer', category: 'physical' },
  { key: 'refractive index', value: 'Refractometer', category: 'physical' },
  { key: 'optical rotation', value: 'Polarimeter', category: 'physical' },
  { key: 'specific rotation', value: 'Polarimeter', category: 'physical' },
  { key: 'conductivity', value: 'Conductivity Meter', category: 'physical' },

  // pH
  { key: 'ph', value: 'pH Meter', category: 'chemical' },

  // Impurities - Chromatographic
  { key: 'related substances', value: 'HPLC', category: 'chemical' },
  { key: 'impurities', value: 'HPLC', category: 'chemical' },
  { key: 'single impurity', value: 'HPLC', category: 'chemical' },
  { key: 'total impurities', value: 'HPLC', category: 'chemical' },
  { key: 'residual solvents', value: 'GC', category: 'chemical' },
  { key: 'solvents', value: 'GC', category: 'chemical' },
  { key: 'enantiomeric purity', value: 'HPLC', category: 'chemical' },
  { key: 'chiral purity', value: 'HPLC', category: 'chemical' },

  // Elemental/Metals
  { key: 'heavy metals', value: 'ICP-MS', category: 'chemical' },
  { key: 'metals', value: 'ICP-MS', category: 'chemical' },
  { key: 'trace metals', value: 'ICP-MS', category: 'chemical' },
  { key: 'elemental impurities', value: 'ICP-MS', category: 'chemical' },

  // Thermal Properties
  { key: 'melting point', value: 'Melting Point Apparatus', category: 'thermal' },
  { key: 'mp', value: 'Melting Point Apparatus', category: 'thermal' },
  { key: 'boiling point', value: 'Distillation Apparatus', category: 'thermal' },
  { key: 'bp', value: 'Distillation Apparatus', category: 'thermal' },
  { key: 'glass transition', value: 'DSC', category: 'thermal' },
  { key: 'tg', value: 'DSC', category: 'thermal' },
  { key: 'decomposition temperature', value: 'TGA', category: 'thermal' },

  // Particle Characterization
  { key: 'particle size', value: 'Laser Diffraction', category: 'physical' },
  { key: 'particle size distribution', value: 'Laser Diffraction', category: 'physical' },
  { key: 'surface area', value: 'BET', category: 'physical' },
  { key: 'bulk density', value: 'Densitometer', category: 'physical' },
  { key: 'tapped density', value: 'Densitometer', category: 'physical' },
  { key: 'true density', value: 'Helium Pycnometry', category: 'physical' },

  // Structural Analysis
  { key: 'polymorphic form', value: 'XRPD', category: 'physical' },

  // Dissolution/Disintegration
  { key: 'dissolution', value: 'USP Apparatus 2', category: 'physical' },
  { key: 'dissolution rate', value: 'USP Apparatus 2', category: 'physical' },
  { key: 'disintegration', value: 'Disintegration Tester', category: 'physical' },
  { key: 'disintegration time', value: 'Disintegration Tester', category: 'physical' },
  { key: 'drug release', value: 'USP Apparatus 2', category: 'physical' },
  { key: 'release rate', value: 'USP Apparatus 2', category: 'physical' },

  // Loss on Drying
  { key: 'loss on drying', value: 'LOD', category: 'physical' },
  { key: 'lod', value: 'LOD', category: 'physical' },

  // Microbiological Tests
  { key: 'bioburden', value: 'Membrane Filtration', category: 'microbiological' },
  { key: 'sterility', value: 'Membrane Filtration', category: 'microbiological' },
  { key: 'microbial limits', value: 'Membrane Filtration', category: 'microbiological' },
  { key: 'total aerobic count', value: 'Plate Count', category: 'microbiological' },
  { key: 'tamc', value: 'Plate Count', category: 'microbiological' },
  { key: 'total yeast mold count', value: 'Plate Count', category: 'microbiological' },
  { key: 'tymc', value: 'Plate Count', category: 'microbiological' },
  { key: 'total viable count', value: 'Plate Count', category: 'microbiological' },
  { key: 'endotoxin', value: 'LAL', category: 'microbiological' },
  { key: 'bacterial endotoxin', value: 'LAL', category: 'microbiological' },
  { key: 'pyrogen', value: 'LAL', category: 'microbiological' },
  { key: 'mycoplasma', value: 'PCR', category: 'microbiological' },
  { key: 'specified microorganisms', value: 'Membrane Filtration', category: 'microbiological' },

  // Biological Tests
  { key: 'potency', value: 'Bioassay', category: 'biological' },
  { key: 'biological activity', value: 'Bioassay', category: 'biological' },
  { key: 'cell viability', value: 'Flow Cytometry', category: 'biological' },
  { key: 'viability', value: 'Flow Cytometry', category: 'biological' },
  { key: 'viral safety', value: 'PCR', category: 'biological' },
  { key: 'viral clearance', value: 'PCR', category: 'biological' },
  { key: 'adventitious agents', value: 'PCR', category: 'biological' },
  { key: 'host cell proteins', value: 'ELISA', category: 'biological' },
  { key: 'hcp', value: 'ELISA', category: 'biological' },
  { key: 'host cell dna', value: 'qPCR', category: 'biological' },
  { key: 'residual dna', value: 'qPCR', category: 'biological' },
  { key: 'protein content', value: 'UV-Vis', category: 'biological' },
  { key: 'protein a', value: 'ELISA', category: 'biological' }
];

// Seed function
const seedParserConfig = async () => {
  try {
    console.log('\n🌱 Starting Parser Configuration Seed...\n');

    // Clear existing configurations
    console.log('Clearing existing parser configurations...');
    await ParserConfiguration.deleteMany({});
    console.log('✓ Existing configurations cleared\n');

    // Seed Test Attributes
    console.log('Seeding Test Attributes...');
    const testAttributeConfig = await ParserConfiguration.create({
      configType: 'testAttribute',
      entries: testAttributeData.map(item => ({
        ...item,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      version: 1,
      lastModifiedBy: 'system'
    });
    console.log(`✓ Test Attributes seeded: ${testAttributeConfig.totalEntries} entries\n`);

    // Seed Test Methods
    console.log('Seeding Test Methods...');
    const testMethodConfig = await ParserConfiguration.create({
      configType: 'testMethod',
      entries: testMethodData.map(item => ({
        ...item,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      version: 1,
      lastModifiedBy: 'system'
    });
    console.log(`✓ Test Methods seeded: ${testMethodConfig.totalEntries} entries\n`);

    // Seed Default Methods
    console.log('Seeding Default Method Mappings...');
    const defaultMethodConfig = await ParserConfiguration.create({
      configType: 'defaultMethod',
      entries: defaultMethodData.map(item => ({
        ...item,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      version: 1,
      lastModifiedBy: 'system'
    });
    console.log(`✓ Default Methods seeded: ${defaultMethodConfig.totalEntries} entries\n`);

    // Summary
    console.log('========================================');
    console.log('✅ Parser Configuration Seed Complete!');
    console.log('========================================');
    console.log(`Test Attributes:     ${testAttributeConfig.totalEntries} entries`);
    console.log(`Test Methods:        ${testMethodConfig.totalEntries} entries`);
    console.log(`Default Mappings:    ${defaultMethodConfig.totalEntries} entries`);
    console.log(`Total Entries:       ${testAttributeConfig.totalEntries + testMethodConfig.totalEntries + defaultMethodConfig.totalEntries}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error seeding parser configuration:', error);
    throw error;
  }
};

// Run the seed
const run = async () => {
  try {
    await connectDB();
    await seedParserConfig();
    console.log('Seed completed successfully. Disconnecting...');
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
