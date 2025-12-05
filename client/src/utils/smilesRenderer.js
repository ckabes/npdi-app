/**
 * SMILES to SVG Renderer
 * Converts SMILES notation to chemical structure diagrams
 * Following ACS 1996 graphics guidelines
 */

/**
 * Atom class representing a single atom in the molecule
 */
class Atom {
  constructor(element, index) {
    this.element = element; // Element symbol (C, N, O, etc.)
    this.index = index; // Unique index in molecule
    this.aromatic = false; // Is this atom aromatic?
    this.charge = 0; // Formal charge
    this.hydrogens = 0; // Explicit hydrogen count
    this.isotope = null; // Isotope number
    this.stereochemistry = null; // @ or @@
    this.x = 0; // 2D x coordinate
    this.y = 0; // 2D y coordinate
    this.bonds = []; // Array of Bond objects
    this.ringNumbers = []; // Ring closure markers
  }

  /**
   * Add a bond to this atom
   */
  addBond(bond) {
    this.bonds.push(bond);
  }

  /**
   * Get number of bonds (valence)
   */
  getBondCount() {
    return this.bonds.reduce((sum, bond) => sum + bond.order, 0);
  }

  /**
   * Calculate implicit hydrogen count
   */
  getImplicitHydrogens() {
    if (this.hydrogens > 0) return this.hydrogens;

    const valenceBonds = this.getBondCount();
    const normalValence = {
      'C': 4, 'N': 3, 'O': 2, 'S': 2, 'P': 3, 'F': 1, 'Cl': 1, 'Br': 1, 'I': 1
    };

    const maxValence = normalValence[this.element] || 0;
    return Math.max(0, maxValence - valenceBonds - Math.abs(this.charge));
  }
}

/**
 * Bond class representing a bond between two atoms
 */
class Bond {
  constructor(atom1, atom2, order = 1, stereo = null) {
    this.atom1 = atom1; // First atom
    this.atom2 = atom2; // Second atom
    this.order = order; // 1=single, 2=double, 3=triple, 1.5=aromatic
    this.stereo = stereo; // null, 'up' (/), 'down' (\)
    this.aromatic = false; // Is this an aromatic bond?
  }
}

/**
 * Molecule class representing the complete molecular structure
 */
class Molecule {
  constructor() {
    this.atoms = [];
    this.bonds = [];
  }

  addAtom(atom) {
    this.atoms.push(atom);
    return atom;
  }

  addBond(bond) {
    this.bonds.push(bond);
    bond.atom1.addBond(bond);
    bond.atom2.addBond(bond);
    return bond;
  }

  /**
   * Find atom by index
   */
  getAtom(index) {
    return this.atoms.find(a => a.index === index);
  }
}

/**
 * SMILES Parser
 */
class SMILESParser {
  constructor(smiles) {
    this.smiles = smiles;
    this.position = 0;
    this.molecule = new Molecule();
    this.currentAtom = null;
    this.previousAtom = null;
    this.atomStack = []; // For handling branches
    this.ringClosures = {}; // Track ring opening/closing
    this.atomIndex = 0;
  }

  /**
   * Parse the SMILES string
   */
  parse() {
    while (this.position < this.smiles.length) {
      const char = this.smiles[this.position];

      if (char === '(') {
        // Start of branch - save current atom
        this.atomStack.push(this.currentAtom);
        this.position++;
      } else if (char === ')') {
        // End of branch - restore saved atom
        this.currentAtom = this.atomStack.pop();
        this.position++;
      } else if (char >= '0' && char <= '9') {
        // Ring closure marker
        this.handleRingClosure(char);
        this.position++;
      } else if (char === '%') {
        // Two-digit ring closure
        this.position++;
        const num = this.smiles.substr(this.position, 2);
        this.handleRingClosure(num);
        this.position += 2;
      } else if (char === '[') {
        // Bracketed atom
        this.parseBracketedAtom();
      } else if (this.isOrganicSubset(char)) {
        // Organic subset atom (no brackets needed)
        this.parseOrganicAtom();
      } else if (char === '=' || char === '#' || char === '-' || char === '/' || char === '\\') {
        // Explicit bond - will be handled when next atom is parsed
        this.position++;
      } else {
        // Unknown character, skip
        this.position++;
      }
    }

    return this.molecule;
  }

  /**
   * Check if character is in organic subset (C, N, O, S, P, F, Cl, Br, I, B, c, n, o, s, p)
   */
  isOrganicSubset(char) {
    const organicAtoms = ['C', 'N', 'O', 'S', 'P', 'F', 'B', 'c', 'n', 'o', 's', 'p'];
    if (organicAtoms.includes(char)) return true;

    // Check for Cl, Br
    if (char === 'C' && this.smiles[this.position + 1] === 'l') return true;
    if (char === 'B' && this.smiles[this.position + 1] === 'r') return true;
    if (char === 'I') return true;

    return false;
  }

