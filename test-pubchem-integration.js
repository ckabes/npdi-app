// Test PubChem Integration
const pubchemService = require('./server/services/pubchemService');

async function testPubChemIntegration() {
  console.log('🧪 Testing PubChem Integration...\n');

  // Test CAS numbers
  const testCases = [
    { cas: '64-17-5', name: 'Ethanol' },
    { cas: '7732-18-5', name: 'Water' },
    { cas: '67-56-1', name: 'Methanol' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing CAS: ${testCase.cas} (${testCase.name})`);
      console.log('─'.repeat(50));
      
      const enrichedData = await pubchemService.enrichTicketData(testCase.cas);
      
      if (enrichedData.error) {
        console.log(`❌ Error: ${enrichedData.error}`);
        continue;
      }
      
      console.log('✅ Chemical Properties:');
      console.log(`   Product Name: ${enrichedData.productName}`);
      console.log(`   Molecular Formula: ${enrichedData.chemicalProperties.molecularFormula}`);
      console.log(`   Molecular Weight: ${enrichedData.chemicalProperties.molecularWeight}`);
      console.log(`   IUPAC Name: ${enrichedData.chemicalProperties.iupacName}`);
      console.log(`   PubChem CID: ${enrichedData.chemicalProperties.pubchemCID}`);
      console.log(`   Auto-populated: ${enrichedData.chemicalProperties.autoPopulated}`);
      
      console.log('\n📊 Generated SKUs:');
      enrichedData.skuVariants.forEach(sku => {
        console.log(`   ${sku.type}: ${sku.sku} - ${sku.description}`);
        console.log(`     Demand: ${sku.salesForecasting.demandPattern}, Volume: ${sku.salesForecasting.expectedVolume}`);
        console.log(`     Confidence: ${(sku.salesForecasting.confidence * 100).toFixed(0)}%`);
      });
      
      if (enrichedData.hazardClassification?.hazardStatements?.length > 0) {
        console.log('\n⚠️  Hazard Information:');
        console.log(`   Signal Word: ${enrichedData.hazardClassification.signalWord || 'Not specified'}`);
        console.log(`   Pictograms: ${enrichedData.hazardClassification.pictograms?.length || 0} found`);
        console.log(`   Hazard Statements: ${enrichedData.hazardClassification.hazardStatements?.length || 0} found`);
      }
      
      console.log('\n🏢 Corp Base Data:');
      console.log(`   Applications: ${enrichedData.corpBaseData?.applicationAreas?.join(', ') || 'None'}`);
      console.log(`   SEO Keywords: ${enrichedData.corpBaseData?.seoKeywords?.length || 0} generated`);
      
      console.log('\n' + '='.repeat(70) + '\n');
      
    } catch (error) {
      console.log(`❌ Failed to process ${testCase.cas}: ${error.message}\n`);
    }
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ PubChem integration test completed!');
}

if (require.main === module) {
  testPubChemIntegration()
    .then(() => {
      console.log('\n📋 Integration test finished successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Integration test failed:', error);
      process.exit(1);
    });
}