import React, { useState } from 'react';
import MoleculeViewer from '../components/MoleculeViewer';

/**
 * Molecule Demo Page
 * Interactive demonstration of SMILES rendering
 */
const MoleculeDemo = () => {
  const [customSMILES, setCustomSMILES] = useState('CCO');
  const [showCarbons, setShowCarbons] = useState(false);
  const [showHydrogens, setShowHydrogens] = useState(false);

  const exampleMolecules = [
    {
      category: 'Simple Alkanes',
      molecules: [
        { name: 'Methane', smiles: 'C' },
        { name: 'Ethane', smiles: 'CC' },
        { name: 'Propane', smiles: 'CCC' },
        { name: 'Butane', smiles: 'CCCC' },
        { name: 'Isobutane', smiles: 'CC(C)C' },
        { name: 'Neopentane', smiles: 'CC(C)(C)C' }
      ]
    },
    {
      category: 'Functional Groups',
      molecules: [
        { name: 'Methanol', smiles: 'CO' },
        { name: 'Ethanol', smiles: 'CCO' },
        { name: 'Acetic Acid', smiles: 'CC(=O)O' },
        { name: 'Acetone', smiles: 'CC(=O)C' },
        { name: 'Methylamine', smiles: 'CN' },
        { name: 'Acetylene', smiles: 'C#C' }
      ]
    },
    {
      category: 'Aromatic Compounds',
      molecules: [
        { name: 'Benzene', smiles: 'c1ccccc1' },
        { name: 'Toluene', smiles: 'Cc1ccccc1' },
        { name: 'Phenol', smiles: 'Oc1ccccc1' },
        { name: 'Aniline', smiles: 'Nc1ccccc1' },
        { name: 'Benzoic Acid', smiles: 'O=C(O)c1ccccc1' },
        { name: 'Styrene', smiles: 'C=Cc1ccccc1' }
      ]
    },
    {
      category: 'Heterocycles',
      molecules: [
        { name: 'Pyridine', smiles: 'c1ccncc1' },
        { name: 'Furan', smiles: 'c1ccoc1' },
        { name: 'Thiophene', smiles: 'c1ccsc1' },
        { name: 'Pyrrole', smiles: 'c1cc[nH]c1' },
        { name: 'Imidazole', smiles: 'c1cnc[nH]1' },
        { name: 'Thiazole', smiles: 'c1cncs1' }
      ]
    },
    {
      category: 'Cyclic Compounds',
      molecules: [
        { name: 'Cyclopropane', smiles: 'C1CC1' },
        { name: 'Cyclobutane', smiles: 'C1CCC1' },
        { name: 'Cyclopentane', smiles: 'C1CCCC1' },
        { name: 'Cyclohexane', smiles: 'C1CCCCC1' },
        { name: 'Cyclohexanol', smiles: 'OC1CCCCC1' },
        { name: 'Cyclohexanone', smiles: 'O=C1CCCCC1' }
      ]
    },
    {
      category: 'Common Drugs',
      molecules: [
        { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
        { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
        { name: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O' },
        { name: 'Paracetamol', smiles: 'CC(=O)Nc1ccc(O)cc1' },
        { name: 'Nicotine', smiles: 'CN1CCCC1c2cccnc2' },
        { name: 'Dopamine', smiles: 'NCCc1ccc(O)c(O)c1' }
      ]
    }
  ];

  const handleMoleculeClick = (smiles) => {
    setCustomSMILES(smiles);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SMILES Molecule Visualizer
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of SMILES notation rendering to 2D chemical structures
          </p>
        </div>

        {/* Custom Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Custom SMILES Input
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMILES Notation
                </label>
                <input
                  type="text"
                  value={customSMILES}
                  onChange={(e) => setCustomSMILES(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="Enter SMILES (e.g., CCO for ethanol)"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCarbons}
                    onChange={(e) => setShowCarbons(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show carbon labels</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showHydrogens}
                    onChange={(e) => setShowHydrogens(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show implicit hydrogens</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Examples:</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Ethanol', smiles: 'CCO' },
                    { label: 'Benzene', smiles: 'c1ccccc1' },
                    { label: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
                    { label: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' }
                  ].map(({ label, smiles }) => (
                    <button
                      key={smiles}
                      onClick={() => setCustomSMILES(smiles)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
              <MoleculeViewer
                smiles={customSMILES}
                width={400}
                height={400}
                showCarbons={showCarbons}
                showImplicitHydrogens={showHydrogens}
              />
            </div>
          </div>
        </div>

        {/* Example Molecules Gallery */}
        <div className="space-y-6">
          {exampleMolecules.map(({ category, molecules }) => (
            <div key={category} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {molecules.map(({ name, smiles }) => (
                  <div
                    key={smiles}
                    onClick={() => handleMoleculeClick(smiles)}
                    className="cursor-pointer group"
                  >
                    <div className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all bg-white">
                      <div className="flex items-center justify-center mb-2 bg-gray-50 rounded">
                        <MoleculeViewer
                          smiles={smiles}
                          width={150}
                          height={150}
                          showCarbons={false}
                          showImplicitHydrogens={false}
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-900 text-center truncate">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500 text-center font-mono truncate mt-1">
                        {smiles}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Documentation Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About SMILES Notation
          </h2>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              SMILES (Simplified Molecular Input Line Entry System) is a line notation for
              describing the structure of chemical species using short ASCII strings.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Basic Rules</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Atoms:</strong> Written as element symbols (C, N, O) or lowercase for aromatic (c, n, o)</li>
              <li><strong>Single bonds:</strong> Implicit (no symbol needed)</li>
              <li><strong>Double bonds:</strong> = (equals sign)</li>
              <li><strong>Triple bonds:</strong> # (hash sign)</li>
              <li><strong>Branches:</strong> Enclosed in parentheses ( )</li>
              <li><strong>Rings:</strong> Numbers mark ring closures (e.g., c1ccccc1 for benzene)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm font-mono text-blue-600">CCO</code>
                <span className="text-gray-600 ml-2">→ Ethanol</span>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm font-mono text-blue-600">CC(=O)O</code>
                <span className="text-gray-600 ml-2">→ Acetic Acid</span>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm font-mono text-blue-600">c1ccccc1</code>
                <span className="text-gray-600 ml-2">→ Benzene</span>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <code className="text-sm font-mono text-blue-600">CC(C)C</code>
                <span className="text-gray-600 ml-2">→ Isobutane</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoleculeDemo;