  /**
   * Parse organic subset atom (no brackets)
   */
  parseOrganicAtom() {
    let element = this.smiles[this.position];
    let aromatic = (element >= 'a' && element <= 'z');

    // Convert lowercase to uppercase for element symbol
    if (aromatic) {
      element = element.toUpperCase();
    }

    // Check for two-letter elements (Cl, Br)
    if (this.position + 1 < this.smiles.length) {
      const twoChar = element + this.smiles[this.position + 1];
      if (twoChar === 'Cl' || twoChar === 'Br') {
        element = twoChar;
        this.position++;
      }
    }

    const atom = new Atom(element, this.atomIndex++);
    atom.aromatic = aromatic;
    this.molecule.addAtom(atom);

    // Create bond to previous atom if exists
    if (this.currentAtom) {
      const bondOrder = this.getPendingBondOrder();
      const stereo = this.getPendingBondStereo();
      const bond = new Bond(this.currentAtom, atom, bondOrder, stereo);
      bond.aromatic = aromatic && this.currentAtom.aromatic;
      this.molecule.addBond(bond);
    }

    this.currentAtom = atom;
    this.position++;
  }

  /**
   * Parse bracketed atom with details
   */
  parseBracketedAtom() {
    this.position++; // Skip '['

    let isotope = null;
    let element = '';
    let stereo = null;
    let hCount = 0;
    let charge = 0;

    // Parse isotope if present
    while (this.smiles[this.position] >= '0' && this.smiles[this.position] <= '9') {
      isotope = (isotope || 0) * 10 + parseInt(this.smiles[this.position]);
      this.position++;
    }

    // Parse element symbol
    element = this.smiles[this.position];
    let aromatic = (element >= 'a' && element <= 'z');
    if (aromatic) element = element.toUpperCase();
    this.position++;

    // Check for two-letter element
    if (this.smiles[this.position] &&
        this.smiles[this.position] >= 'a' &&
        this.smiles[this.position] <= 'z') {
      element += this.smiles[this.position];
      this.position++;
    }

    // Parse stereochemistry (@, @@)
    if (this.smiles[this.position] === '@') {
      stereo = '@';
      this.position++;
      if (this.smiles[this.position] === '@') {
        stereo = '@@';
        this.position++;
      }
    }

    // Parse hydrogen count (H, H2, H3, etc.)
    if (this.smiles[this.position] === 'H') {
      this.position++;
      hCount = 1;
      if (this.smiles[this.position] >= '0' && this.smiles[this.position] <= '9') {
        hCount = parseInt(this.smiles[this.position]);
        this.position++;
      }
    }

    // Parse charge (+, ++, -, --, +2, -3, etc.)
    if (this.smiles[this.position] === '+' || this.smiles[this.position] === '-') {
      const sign = this.smiles[this.position] === '+' ? 1 : -1;
      this.position++;

      // Check for number
      if (this.smiles[this.position] >= '0' && this.smiles[this.position] <= '9') {
        charge = sign * parseInt(this.smiles[this.position]);
        this.position++;
      } else {
        // Count multiple +/- symbols
        charge = sign;
        while (this.smiles[this.position] === (sign > 0 ? '+' : '-')) {
          charge += sign;
          this.position++;
        }
      }
    }

    // Skip closing bracket
    if (this.smiles[this.position] === ']') {
      this.position++;
    }

    const atom = new Atom(element, this.atomIndex++);
    atom.aromatic = aromatic;
    atom.isotope = isotope;
    atom.stereochemistry = stereo;
    atom.hydrogens = hCount;
    atom.charge = charge;
    this.molecule.addAtom(atom);

    // Create bond to previous atom if exists
    if (this.currentAtom) {
      const bondOrder = this.getPendingBondOrder();
      const bondStereo = this.getPendingBondStereo();
      const bond = new Bond(this.currentAtom, atom, bondOrder, bondStereo);
      bond.aromatic = aromatic && this.currentAtom.aromatic;
      this.molecule.addBond(bond);
    }

    this.currentAtom = atom;
  }

  /**
   * Get pending bond order from previous characters
   */
  getPendingBondOrder() {
    if (this.position > 0) {
      const prevChar = this.smiles[this.position - 1];
      if (prevChar === '=') return 2;
      if (prevChar === '#') return 3;
      if (prevChar === '-') return 1;
    }
    return 1; // Default single bond
  }

