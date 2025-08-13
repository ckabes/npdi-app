const axios = require('axios');

class PubChemService {
  constructor() {
    this.baseURL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
    this.requestDelay = 200; // Rate limiting - 5 requests per second
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCompoundByCAS(casNumber) {
    try {
      await this.delay(this.requestDelay);
      
      // First, get the compound CID by CAS number
      const cidResponse = await axios.get(
        `${this.baseURL}/compound/name/${encodeURIComponent(casNumber)}/cids/JSON`,
        { timeout: 10000 }
      );

      if (!cidResponse.data?.IdentifierList?.CID) {
        throw new Error('Compound not found in PubChem');
      }

      const cid = cidResponse.data.IdentifierList.CID[0];
      return await this.getCompoundData(cid);
    } catch (error) {
      console.error(`PubChem API error for CAS ${casNumber}:`, error.message);
      throw new Error(`Failed to fetch data for CAS ${casNumber}: ${error.message}`);
    }
  }

  async getCompoundData(cid) {
    try {
      // Get enhanced compound properties including the requested physical properties
      await this.delay(this.requestDelay);
      const propertiesResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,IUPACName,XLogP,HeavyAtomCount,HBondDonorCount,HBondAcceptorCount,TPSA,Complexity,Charge/JSON`,
        { timeout: 10000 }
      );

      // Get compound synonyms for alternative names
      await this.delay(this.requestDelay);
      const synonymsResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cid}/synonyms/JSON`,
        { timeout: 10000 }
      ).catch(() => ({ data: null })); // Don't fail if synonyms not available

      // Get GHS classification data
      await this.delay(this.requestDelay);
      const ghsResponse = await axios.get(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`,
        { timeout: 10000 }
      ).catch(() => ({ data: null })); // Don't fail if GHS not available

      // Get experimental physical properties
      await this.delay(this.requestDelay);
      const physicalPropsResponse = await axios.get(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Physical+Description,Boiling+Point,Melting+Point,Flash+Point,Density,Solubility,Vapor+Pressure`,
        { timeout: 10000 }
      ).catch(() => ({ data: null })); // Don't fail if physical props not available

      const properties = propertiesResponse.data?.PropertyTable?.Properties?.[0];
      const synonyms = synonymsResponse.data?.InformationList?.Information?.[0]?.Synonym || [];
      const physicalProperties = this.parsePhysicalProperties(physicalPropsResponse.data);
      
      return {
        cid: cid.toString(),
        properties: {
          molecularFormula: properties?.MolecularFormula || null,
          molecularWeight: properties?.MolecularWeight || null,
          canonicalSMILES: properties?.CanonicalSMILES || null,
          isomericSMILES: properties?.IsomericSMILES || null,
          iupacName: properties?.IUPACName || null,
          xLogP: properties?.XLogP || null,
          heavyAtomCount: properties?.HeavyAtomCount || null,
          hBondDonorCount: properties?.HBondDonorCount || null,
          hBondAcceptorCount: properties?.HBondAcceptorCount || null,
          tpsa: properties?.TPSA || null,
          complexity: properties?.Complexity || null,
          charge: properties?.Charge || null
        },
        physicalProperties: physicalProperties,
        synonyms: synonyms.slice(0, 10), // Limit to first 10 synonyms
        ghsData: this.parseGHSData(ghsResponse.data),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`PubChem data fetch error for CID ${cid}:`, error.message);
      throw new Error(`Failed to fetch compound data: ${error.message}`);
    }
  }

  parseGHSData(ghsData) {
    if (!ghsData?.Record?.Section) {
      return null;
    }

    try {
      const sections = ghsData.Record.Section;
      let ghsInfo = {
        hazardStatements: [],
        precautionaryStatements: [],
        signalWord: null,
        classification: []
      };

      // Recursively search through sections for GHS data
      const searchSections = (sections) => {
        if (!Array.isArray(sections)) return;
        
        sections.forEach(section => {
          if (section.TOCHeading && section.TOCHeading.toLowerCase().includes('ghs')) {
            if (section.Information) {
              section.Information.forEach(info => {
                if (info.Name && info.Value && info.Value.StringWithMarkup) {
                  const value = info.Value.StringWithMarkup[0]?.String || '';
                  
                  if (info.Name.toLowerCase().includes('hazard')) {
                    ghsInfo.hazardStatements.push(value);
                  } else if (info.Name.toLowerCase().includes('precautionary')) {
                    ghsInfo.precautionaryStatements.push(value);
                  } else if (info.Name.toLowerCase().includes('signal')) {
                    ghsInfo.signalWord = value;
                  }
                }
              });
            }
          }
          
          if (section.Section) {
            searchSections(section.Section);
          }
        });
      };

      searchSections(sections);
      return ghsInfo;
    } catch (error) {
      console.error('GHS data parsing error:', error);
      return null;
    }
  }

