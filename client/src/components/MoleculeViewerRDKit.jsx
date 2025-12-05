import React, { useEffect, useRef, useState } from 'react';

/**
 * MoleculeViewerRDKit Component
 * Professional molecular structure rendering using RDKit-JS
 *
 * @param {string} smiles - SMILES notation string
 * @param {number} width - SVG width in pixels
 * @param {number} height - SVG height in pixels
 * @param {string} className - Additional CSS classes
 */
const MoleculeViewerRDKit = ({
  smiles,
  width = 300,
  height = 300,
  className = ''
}) => {
  const containerRef = useRef(null);
  const [rdkit, setRDKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize RDKit
  useEffect(() => {
    let mounted = true;

    const initRDKit = async () => {
      try {
        // Load RDKit from CDN
        if (!window.initRDKitModule) {
          // Add script tag to load RDKit
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js';
          script.async = true;

          script.onload = async () => {
            if (!mounted) return;

            try {
              const RDKit = await window.initRDKitModule();
              if (mounted) {
                setRDKit(RDKit);
                setLoading(false);
              }
            } catch (err) {
              console.error('Failed to initialize RDKit:', err);
              if (mounted) {
                setError('Failed to load RDKit library');
                setLoading(false);
              }
            }
          };

          script.onerror = () => {
            if (mounted) {
              setError('Failed to load RDKit script');
              setLoading(false);
            }
          };

          document.head.appendChild(script);
        } else {
          // RDKit script already loaded, just initialize
          try {
            const RDKit = await window.initRDKitModule();
            if (mounted) {
              setRDKit(RDKit);
              setLoading(false);
            }
          } catch (err) {
            console.error('Failed to initialize RDKit:', err);
            if (mounted) {
              setError('Failed to initialize RDKit');
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('RDKit initialization error:', err);
        if (mounted) {
          setError('Unexpected error loading RDKit');
          setLoading(false);
        }
      }
    };

    initRDKit();

    return () => {
      mounted = false;
    };
  }, []);

  // Render molecule when SMILES or RDKit changes
  useEffect(() => {
    if (!rdkit || !smiles || !containerRef.current) {
      return;
    }

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';

      // Validate SMILES is not empty
      if (smiles.trim() === '') {
        containerRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">No structure</div>';
        return;
      }

      // Create molecule from SMILES
      const mol = rdkit.get_mol(smiles);

      if (!mol || !mol.is_valid()) {
        containerRef.current.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #dc2626;">Invalid SMILES: ${smiles}</div>`;
        if (mol) mol.delete();
        return;
      }

      // Generate SVG with specified dimensions
      let svg = mol.get_svg_with_highlights(JSON.stringify({
        width: width,
        height: height,
        bondLineWidth: 2,
        addAtomIndices: false,
        addBondIndices: false,
        explicitMethyl: false,
        // ACS 1996-like settings
        fixedBondLength: 30,
        rotate: 0,
        // Use standard skeletal formula conventions
        includeMetadata: false
      }));

      // Force all colors to black for true monochrome rendering
      // Replace all fill and stroke color attributes with black
      svg = svg.replace(/fill='#[0-9A-Fa-f]{6}'/g, "fill='#000000'");
      svg = svg.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#000000"');
      svg = svg.replace(/stroke='#[0-9A-Fa-f]{6}'/g, "stroke='#000000'");
      svg = svg.replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="#000000"');
      // Also handle RGB format
      svg = svg.replace(/fill='rgb\([^)]+\)'/g, "fill='#000000'");
      svg = svg.replace(/fill="rgb\([^)]+\)"/g, 'fill="#000000"');
      svg = svg.replace(/stroke='rgb\([^)]+\)'/g, "stroke='#000000'");
      svg = svg.replace(/stroke="rgb\([^)]+\)"/g, 'stroke="#000000"');

      // Insert SVG into container
      containerRef.current.innerHTML = svg;

      // Clean up molecule object
      mol.delete();
    } catch (err) {
      console.error('Error rendering SMILES:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #dc2626;">Rendering error</div>`;
      }
    }
  }, [rdkit, smiles, width, height]);

  if (loading) {
    return (
      <div className={className} style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-gray-500">Loading RDKit...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    />
  );
};

export default MoleculeViewerRDKit;