  /**
   * Get pending bond stereochemistry
   */
  getPendingBondStereo() {
    if (this.position > 0) {
      const prevChar = this.smiles[this.position - 1];
      if (prevChar === '/') return 'up';
      if (prevChar === '\\') return 'down';
    }
    return null;
  }

  /**
   * Handle ring closure markers
   */
  handleRingClosure(marker) {
    if (this.ringClosures[marker]) {
      // Close the ring - create bond to stored atom
      const ringAtom = this.ringClosures[marker];
      const bondOrder = this.getPendingBondOrder();
      const bond = new Bond(this.currentAtom, ringAtom, bondOrder);

      // Check if both atoms are aromatic
      if (this.currentAtom.aromatic && ringAtom.aromatic) {
        bond.aromatic = true;
        bond.order = 1.5; // Aromatic bond
      }

      this.molecule.addBond(bond);
      delete this.ringClosures[marker];
    } else {
      // Open the ring - store current atom
      this.ringClosures[marker] = this.currentAtom;
    }
  }
}

/**
 * 2D Coordinate Generator
 */
class CoordinateGenerator {
  constructor(molecule) {
    this.molecule = molecule;
    this.bondLength = 30; // Standard bond length in pixels
    this.visited = new Set();
  }

  /**
   * Generate 2D coordinates for all atoms
   */
  generate() {
    if (this.molecule.atoms.length === 0) return;

    // Start with first atom at origin
    const startAtom = this.molecule.atoms[0];
    startAtom.x = 0;
    startAtom.y = 0;
    this.visited.add(startAtom.index);

    // Traverse molecule and assign coordinates
    // Start with angle going to the right (0°) which will create a left-to-right structure
    this.traverseFrom(startAtom, Math.PI);

    // Center the molecule
    this.centerMolecule();

    return this.molecule;
  }

  /**
   * Traverse from an atom and assign coordinates
   */
  traverseFrom(atom, incomingAngle) {
    const neighbors = this.getUnvisitedNeighbors(atom);

    if (neighbors.length === 0) return;

    // Calculate angles for neighbors
    const angles = this.calculateAngles(atom, neighbors.length, incomingAngle);

    neighbors.forEach((neighbor, index) => {
      if (!this.visited.has(neighbor.index)) {
        const angle = angles[index];
        neighbor.x = atom.x + this.bondLength * Math.cos(angle);
        neighbor.y = atom.y + this.bondLength * Math.sin(angle);
        this.visited.add(neighbor.index);

        // Continue traversal
        this.traverseFrom(neighbor, angle + Math.PI); // Opposite direction
      }
    });
  }

  /**
   * Calculate bond angles for neighbors
   * Uses standard chemical drawing conventions
   */
  calculateAngles(atom, numNeighbors, incomingAngle) {
    const angles = [];

    if (numNeighbors === 1) {
      // Continue in same direction (linear chain)
      angles.push(incomingAngle + Math.PI);
    } else if (numNeighbors === 2) {
      // Standard 120° bond angles (sp2/sp3 in 2D)
      // This creates the traditional organic chemistry skeletal structure
      const baseAngle = incomingAngle + Math.PI;
      angles.push(baseAngle - Math.PI / 3); // -60 degrees
      angles.push(baseAngle + Math.PI / 3); // +60 degrees
    } else if (numNeighbors === 3) {
      // sp3-like geometry with 120° spacing
      const baseAngle = incomingAngle + Math.PI;
      angles.push(baseAngle - 2 * Math.PI / 3); // -120 degrees
      angles.push(baseAngle);
      angles.push(baseAngle + 2 * Math.PI / 3); // +120 degrees
    } else {
      // Distribute evenly
      const baseAngle = incomingAngle + Math.PI;
      for (let i = 0; i < numNeighbors; i++) {
        angles.push(baseAngle + (2 * Math.PI * i) / numNeighbors);
      }
    }

    return angles;
  }

  /**
   * Get unvisited neighbor atoms
   */
  getUnvisitedNeighbors(atom) {
    const neighbors = [];
    atom.bonds.forEach(bond => {
      const other = bond.atom1 === atom ? bond.atom2 : bond.atom1;
      if (!this.visited.has(other.index)) {
        neighbors.push(other);
      }
    });
    return neighbors;
  }

