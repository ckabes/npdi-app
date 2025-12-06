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
      // Check if this is a 404 "not found" error from PubChem
      if (error.response?.status === 404 || error.response?.data?.Fault?.Code === 'PUGREST.NotFound') {
        console.error(`PubChem: CAS number ${casNumber} not found`);
        throw new Error(
          `CAS number "${casNumber}" not found in PubChem database. ` +
          `Please verify the CAS number is correct. Common issues: ` +
          `incorrect format (should be XX-XX-X or XXX-XX-X), typos, or compound not in PubChem.`
        );
      }

      // Other errors (timeout, network, etc.)
      console.error(`PubChem API error for CAS ${casNumber}:`, error.message);
      throw new Error(`Failed to fetch data for CAS ${casNumber}: ${error.message}`);
    }
  }

  async getCompoundData(cid) {
    try {
      // Get enhanced compound properties including all available computed properties
      await this.delay(this.requestDelay);
      const propertiesResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,IUPACName,InChI,InChIKey,XLogP,HeavyAtomCount,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,ExactMass,MonoisotopicMass,TPSA,Complexity,Charge/JSON`,
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

      // Get ALL experimental properties - requesting without heading filter to avoid 400 errors
      await this.delay(this.requestDelay);
      let physicalPropsResponse;
      try {
        physicalPropsResponse = await axios.get(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON`,
          { timeout: 15000 }
        );
        console.log(`Physical properties API call successful for CID ${cid}`);
      } catch (physError) {
        console.warn(`Physical properties API call failed for CID ${cid}:`, physError.message);
        physicalPropsResponse = { data: null };
      }

      const properties = propertiesResponse.data?.PropertyTable?.Properties?.[0];
      const synonyms = synonymsResponse.data?.InformationList?.Information?.[0]?.Synonym || [];
      const physicalProperties = this.parsePhysicalProperties(physicalPropsResponse.data);
      
      return {
        cid: cid.toString(),
        properties: {
          molecularFormula: properties?.MolecularFormula || null,
          molecularWeight: properties?.MolecularWeight || null,
          canonicalSMILES: properties?.SMILES || properties?.CanonicalSMILES || null,
          isomericSMILES: properties?.ConnectivitySMILES || properties?.IsomericSMILES || null,
          iupacName: properties?.IUPACName || null,
          inchi: properties?.InChI || null,
          inchiKey: properties?.InChIKey || null,
          xLogP: properties?.XLogP || null,
          heavyAtomCount: properties?.HeavyAtomCount || null,
          hBondDonorCount: properties?.HBondDonorCount || null,
          hBondAcceptorCount: properties?.HBondAcceptorCount || null,
          rotatableBondCount: properties?.RotatableBondCount || null,
          exactMass: properties?.ExactMass || null,
          monoisotopicMass: properties?.MonoisotopicMass || null,
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
        vaporDensity: null,
        refractiveIndex: null,
        physicalState: null,
        unNumber: null
      };

      // Helper function to prioritize Celsius values for temperature properties
      const getCelsiusPreferredValue = (valuesList) => {
        if (valuesList.length === 0) return '';
        if (valuesList.length === 1) return valuesList[0];

        // Find values containing Celsius indicators (°C has priority)
        const celsiusValues = valuesList.filter(v =>
          v.includes('°C') || v.includes('deg C') || v.includes('degC')
        );

        // If there's exactly one Celsius value among multiple options, use only that one
        if (celsiusValues.length === 1) {
          return celsiusValues[0];
        }

        // If we have multiple Celsius values, return all of them separated by semicolons
        // The frontend will allow user to choose
        if (celsiusValues.length > 1) {
          return celsiusValues.join('; ');
        }

        // No Celsius values found, return all values
        return valuesList.join('; ');
      };

      // Recursively search through sections for physical properties
      const searchSections = (sections) => {
        if (!Array.isArray(sections)) return;

        sections.forEach(section => {
          if (section.TOCHeading) {
            const heading = section.TOCHeading.toLowerCase();

            if (section.Information) {
              // Collect ALL values from ALL Information items in this section first
              let boilingPointValues = [];
              let meltingPointValues = [];
              let flashPointValues = [];
              let densityValues = [];
              let solubilityValues = [];
              let vaporPressureValues = [];
              let vaporDensityValues = [];
              let refractiveIndexValues = [];
              let unNumberValue = null;

              section.Information.forEach(info => {
                if (info.Value) {
                  // Collect all values from both StringWithMarkup and Number formats
                  let allValuesList = [];

                  // Handle StringWithMarkup format
                  if (info.Value.StringWithMarkup) {
                    const stringValues = info.Value.StringWithMarkup.map(item => item.String).filter(Boolean);
                    allValuesList.push(...stringValues);
                  }

                  // Handle Number + Unit format (often more precise)
                  if (info.Value.Number && info.Value.Unit) {
                    const numericValue = Array.isArray(info.Value.Number) ? info.Value.Number[0] : info.Value.Number;
                    if (numericValue !== null && numericValue !== undefined) {
                      allValuesList.push(`${numericValue} ${info.Value.Unit}`);
                    }
                  }

                  if (allValuesList.length === 0) return;

                  const value = allValuesList[0]; // First value for non-temperature properties

                  // Extract physical description/state
                  if (heading.includes('physical description') || heading.includes('physical state')) {
                    if (!physicalProps.physicalDescription) {
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
                  }

                  // Collect temperature-based property values
                  if (heading.includes('boiling point') || info.Name?.toLowerCase().includes('boiling')) {
                    boilingPointValues.push(...allValuesList);
                  }
                  if (heading.includes('melting point') || info.Name?.toLowerCase().includes('melting')) {
                    meltingPointValues.push(...allValuesList);
                  }
                  if (heading.includes('flash point') || info.Name?.toLowerCase().includes('flash')) {
                    flashPointValues.push(...allValuesList);
                  }
                  if ((heading.includes('density') && !heading.includes('vapor')) || (info.Name?.toLowerCase().includes('density') && !info.Name?.toLowerCase().includes('vapor'))) {
                    densityValues.push(...allValuesList);
                  }
                  if (heading.includes('solubility') || info.Name?.toLowerCase().includes('solubility')) {
                    solubilityValues.push(...allValuesList);
                  }
                  if (heading.includes('vapor pressure') || info.Name?.toLowerCase().includes('vapor pressure')) {
                    vaporPressureValues.push(...allValuesList);
                  }
                  if (heading.includes('vapor density') || info.Name?.toLowerCase().includes('vapor density')) {
                    vaporDensityValues.push(...allValuesList);
                  }
                  if (heading.includes('refractive index') || info.Name?.toLowerCase().includes('refractive index')) {
                    refractiveIndexValues.push(...allValuesList);
                  }

                  // Extract UN number from safety/transport sections
                  if (heading.includes('un number') || heading.includes('un/na number') ||
                      heading.includes('dot') || heading.includes('transport') ||
                      info.Name?.toLowerCase().includes('un number') ||
                      info.Name?.toLowerCase().includes('un/na')) {
                    // Look for UN followed by numbers (e.g., UN1170, UN 1170)
                    const unMatch = value.match(/UN\s*(\d{4})/i);
                    if (unMatch && !unNumberValue) {
                      unNumberValue = `UN${unMatch[1]}`;
                    }
                  }
                }
              });

              // Now set properties using collected values with Celsius preference for temperatures
              if (boilingPointValues.length > 0 && !physicalProps.boilingPoint) {
                physicalProps.boilingPoint = getCelsiusPreferredValue(boilingPointValues);
              }
              if (meltingPointValues.length > 0 && !physicalProps.meltingPoint) {
                physicalProps.meltingPoint = getCelsiusPreferredValue(meltingPointValues);
              }
              if (flashPointValues.length > 0 && !physicalProps.flashPoint) {
                physicalProps.flashPoint = getCelsiusPreferredValue(flashPointValues);
              }
              if (densityValues.length > 0 && !physicalProps.density) {
                physicalProps.density = densityValues.join('; ');
              }
              if (solubilityValues.length > 0 && !physicalProps.solubility) {
                physicalProps.solubility = solubilityValues.join('; ');
              }
              if (vaporPressureValues.length > 0 && !physicalProps.vaporPressure) {
                physicalProps.vaporPressure = vaporPressureValues.join('; ');
              }
              if (vaporDensityValues.length > 0 && !physicalProps.vaporDensity) {
                physicalProps.vaporDensity = vaporDensityValues.join('; ');
              }
              if (refractiveIndexValues.length > 0 && !physicalProps.refractiveIndex) {
                physicalProps.refractiveIndex = refractiveIndexValues.join('; ');
              }
              if (unNumberValue && !physicalProps.unNumber) {
                physicalProps.unNumber = unNumberValue;
              }
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
        inchi: pubchemData.properties.inchi,
        inchiKey: pubchemData.properties.inchiKey,
        synonyms: pubchemData.synonyms || [],
        hazardStatements: pubchemData.ghsData?.hazardStatements || [],
        unNumber: pubchemData.physicalProperties?.unNumber || null,
        pubchemCID: pubchemData.cid,
        // Add physical properties (only if they exist to avoid null enum validation)
        ...(pubchemData.physicalProperties?.physicalState && { physicalState: pubchemData.physicalProperties.physicalState }),
        // Store additional properties from PubChem (hidden by default, user can reveal)
        additionalProperties: {
          meltingPoint: pubchemData.physicalProperties?.meltingPoint || null,
          boilingPoint: pubchemData.physicalProperties?.boilingPoint || null,
          flashPoint: pubchemData.physicalProperties?.flashPoint || null,
          density: pubchemData.physicalProperties?.density || null,
          vaporPressure: pubchemData.physicalProperties?.vaporPressure || null,
          vaporDensity: pubchemData.physicalProperties?.vaporDensity || null,
          refractiveIndex: pubchemData.physicalProperties?.refractiveIndex || null,
          logP: pubchemData.properties?.xLogP?.toString() || null,
          polarSurfaceArea: pubchemData.properties?.tpsa?.toString() || null,
          hydrogenBondDonor: pubchemData.properties?.hBondDonorCount || null,
          hydrogenBondAcceptor: pubchemData.properties?.hBondAcceptorCount || null,
          rotatableBonds: pubchemData.properties?.rotatableBondCount || null,
          exactMass: pubchemData.properties?.exactMass?.toString() || null,
          monoisotopicMass: pubchemData.properties?.monoisotopicMass?.toString() || null,
          complexity: pubchemData.properties?.complexity?.toString() || null,
          heavyAtomCount: pubchemData.properties?.heavyAtomCount || null,
          charge: pubchemData.properties?.charge || null,
          visibleProperties: [] // Hidden by default - user can selectively reveal them
        },
        pubchemData: {
          lastUpdated: new Date(),
          compound: pubchemData,
          properties: pubchemData.properties,
          physicalProperties: pubchemData.physicalProperties,
          hazards: pubchemData.ghsData
        },
        autoPopulated: true
      };

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
        skuVariants: [],
        corpbaseData: {},
        error: error.message
      };
    }
  }
}

module.exports = new PubChemService();