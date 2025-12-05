import { smilesToSVG, SMILESParser, Molecule } from '../smilesRenderer';

describe('SMILES Renderer', () => {
  describe('SMILESParser', () => {
    test('parses simple alkanes', () => {
      const parser = new SMILESParser('CCC');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(3);
      expect(molecule.bonds.length).toBe(2);
      expect(molecule.atoms[0].element).toBe('C');
    });

    test('parses methanol', () => {
      const parser = new SMILESParser('CO');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(2);
      expect(molecule.atoms[0].element).toBe('C');
      expect(molecule.atoms[1].element).toBe('O');
    });

    test('parses ethanol', () => {
      const parser = new SMILESParser('CCO');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(3);
      expect(molecule.bonds.length).toBe(2);
    });

    test('parses acetic acid with double bond', () => {
      const parser = new SMILESParser('CC(=O)O');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(4);
      expect(molecule.bonds.length).toBe(3);

      // Find the double bond
      const doubleBond = molecule.bonds.find(b => b.order === 2);
      expect(doubleBond).toBeDefined();
      expect(doubleBond.atom1.element === 'C' || doubleBond.atom2.element === 'C').toBe(true);
      expect(doubleBond.atom1.element === 'O' || doubleBond.atom2.element === 'O').toBe(true);
    });

    test('parses branches (isobutane)', () => {
      const parser = new SMILESParser('CC(C)C');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(4);
      expect(molecule.bonds.length).toBe(3);

      // Center carbon should have 3 bonds
      const centerCarbon = molecule.atoms[1];
      expect(centerCarbon.bonds.length).toBe(3);
    });

    test('parses benzene ring', () => {
      const parser = new SMILESParser('c1ccccc1');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(6);
      expect(molecule.bonds.length).toBe(6);

      // All atoms should be aromatic
      molecule.atoms.forEach(atom => {
        expect(atom.aromatic).toBe(true);
        expect(atom.element).toBe('C');
      });
    });

    test('parses cyclohexane', () => {
      const parser = new SMILESParser('C1CCCCC1');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(6);
      expect(molecule.bonds.length).toBe(6);
    });

    test('parses bracketed atoms with charge', () => {
      const parser = new SMILESParser('[NH4+]');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(1);
      expect(molecule.atoms[0].element).toBe('N');
      expect(molecule.atoms[0].charge).toBe(1);
      expect(molecule.atoms[0].hydrogens).toBe(4);
    });

    test('parses triple bond (acetylene)', () => {
      const parser = new SMILESParser('C#C');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(2);
      expect(molecule.bonds.length).toBe(1);
      expect(molecule.bonds[0].order).toBe(3);
    });

    test('parses pyridine', () => {
      const parser = new SMILESParser('c1ccncc1');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(6);
      expect(molecule.bonds.length).toBe(6);

      // Find nitrogen
      const nitrogen = molecule.atoms.find(a => a.element === 'N');
      expect(nitrogen).toBeDefined();
      expect(nitrogen.aromatic).toBe(true);
    });

    test('parses toluene', () => {
      const parser = new SMILESParser('Cc1ccccc1');
      const molecule = parser.parse();

      expect(molecule.atoms.length).toBe(7);

      // First atom is aliphatic carbon (methyl)
      expect(molecule.atoms[0].aromatic).toBe(false);

      // Ring carbons are aromatic
      for (let i = 1; i < 7; i++) {
        expect(molecule.atoms[i].aromatic).toBe(true);
      }
    });

    test('parses caffeine', () => {
      const parser = new SMILESParser('CN1C=NC2=C1C(=O)N(C(=O)N2C)C');
      const molecule = parser.parse();

      // Caffeine has 14 heavy atoms
      expect(molecule.atoms.length).toBe(14);
      expect(molecule.bonds.length).toBeGreaterThan(0);
    });
  });

  describe('smilesToSVG', () => {
    test('generates SVG for simple molecule', () => {
      const svg = smilesToSVG('CCO');

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('<line'); // Should have bonds
    });

    test('generates SVG for benzene', () => {
      const svg = smilesToSVG('c1ccccc1');

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    test('handles empty SMILES', () => {
      const svg = smilesToSVG('');

      expect(svg).toContain('<svg');
      expect(svg).toContain('No structure');
    });

    test('respects width and height options', () => {
      const svg = smilesToSVG('CCO', { width: 500, height: 400 });

      expect(svg).toContain('width="500"');
      expect(svg).toContain('height="400"');
    });

    test('shows carbons when requested', () => {
      const svg = smilesToSVG('CCC', { showCarbons: true });

      // Should contain carbon labels
      expect(svg).toContain('<text');
    });

    test('handles invalid SMILES gracefully', () => {
      const svg = smilesToSVG('((((', { width: 400, height: 400 });

      expect(svg).toContain('<svg');
      // Should show error or handle gracefully
    });
  });

  describe('Real-world molecules', () => {
    const testMolecules = [
      { name: 'Ethanol', smiles: 'CCO' },
      { name: 'Acetic Acid', smiles: 'CC(=O)O' },
      { name: 'Acetone', smiles: 'CC(=O)C' },
      { name: 'Benzene', smiles: 'c1ccccc1' },
      { name: 'Toluene', smiles: 'Cc1ccccc1' },
      { name: 'Phenol', smiles: 'Oc1ccccc1' },
      { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
      { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' }
    ];

    testMolecules.forEach(({ name, smiles }) => {
      test(`renders ${name}`, () => {
        const svg = smilesToSVG(smiles);

        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).not.toContain('Error');
      });
    });
  });
});