  /**
   * Center the molecule in coordinate space
   */
  centerMolecule() {
    if (this.molecule.atoms.length === 0) return;

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.molecule.atoms.forEach(atom => {
      minX = Math.min(minX, atom.x);
      maxX = Math.max(maxX, atom.x);
      minY = Math.min(minY, atom.y);
      maxY = Math.max(maxY, atom.y);
    });

    // Calculate center offset
    const offsetX = -(minX + maxX) / 2;
    const offsetY = -(minY + maxY) / 2;

    // Apply offset
    this.molecule.atoms.forEach(atom => {
      atom.x += offsetX;
      atom.y += offsetY;
    });
  }
}

/**
 * SVG Renderer following ACS guidelines
 */
class SVGRenderer {
  constructor(molecule, options = {}) {
    this.molecule = molecule;
    this.options = {
      width: options.width || 400,
      height: options.height || 400,
      bondWidth: options.bondWidth || 2,
      doubleBondSpacing: options.doubleBondSpacing || 4,
      fontSize: options.fontSize || 14,
      showCarbons: options.showCarbons || false,
      showImplicitHydrogens: options.showImplicitHydrogens || false,
      padding: options.padding || 20
    };
  }

  /**
   * Render molecule to SVG string
   */
  render() {
    if (!this.molecule || this.molecule.atoms.length === 0) {
      return this.createEmptySVG();
    }

    // Calculate bounding box
    const bbox = this.calculateBoundingBox();

    // Calculate scale to fit in viewBox with padding
    const scale = Math.min(
      (this.options.width - 2 * this.options.padding) / (bbox.maxX - bbox.minX || 1),
      (this.options.height - 2 * this.options.padding) / (bbox.maxY - bbox.minY || 1)
    );

    // Build SVG
    let svg = `<svg width="${this.options.width}" height="${this.options.height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${this.options.width/2}, ${this.options.height/2}) scale(${scale})">`;

    // Draw bonds first (behind atoms)
    this.molecule.bonds.forEach(bond => {
      svg += this.renderBond(bond);
    });

    // Draw atoms on top
    this.molecule.atoms.forEach(atom => {
      svg += this.renderAtom(atom);
    });

    svg += '</g></svg>';

    return svg;
  }