  parsePhysicalProperties(physicalData) {
    if (!physicalData?.Record?.Section) {
      return {};
    }

    try {
      let physicalProps = {
        physicalDescription: null,
        boilingPoint: null,
        meltingPoint: null,
        flashPoint: null,
        density: null,
        solubility: null,
        vaporPressure: null,
        physicalState: null
      };

      // Recursively search through sections for physical properties
      const searchSections = (sections) => {
        if (!Array.isArray(sections)) return;
        
        sections.forEach(section => {
          if (section.TOCHeading) {
            const heading = section.TOCHeading.toLowerCase();
            
            if (section.Information) {
              section.Information.forEach(info => {
                if (info.Value && info.Value.StringWithMarkup) {
                  const value = info.Value.StringWithMarkup[0]?.String || '';
                  
                  // Extract physical description/state
                  if (heading.includes('physical description') || heading.includes('physical state')) {
                    physicalProps.physicalDescription = value;
                    // Try to extract state from description
                    const stateMatch = value.toLowerCase();
                    if (stateMatch.includes('liquid')) {
                      physicalProps.physicalState = 'Liquid';
                    } else if (stateMatch.includes('solid') || stateMatch.includes('crystal')) {
                      physicalProps.physicalState = 'Solid';
                    } else if (stateMatch.includes('gas')) {
                      physicalProps.physicalState = 'Gas';
                    } else if (stateMatch.includes('powder')) {
                      physicalProps.physicalState = 'Powder';
                    }
                  }
                  
                  // Extract temperature-based properties
                  if (heading.includes('boiling point') || info.Name?.toLowerCase().includes('boiling')) {
                    physicalProps.boilingPoint = value;
                  }
                  if (heading.includes('melting point') || info.Name?.toLowerCase().includes('melting')) {
                    physicalProps.meltingPoint = value;
                  }
                  if (heading.includes('flash point') || info.Name?.toLowerCase().includes('flash')) {
                    physicalProps.flashPoint = value;
                  }
                  if (heading.includes('density') || info.Name?.toLowerCase().includes('density')) {
                    physicalProps.density = value;
                  }
                  if (heading.includes('solubility') || info.Name?.toLowerCase().includes('solubility')) {
                    physicalProps.solubility = value;
                  }
                  if (heading.includes('vapor pressure') || info.Name?.toLowerCase().includes('vapor pressure')) {
                    physicalProps.vaporPressure = value;
                  }
                }
              });
            }
          }
          
          if (section.Section) {
            searchSections(section.Section);
          }
        });
      };

      searchSections(physicalData.Record.Section);
      return physicalProps;
    } catch (error) {
      console.error('Physical properties parsing error:', error);
      return {};
    }
  }

  async generateAIProductDescription(pubchemData, casNumber) {
    // Simple AI-like description generation based on chemical properties
    const name = pubchemData.properties.iupacName || pubchemData.synonyms[0] || `Compound with CAS ${casNumber}`;
    const formula = pubchemData.properties.molecularFormula || 'Unknown formula';
    const mw = pubchemData.properties.molecularWeight ? Math.round(pubchemData.properties.molecularWeight) : 'Unknown';
    
    // Generate application-based description
    let applications = [];
    if (pubchemData.properties.xLogP !== null) {
      if (pubchemData.properties.xLogP > 2) {
        applications.push('lipophilic applications', 'membrane permeation studies');
      } else {
        applications.push('hydrophilic formulations', 'aqueous solutions');
      }
    }
    
    if (pubchemData.properties.hBondDonorCount > 0 || pubchemData.properties.hBondAcceptorCount > 0) {
      applications.push('pharmaceutical synthesis', 'drug development');
    }
    
    applications.push('research applications', 'analytical standards');
    
    const description = `${name} (${formula}, MW: ${mw} g/mol) is a high-purity chemical reagent ideal for ${applications.slice(0, 3).join(', ')}. This compound offers excellent quality and consistency for laboratory research, synthetic chemistry, and analytical applications. Manufactured to the highest standards with comprehensive documentation and certificates of analysis.`;
    
    return {
      productDescription: description,
      aiGenerated: true,
      generatedAt: new Date(),
      keyFeatures: [
        'High purity grade',
        'Comprehensive analytical documentation',
        'Consistent batch-to-batch quality',
        'Research and industrial grade'
      ],
      applications: applications.slice(0, 5),
      targetMarkets: [
        'Academic research institutions',
        'Pharmaceutical companies',
        'Biotechnology companies',
        'Chemical manufacturers'
      ],
      competitiveAdvantages: [
        'MilliporeSigma quality assurance',
        'Global supply chain reliability',
        'Technical support included',
        'Regulatory compliance documentation'
      ]
    };
  }

