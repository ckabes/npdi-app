import axios from 'axios';

class PubChemService {
  private baseURL: string;
  private requestDelay: number;

  constructor() {
    this.baseURL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
    this.requestDelay = 200; // Rate limiting - 5 requests per second
  }

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCompoundByCAS(casNumber: string) {
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
    } catch (error: any) {
      console.error(`PubChem API error for CAS ${casNumber}:`, error.message);
      throw new Error(`Failed to fetch data for CAS ${casNumber}: ${error.message}`);
    }
  }

  async getCompoundData(cid: string) {
    try {
      // Get basic compound properties
      await this.delay(this.requestDelay);
      const propertiesResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName,XLogP,HeavyAtomCount,HBondDonorCount,HBondAcceptorCount/JSON`,
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

      const properties = propertiesResponse.data?.PropertyTable?.Properties?.[0];
      const synonyms = synonymsResponse.data?.InformationList?.Information?.[0]?.Synonym || [];
      
      return {
        cid: cid.toString(),
        properties: {
          molecularFormula: properties?.MolecularFormula || null,
          molecularWeight: properties?.MolecularWeight || null,
          canonicalSMILES: properties?.CanonicalSMILES || null,
          iupacName: properties?.IUPACName || null,
          xLogP: properties?.XLogP || null,
          heavyAtomCount: properties?.HeavyAtomCount || null,
          hBondDonorCount: properties?.HBondDonorCount || null,
          hBondAcceptorCount: properties?.HBondAcceptorCount || null
        },
        synonyms: synonyms.slice(0, 10), // Limit to first 10 synonyms
        ghsData: this.parseGHSData(ghsResponse.data),
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`PubChem data fetch error for CID ${cid}:`, error.message);
      throw new Error(`Failed to fetch compound data: ${error.message}`);
    }
  }

  parseGHSData(ghsData: any) {
    if (!ghsData?.Record?.Section) {
      return null;
    }

    try {
      const sections = ghsData.Record.Section;
      let ghsInfo = {
        hazardStatements: [] as string[],
        precautionaryStatements: [] as string[],
        signalWord: null as string | null,
        classification: [] as string[]
      };

      // Recursively search through sections for GHS data
      const searchSections = (sections: any[]) => {
        if (!Array.isArray(sections)) return;
        
        sections.forEach(section => {
          if (section.TOCHeading && section.TOCHeading.toLowerCase().includes('ghs')) {
            if (section.Information) {
              section.Information.forEach((info: any) => {
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

  async generateAIProductDescription(pubchemData: any, casNumber: string) {
    // Simple AI-like description generation based on chemical properties
    const name = pubchemData.properties.iupacName || pubchemData.synonyms[0] || `Compound with CAS ${casNumber}`;
    const formula = pubchemData.properties.molecularFormula || 'Unknown formula';
    const mw = pubchemData.properties.molecularWeight ? Math.round(pubchemData.properties.molecularWeight) : 'Unknown';
    
    // Generate application-based description
    let applications: string[] = [];
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

  async enrichTicketData(casNumber: string) {
    try {
      console.log(`Fetching PubChem data for CAS: ${casNumber}`);
      
      const pubchemData = await this.getCompoundByCAS(casNumber);
      const aiDescription = await this.generateAIProductDescription(pubchemData, casNumber);
      
      // Generate enhanced chemical properties
      const chemicalProperties = {
        casNumber,
        molecularFormula: pubchemData.properties.molecularFormula,
        molecularWeight: pubchemData.properties.molecularWeight,
        iupacName: pubchemData.properties.iupacName,
        canonicalSMILES: pubchemData.properties.canonicalSMILES,
        pubchemCID: pubchemData.cid,
        pubchemData: {
          lastUpdated: new Date(),
          compound: pubchemData,
          properties: pubchemData.properties,
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
      const skuVariants: any[] = [];

      // Generate CorpBase website data with AI description
      const corpbaseData = {
        ...aiDescription,
        technicalSpecifications: `Molecular Formula: ${pubchemData.properties.molecularFormula || 'N/A'}\nMolecular Weight: ${pubchemData.properties.molecularWeight ? Math.round(pubchemData.properties.molecularWeight) + ' g/mol' : 'N/A'}\nCAS Number: ${casNumber}\nSMILES: ${pubchemData.properties.canonicalSMILES || 'N/A'}`,
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
    } catch (error: any) {
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
}

const pubchemService = new PubChemService();
export default pubchemService;