  /**
   * Calculate bounding box of molecule
   */
  calculateBoundingBox() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.molecule.atoms.forEach(atom => {
      minX = Math.min(minX, atom.x);
      maxX = Math.max(maxX, atom.x);
      minY = Math.min(minY, atom.y);
      maxY = Math.max(maxY, atom.y);
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * Render a bond
   */
  renderBond(bond) {
    const x1 = bond.atom1.x;
    const y1 = bond.atom1.y;
    const x2 = bond.atom2.x;
    const y2 = bond.atom2.y;

    let svg = '';

    if (bond.order === 1) {
      // Single bond
      if (bond.stereo === 'up') {
        // Wedge bond (filled triangle)
        svg += this.renderWedgeBond(x1, y1, x2, y2);
      } else if (bond.stereo === 'down') {
        // Dashed bond
        svg += this.renderDashedBond(x1, y1, x2, y2);
      } else {
        // Normal single bond
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="${this.options.bondWidth}" />`;
      }
    } else if (bond.order === 2) {
      // Double bond - two parallel lines
      svg += this.renderDoubleBond(x1, y1, x2, y2);
    } else if (bond.order === 3) {
      // Triple bond - three parallel lines
      svg += this.renderTripleBond(x1, y1, x2, y2);
    } else if (bond.aromatic || bond.order === 1.5) {
      // Aromatic bond - dashed line
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="${this.options.bondWidth}" stroke-dasharray="3,2" />`;
    }

    return svg;
  }

  /**
   * Render double bond
   */
  renderDoubleBond(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = -dy * this.options.doubleBondSpacing / length;
    const offsetY = dx * this.options.doubleBondSpacing / length;

    let svg = '';
    svg += `<line x1="${x1 + offsetX/2}" y1="${y1 + offsetY/2}" x2="${x2 + offsetX/2}" y2="${y2 + offsetY/2}" stroke="black" stroke-width="${this.options.bondWidth}" />`;
    svg += `<line x1="${x1 - offsetX/2}" y1="${y1 - offsetY/2}" x2="${x2 - offsetX/2}" y2="${y2 - offsetY/2}" stroke="black" stroke-width="${this.options.bondWidth}" />`;
    return svg;
  }

  /**
   * Render triple bond
   */
  renderTripleBond(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = -dy * this.options.doubleBondSpacing / length;
    const offsetY = dx * this.options.doubleBondSpacing / length;

    let svg = '';
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="${this.options.bondWidth}" />`;
    svg += `<line x1="${x1 + offsetX}" y1="${y1 + offsetY}" x2="${x2 + offsetX}" y2="${y2 + offsetY}" stroke="black" stroke-width="${this.options.bondWidth}" />`;
    svg += `<line x1="${x1 - offsetX}" y1="${y1 - offsetY}" x2="${x2 - offsetX}" y2="${y2 - offsetY}" stroke="black" stroke-width="${this.options.bondWidth}" />`;
    return svg;
  }

  /**
   * Render wedge bond (stereochemistry)
   */
  renderWedgeBond(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const width = 6; // Wedge width at end
    const offsetX = -dy * width / length;
    const offsetY = dx * width / length;

    return `<polygon points="${x1},${y1} ${x2 + offsetX/2},${y2 + offsetY/2} ${x2 - offsetX/2},${y2 - offsetY/2}" fill="black" />`;
  }

  /**
   * Render dashed bond (stereochemistry)
   */
  renderDashedBond(x1, y1, x2, y2) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="${this.options.bondWidth}" stroke-dasharray="4,4" />`;
  }

  /**
   * Render an atom
   */
  renderAtom(atom) {
    let svg = '';

    // Determine if we should show the atom label
    const shouldShowLabel = this.shouldShowAtomLabel(atom);

    if (shouldShowLabel) {
      const label = this.getAtomLabel(atom);
      svg += `<text x="${atom.x}" y="${atom.y}" text-anchor="middle" dominant-baseline="central" font-size="${this.options.fontSize}" font-family="Arial, sans-serif" fill="black">${label}</text>`;

      // Show charge if present
      if (atom.charge !== 0) {
        const chargeLabel = this.getChargeLabel(atom.charge);
        svg += `<text x="${atom.x + 10}" y="${atom.y - 8}" text-anchor="start" font-size="${this.options.fontSize * 0.8}" fill="black">${chargeLabel}</text>`;
      }

      // Note: Hydrogens on heteroatoms are now included in the label itself (OH, NH2, etc.)
      // This follows standard skeletal formula conventions
    }

    return svg;
  }

  /**
   * Determine if atom label should be shown
   */
  shouldShowAtomLabel(atom) {
    // Always show heteroatoms
    if (atom.element !== 'C') return true;

    // Show carbon if explicitly requested
    if (this.options.showCarbons) return true;

    // Show carbon if it has a charge
    if (atom.charge !== 0) return true;

    // Show carbon if it's at a chain end (has only one bond)
    if (atom.bonds.length === 1) return false; // Actually don't show terminal carbons

    // Don't show carbons in chains
    return false;
  }

  /**
   * Get atom label text
   * Following skeletal formula conventions:
   * - Carbons are never labeled (unless showCarbons option is true)
   * - Heteroatoms always labeled with their symbol
   * - Hydrogens on heteroatoms shown as part of label (OH, NH2, etc.)
   */
  getAtomLabel(atom) {
    let label = atom.element;

    if (atom.isotope) {
      label = `${atom.isotope}${label}`;
    }

    // For heteroatoms, add implicit hydrogens to the label
    if (atom.element !== 'C' && atom.element !== 'H') {
      const hCount = atom.getImplicitHydrogens();
      if (hCount > 0) {
        // Standard convention: OH, NH2, SH, etc.
        label += 'H';
        if (hCount > 1) {
          label += hCount;
        }
      }
    }

    return label;
  }

  /**
   * Get charge label
   */
  getChargeLabel(charge) {
    if (charge > 0) {
      return charge === 1 ? '+' : `${charge}+`;
    } else {
      return charge === -1 ? '-' : `${Math.abs(charge)}-`;
    }
  }

  /**
   * Create empty SVG
   */
  createEmptySVG() {
    return `<svg width="${this.options.width}" height="${this.options.height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${this.options.width/2}" y="${this.options.height/2}" text-anchor="middle" fill="gray">No structure</text>
    </svg>`;
  }
}

/**
 * Main API: Parse SMILES and render to SVG
 */
export function smilesToSVG(smiles, options = {}) {
  try {
    // Parse SMILES
    const parser = new SMILESParser(smiles);
    const molecule = parser.parse();

    // Generate 2D coordinates
    const coordGen = new CoordinateGenerator(molecule);
    coordGen.generate();

    // Render to SVG
    const renderer = new SVGRenderer(molecule, options);
    return renderer.render();
  } catch (error) {
    console.error('Error rendering SMILES:', error);
    return `<svg width="${options.width || 400}" height="${options.height || 400}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" text-anchor="middle" fill="red">Error: ${error.message}</text>
    </svg>`;
  }
}

/**
 * Export classes for advanced usage
 */
export {
  Atom,
  Bond,
  Molecule,
  SMILESParser,
  CoordinateGenerator,
  SVGRenderer
};
