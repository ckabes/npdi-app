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
    this.bondLength = 30; // Standard bond length in pixels (approx. 14.4pt ACS 1996)
    this.visited = new Set();
    this.chainAngle = Math.PI / 3; // 60 degrees - creates 120° internal angle (ACS 1996 standard)
    this.zigzagDirection = 1; // Alternates between 1 and -1 for up/down zigzag
    this.ringAtoms = new Set(); // Track atoms that are part of rings
  }

  /**
   * Detect atoms that are part of rings
   */
  detectRings() {
    this.ringAtoms.clear();

    // Find all atoms involved in rings by detecting cycles in the bond graph
    this.molecule.atoms.forEach(atom => {
      if (this.isInRing(atom)) {
        this.ringAtoms.add(atom.index);
      }
    });
  }

  /**
   * Check if an atom is part of a ring using depth-first search
   */
  isInRing(startAtom) {
    const visited = new Set();
    const recStack = new Set();

    const dfs = (atom, parent) => {
      visited.add(atom.index);
      recStack.add(atom.index);

      for (const bond of atom.bonds) {
        const neighbor = bond.atom1 === atom ? bond.atom2 : bond.atom1;

        if (!visited.has(neighbor.index)) {
          if (dfs(neighbor, atom)) return true;
        } else if (neighbor !== parent && recStack.has(neighbor.index)) {
          // Found a cycle
          return true;
        }
      }

      recStack.delete(atom.index);
      return false;
    };

    return dfs(startAtom, null);
  }

  /**
   * Generate 2D coordinates for all atoms
   */
  generate() {
    if (this.molecule.atoms.length === 0) return;

    // Detect which atoms are in rings
    this.detectRings();

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
   * Uses ACS 1996 standard: 120° internal bond angles for skeletal formulas
   * Special handling for ring atoms to create proper polygon shapes
   */
  calculateAngles(atom, numNeighbors, incomingAngle) {
    const angles = [];
    const isRingAtom = this.ringAtoms.has(atom.index);

    if (numNeighbors === 1) {
      if (isRingAtom) {
        // Ring atom continuing ring: use ~60° rotation for 6-membered rings
        // This creates a hexagonal pattern (360° / 6 = 60° per vertex)
        const forwardAngle = incomingAngle + Math.PI;
        angles.push(forwardAngle - Math.PI / 3); // Rotate 60° for polygon
      } else {
        // Linear chain: Create zigzag pattern with 120° internal angle
        // Alternate between +60° and -60° to create up/down zigzag
        const forwardAngle = incomingAngle + Math.PI;
        const zigzagAngle = forwardAngle + (this.zigzagDirection * this.chainAngle);
        angles.push(zigzagAngle);

        // Flip direction for next atom in chain
        this.zigzagDirection *= -1;
      }
    } else if (numNeighbors === 2) {
      if (isRingAtom) {
        // Ring atom with two neighbors: likely part of ring
        // Use 120° angles to approximate ring shape
        const baseAngle = incomingAngle + Math.PI;
        angles.push(baseAngle - this.chainAngle); // -60 degrees
        angles.push(baseAngle + this.chainAngle); // +60 degrees
      } else {
        // Branching in chain: two bonds at 120° angles
        const baseAngle = incomingAngle + Math.PI;
        angles.push(baseAngle - this.chainAngle); // -60 degrees
        angles.push(baseAngle + this.chainAngle); // +60 degrees
      }
    } else if (numNeighbors === 3) {
      // Tri-substituted: three bonds at 120° spacing
      const baseAngle = incomingAngle + Math.PI;
      angles.push(baseAngle - 2 * Math.PI / 3); // -120 degrees
      angles.push(baseAngle);
      angles.push(baseAngle + 2 * Math.PI / 3); // +120 degrees
    } else {
      // Multiple substituents: distribute evenly
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
      padding: options.padding || 20,
      bondMargin: options.bondMargin || 6 // Gap between bond and atom label (increased for better visibility)
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
   * Includes extra space for atom labels (especially heteroatoms)
   */
  calculateBoundingBox() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.molecule.atoms.forEach(atom => {
      // Account for atom position
      let atomMinX = atom.x;
      let atomMaxX = atom.x;
      let atomMinY = atom.y;
      let atomMaxY = atom.y;

      // If atom has a label, account for label width/height
      if (this.shouldShowAtomLabel(atom)) {
        const label = this.getAtomLabel(atom);
        // Estimate label width: ~7px per character for 14pt font
        const labelWidth = label.length * (this.options.fontSize * 0.5);
        const labelHeight = this.options.fontSize;

        // Labels are center-anchored, so extend in both directions
        atomMinX -= labelWidth / 2;
        atomMaxX += labelWidth / 2;
        atomMinY -= labelHeight / 2;
        atomMaxY += labelHeight / 2;
      }

      minX = Math.min(minX, atomMinX);
      maxX = Math.max(maxX, atomMaxX);
      minY = Math.min(minY, atomMinY);
      maxY = Math.max(maxY, atomMaxY);
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * Adjust bond coordinates to account for atom label margin
   * Shortens bond at each end if atom has a visible label
   */
  adjustBondForLabels(x1, y1, x2, y2, atom1, atom2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x1, y1, x2, y2 };

    const ux = dx / length; // Unit vector x
    const uy = dy / length; // Unit vector y

    let newX1 = x1;
    let newY1 = y1;
    let newX2 = x2;
    let newY2 = y2;

    // Shorten bond at atom1 end if it has a label
    if (this.shouldShowAtomLabel(atom1)) {
      newX1 = x1 + ux * this.options.bondMargin;
      newY1 = y1 + uy * this.options.bondMargin;
    }

    // Shorten bond at atom2 end if it has a label
    if (this.shouldShowAtomLabel(atom2)) {
      newX2 = x2 - ux * this.options.bondMargin;
      newY2 = y2 - uy * this.options.bondMargin;
    }

    return { x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
  }

  /**
   * Render a bond
   */
  renderBond(bond) {
    // Adjust bond coordinates for label margins
    const adjusted = this.adjustBondForLabels(
      bond.atom1.x, bond.atom1.y,
      bond.atom2.x, bond.atom2.y,
      bond.atom1, bond.atom2
    );

    const { x1, y1, x2, y2 } = adjusted;

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