  async enrichTicketData(casNumber) {
    try {
      console.log(`Fetching PubChem data for CAS: ${casNumber}`);
      
      const pubchemData = await this.getCompoundByCAS(casNumber);
      const aiDescription = await this.generateAIProductDescription(pubchemData, casNumber);
      
      // Generate enhanced chemical properties with physical data
      const chemicalProperties = {
        casNumber,
        molecularFormula: pubchemData.properties.molecularFormula,
        molecularWeight: pubchemData.properties.molecularWeight,
        iupacName: pubchemData.properties.iupacName,
        canonicalSMILES: pubchemData.properties.canonicalSMILES,
        isomericSMILES: pubchemData.properties.isomericSMILES,
        pubchemCID: pubchemData.cid,
        // Add physical properties (only if they exist to avoid null enum validation)
        ...(pubchemData.physicalProperties?.physicalState && { physicalState: pubchemData.physicalProperties.physicalState }),
        ...(pubchemData.physicalProperties?.boilingPoint && { boilingPoint: pubchemData.physicalProperties.boilingPoint }),
        ...(pubchemData.physicalProperties?.meltingPoint && { meltingPoint: pubchemData.physicalProperties.meltingPoint }),
        ...(pubchemData.physicalProperties?.flashPoint && { flashPoint: pubchemData.physicalProperties.flashPoint }),
        ...(pubchemData.physicalProperties?.density && { density: pubchemData.physicalProperties.density }),
        ...(pubchemData.physicalProperties?.physicalDescription && { physicalDescription: pubchemData.physicalProperties.physicalDescription }),
        // Enhanced computed properties
        tpsa: pubchemData.properties.tpsa,
        complexity: pubchemData.properties.complexity,
        charge: pubchemData.properties.charge,
        pubchemData: {
          lastUpdated: new Date(),
          compound: pubchemData,
          properties: pubchemData.properties,
          physicalProperties: pubchemData.physicalProperties,
          hazards: pubchemData.ghsData
        },
        autoPopulated: true
      };

      // Generate enhanced hazard classification (without pictograms)
      const hazardClassification = pubchemData.ghsData ? {
        hazardStatements: pubchemData.ghsData.hazardStatements || [],
        precautionaryStatements: pubchemData.ghsData.precautionaryStatements || [],
        signalWord: pubchemData.ghsData.signalWord || 'WARNING',
        pubchemGHS: {
          autoImported: true,
          lastUpdated: new Date(),
          rawData: pubchemData.ghsData
        }
      } : {};

      // SKU variants will be assigned by PMOps team later
      const skuVariants = [];

      // Generate CorpBase website data with AI description and enhanced specs
      const technicalSpecs = [
        `Molecular Formula: ${pubchemData.properties.molecularFormula || 'N/A'}`,
        `Molecular Weight: ${pubchemData.properties.molecularWeight ? Math.round(pubchemData.properties.molecularWeight) + ' g/mol' : 'N/A'}`,
        `CAS Number: ${casNumber}`,
        `Canonical SMILES: ${pubchemData.properties.canonicalSMILES || 'N/A'}`,
        pubchemData.properties.isomericSMILES ? `Isomeric SMILES: ${pubchemData.properties.isomericSMILES}` : null,
        pubchemData.physicalProperties?.physicalState ? `Physical State: ${pubchemData.physicalProperties.physicalState}` : null,
        pubchemData.physicalProperties?.boilingPoint ? `Boiling Point: ${pubchemData.physicalProperties.boilingPoint}` : null,
        pubchemData.physicalProperties?.meltingPoint ? `Melting Point: ${pubchemData.physicalProperties.meltingPoint}` : null,
        pubchemData.physicalProperties?.flashPoint ? `Flash Point: ${pubchemData.physicalProperties.flashPoint}` : null,
        pubchemData.physicalProperties?.density ? `Density: ${pubchemData.physicalProperties.density}` : null,
        pubchemData.properties.tpsa ? `TPSA: ${pubchemData.properties.tpsa} Ų` : null,
        pubchemData.properties.xLogP ? `LogP: ${pubchemData.properties.xLogP}` : null
      ].filter(Boolean).join('\n');

      const corpbaseData = {
        ...aiDescription,
        technicalSpecifications: technicalSpecs,
        qualityStandards: [
          'ISO 9001:2015 certified manufacturing',
          'Comprehensive Certificate of Analysis',
          'Batch-to-batch consistency testing',
          'Regulatory compliance documentation'
        ]
      };

      return {
        chemicalProperties,
        hazardClassification,
        skuVariants,
        corpbaseData,
        productName: pubchemData.properties.iupacName || 
                    pubchemData.synonyms[0] || 
                    `Chemical compound (CAS: ${casNumber})`
      };
    } catch (error) {
      console.error('PubChem enrichment error:', error);
      // Return minimal data structure if PubChem fails
      return {
        chemicalProperties: {
          casNumber,
          autoPopulated: false
        },
        hazardClassification: {},
        skuVariants: [],
        corpbaseData: {},
        error: error.message
      };
    }
  }

