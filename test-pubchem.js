const axios = require('axios');
const fs = require('fs');

async function testPubChem() {
  const cid = '702'; // Ethanol

  console.log('Testing PubChem PUG View API...\n');

  try {
    // Test 1: Single heading
    console.log('Test 1: Requesting "Boiling Point" only');
    const response1 = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Boiling+Point`,
      { timeout: 10000 }
    );
    console.log('Status:', response1.status);
    console.log('Has Record:', !!response1.data.Record);
    if (response1.data.Record) {
      console.log('Number of sections:', response1.data.Record.Section?.length);
      fs.writeFileSync('pubchem-boiling-point.json', JSON.stringify(response1.data, null, 2));
      console.log('Saved to: pubchem-boiling-point.json\n');
    }

    // Test 2: Multiple headings
    console.log('Test 2: Requesting multiple properties');
    const response2 = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Boiling+Point,Melting+Point,Flash+Point`,
      { timeout: 10000 }
    );
    console.log('Status:', response2.status);
    console.log('Has Record:', !!response2.data.Record);
    if (response2.data.Record) {
      console.log('Number of sections:', response2.data.Record.Section?.length);
      fs.writeFileSync('pubchem-multiple-props.json', JSON.stringify(response2.data, null, 2));
      console.log('Saved to: pubchem-multiple-props.json\n');
    }

    // Test 3: No heading parameter (get all)
    console.log('Test 3: Requesting all sections (no heading filter)');
    const response3 = await axios.get(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON`,
      { timeout: 10000 }
    );
    console.log('Status:', response3.status);
    console.log('Has Record:', !!response3.data.Record);
    if (response3.data.Record) {
      console.log('Number of sections:', response3.data.Record.Section?.length);

      // Show all top-level headings
      console.log('\nAll available headings:');
      response3.data.Record.Section.forEach(section => {
        console.log(`  - ${section.TOCHeading}`);
      });

      fs.writeFileSync('pubchem-all-sections.json', JSON.stringify(response3.data, null, 2));
      console.log('\nSaved to: pubchem-all-sections.json');
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPubChem();
