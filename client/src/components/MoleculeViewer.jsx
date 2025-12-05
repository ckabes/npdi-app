import React, { useMemo } from 'react';
import { smilesToSVG } from '../utils/smilesRenderer';

/**
 * MoleculeViewer Component
 * Displays a chemical structure from SMILES notation
 *
 * @param {Object} props
 * @param {string} props.smiles - SMILES notation string
 * @param {number} props.width - SVG width in pixels (default: 300)
 * @param {number} props.height - SVG height in pixels (default: 300)
 * @param {boolean} props.showCarbons - Show carbon atom labels (default: false)
 * @param {boolean} props.showImplicitHydrogens - Show implicit hydrogen counts (default: false)
 * @param {string} props.className - Additional CSS classes
 */
const MoleculeViewer = ({
  smiles,
  width = 300,
  height = 300,
  showCarbons = false,
  showImplicitHydrogens = false,
  className = ''
}) => {
  // Generate SVG from SMILES
  const svg = useMemo(() => {
    if (!smiles || smiles.trim() === '') {
      return null;
    }

    try {
      return smilesToSVG(smiles, {
        width,
        height,
        showCarbons,
        showImplicitHydrogens,
        bondWidth: 2,
        doubleBondSpacing: 4,
        fontSize: 14,
        padding: 20
      });
    } catch (error) {
      console.error('Error rendering SMILES:', error);
      return null;
    }
  }, [smiles, width, height, showCarbons, showImplicitHydrogens]);

  if (!smiles || smiles.trim() === '') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded ${className}`}
        style={{ width, height }}
      >
        <p className="text-gray-400 text-sm">No SMILES code provided</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded ${className}`}
        style={{ width, height }}
      >
        <p className="text-red-600 text-sm">Error rendering structure</p>
      </div>
    );
  }

  return (
    <div
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MoleculeViewer;