  generateMarketingDescription(pubchemData) {
    const name = pubchemData.properties.iupacName || 'Chemical compound';
    const formula = pubchemData.properties.molecularFormula || '';
    const mw = pubchemData.properties.molecularWeight || '';
    
    return {
      shortDescription: `High-quality ${name} ${formula ? `(${formula})` : ''} for research and industrial applications`,
      detailedDescription: `Premium grade chemical reagent ${mw ? `with molecular weight ${mw} g/mol` : ''} suitable for research and industrial applications`,
      keyBenefits: [
        'Research grade purity',
        'Comprehensive documentation',
        'Reliable supply chain',
        'MilliporeSigma quality assurance'
      ]
    };
  }

  identifyApplicationAreas(pubchemData) {
    // Basic application identification based on molecular properties
    const applications = ['Organic synthesis', 'Research and development'];
    
    if (pubchemData.properties.xLogP !== null) {
      if (pubchemData.properties.xLogP > 2) {
        applications.push('Lipophilic applications');
      } else {
        applications.push('Hydrophilic applications');
      }
    }
    
    if (pubchemData.properties.hBondDonorCount > 0 || pubchemData.properties.hBondAcceptorCount > 0) {
      applications.push('Pharmaceutical intermediates');
    }
    
    applications.push('Analytical chemistry');
    
    return applications;
  }

  generateSEOKeywords(casNumber, pubchemData) {
    const keywords = [
      casNumber,
      pubchemData.properties.molecularFormula,
      'chemical reagent',
      'research grade',
      'high purity',
      'milliporesigma'
    ];
    
    if (pubchemData.properties.iupacName) {
      keywords.push(pubchemData.properties.iupacName);
    }
    
    // Add first few synonyms
    if (pubchemData.synonyms) {
      keywords.push(...pubchemData.synonyms.slice(0, 3));
    }
    
    return keywords.filter(Boolean);
  }

  generateTechnicalBenefits(pubchemData) {
    const benefits = [];
    
    if (pubchemData.properties.molecularWeight) {
      benefits.push(`Molecular weight: ${pubchemData.properties.molecularWeight} g/mol`);
    }
    
    if (pubchemData.properties.xLogP !== null) {
      benefits.push(`LogP: ${pubchemData.properties.xLogP} (indicates solubility characteristics)`);
    }
    
    if (pubchemData.properties.hBondDonorCount > 0) {
      benefits.push(`${pubchemData.properties.hBondDonorCount} hydrogen bond donor(s)`);
    }
    
    if (pubchemData.properties.hBondAcceptorCount > 0) {
      benefits.push(`${pubchemData.properties.hBondAcceptorCount} hydrogen bond acceptor(s)`);
    }
    
    return benefits;
  }
}

module.exports = new PubChemService();