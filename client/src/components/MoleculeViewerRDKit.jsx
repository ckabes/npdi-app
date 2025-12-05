import React, { useEffect, useRef, useState } from 'react';

/**
 * MoleculeViewerRDKit Component
 * Professional molecular structure rendering using RDKit-JS
 *
 * Rendering Standards:
 * - Follows skeletal formula conventions (heteroatoms labeled, carbons unlabeled)
 * - Monochrome rendering (all black structures on white background)
 * - RDKit core color settings: symbolColour, backgroundColour, legendColour
 * - SVG post-processing ensures comprehensive monochrome output
 * - Bond length: 30px (approximates ACS 1996 14.4pt standard)
 * - Privacy: 100% client-side rendering via WebAssembly, no external data transmission
 *
 * ACS 1996 Compliance:
 * - Professional skeletal formula conventions
 * - Appropriate bond angles for sp2 (120°) and sp3 geometries
 * - Heteroatom labeling with implicit hydrogens (OH, NH2, etc.)
 * - Stereochemistry visualization (wedge/dash bonds)
 * - Ring systems with proper geometry
 *
 * @param {string} smiles - SMILES notation string
 * @param {number} width - SVG width in pixels (default: 300)
 * @param {number} height - SVG height in pixels (default: 300)
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

      // Straighten depiction to align bonds at 30-degree multiples
      // This ensures vertical/horizontal lines are properly aligned
      mol.straighten_depiction();

      // Generate SVG with specified dimensions
      // Use RDKit core color settings for true monochrome rendering
      let svg = mol.get_svg_with_highlights(JSON.stringify({
        width: width,
        height: height,
        bondLineWidth: 2,
        addAtomIndices: false,
        addBondIndices: false,
        explicitMethyl: false,
        // ACS 1996-like settings
        fixedBondLength: 30,
        rotate: 10,  // Rotate clockwise slightly for better alignment
        // Atom label spacing (fraction of font size, default: 0.066)
        additionalAtomLabelPadding: 0.18,
        // Monochrome color settings (RGB values 0-1)
        backgroundColour: [1, 1, 1],  // White background
        symbolColour: [0, 0, 0],      // Black atom symbols
        legendColour: [0, 0, 0],      // Black legends
        // Use standard skeletal formula conventions
        includeMetadata: false
      }));

      // Force all non-white/non-transparent colors to black for true monochrome rendering
      // Comprehensive color replacement to handle all SVG color formats

      // Function to check if color is white or should be preserved
      const shouldPreserveColor = (color) => {
        const normalized = color.toLowerCase().replace(/\s/g, '');
        return normalized === '#fff' ||
               normalized === '#ffffff' ||
               normalized === 'white' ||
               normalized === 'none' ||
               normalized.includes('transparent');
      };

      // Replace hex colors in fill attributes, but preserve white
      svg = svg.replace(/fill='(#[0-9A-Fa-f]{3,6})'/gi, (match, color) => {
        return shouldPreserveColor(color) ? match : "fill='#000000'";
      });
      svg = svg.replace(/fill="(#[0-9A-Fa-f]{3,6})"/gi, (match, color) => {
        return shouldPreserveColor(color) ? match : 'fill="#000000"';
      });

      // Replace hex colors in stroke attributes, but preserve white
      svg = svg.replace(/stroke='(#[0-9A-Fa-f]{3,6})'/gi, (match, color) => {
        return shouldPreserveColor(color) ? match : "stroke='#000000'";
      });
      svg = svg.replace(/stroke="(#[0-9A-Fa-f]{3,6})"/gi, (match, color) => {
        return shouldPreserveColor(color) ? match : 'stroke="#000000"';
      });

      // Replace RGB/RGBA colors in fill (these are usually colored heteroatoms or wedge bonds)
      svg = svg.replace(/fill='(rgba?\([^)]+\))'/gi, "fill='#000000'");
      svg = svg.replace(/fill="(rgba?\([^)]+\))"/gi, 'fill="#000000"');

      // Replace RGB/RGBA colors in stroke
      svg = svg.replace(/stroke='(rgba?\([^)]+\))'/gi, "stroke='#000000'");
      svg = svg.replace(/stroke="(rgba?\([^)]+\))"/gi, 'stroke="#000000"');

      // Handle style attributes with colors (comprehensive)
      svg = svg.replace(/style='([^']*)'/gi, (match, styleContent) => {
        let newStyle = styleContent;
        // Replace fill colors in style
        newStyle = newStyle.replace(/fill:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))/gi, (m, color) => {
          return shouldPreserveColor(color) ? m : 'fill:#000000';
        });
        // Replace stroke colors in style
        newStyle = newStyle.replace(/stroke:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))/gi, (m, color) => {
          return shouldPreserveColor(color) ? m : 'stroke:#000000';
        });
        return `style='${newStyle}'`;
      });

      svg = svg.replace(/style="([^"]*)"/gi, (match, styleContent) => {
        let newStyle = styleContent;
        // Replace fill colors in style
        newStyle = newStyle.replace(/fill:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))/gi, (m, color) => {
          return shouldPreserveColor(color) ? m : 'fill:#000000';
        });
        // Replace stroke colors in style
        newStyle = newStyle.replace(/stroke:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))/gi, (m, color) => {
          return shouldPreserveColor(color) ? m : 'stroke:#000000';
        });
        return `style="${newStyle}"`;
      });

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
