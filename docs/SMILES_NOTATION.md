# SMILES Notation Guide

## Overview
SMILES (Simplified Molecular Input Line Entry System) is a line notation for describing the structure of chemical species using short ASCII strings.

## Basic Rules

### 1. Atoms
- **Aliphatic atoms**: Written as element symbols: `C`, `N`, `O`, `S`, `P`
- **Aromatic atoms**: Written as lowercase: `c`, `n`, `o`, `s`, `p`
- **Brackets**: Used for:
  - Isotopes: `[13C]`, `[2H]`
  - Charges: `[NH4+]`, `[O-]`, `[Fe+3]`
  - Hydrogen count: `[CH3]`, `[CH2]`
  - Aromatic nitrogen: `[nH]`

### 2. Bonds
- **Single bond**: Implicit (no symbol) or `-`
- **Double bond**: `=`
- **Triple bond**: `#`
- **Aromatic bond**: Implicit in aromatic systems
- **Stereochemistry**: `/` and `\` for cis/trans

### 3. Branches
- **Parentheses**: Enclose branches
- Example: `CC(C)C` is isobutane (propane with methyl branch)
- Multiple branches: `CC(C)(C)C` is neopentane

### 4. Rings/Cycles
- **Digit markers**: Numbers 1-9 mark ring closures
- Example: `C1CCCCC1` is cyclohexane
- Example: `c1ccccc1` is benzene
- Multiple rings: Use different numbers or %10, %11, etc.

### 5. Stereochemistry
- **@ and @@**: Chiral centers
  - `@`: Anticlockwise
  - `@@`: Clockwise
- **/ and \\**: Double bond geometry
  - `/`: Up
  - `\\`: Down
- Example: `C/C=C/C` (E-2-butene)
- Example: `C/C=C\\C` (Z-2-butene)

## Common Examples

### Simple Molecules
- **Methane**: `C`
- **Ethane**: `CC`
- **Propane**: `CCC`
- **Butane**: `CCCC`
- **Isobutane**: `CC(C)C`

### Functional Groups
- **Methanol**: `CO`
- **Ethanol**: `CCO`
- **Acetic acid**: `CC(=O)O`
- **Acetone**: `CC(=O)C`
- **Methylamine**: `CN`

### Aromatic Compounds
- **Benzene**: `c1ccccc1`
- **Toluene**: `Cc1ccccc1`
- **Phenol**: `Oc1ccccc1`
- **Aniline**: `Nc1ccccc1`

### Heterocycles
- **Pyridine**: `c1ccncc1`
- **Furan**: `c1ccoc1`
- **Thiophene**: `c1ccsc1`
- **Imidazole**: `c1cnc[nH]1`

### Complex Molecules
- **Glucose**: `OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O`
- **Caffeine**: `CN1C=NC2=C1C(=O)N(C(=O)N2C)C`
- **Aspirin**: `CC(=O)Oc1ccccc1C(=O)O`

## Parsing Algorithm

### Step 1: Tokenization
1. Read character by character
2. Identify atoms, bonds, branches, and rings
3. Build token stream

### Step 2: Build Molecular Graph
1. Create atom nodes
2. Connect atoms based on bonds
3. Handle branches (push/pop stack)
4. Close rings (connect marked atoms)

### Step 3: Generate 2D Coordinates
1. Start with a reference atom at origin
2. Place next atom at standard bond length
3. Calculate angles (typically 120° for sp2, 109.5° for sp3)
4. Handle rings with appropriate geometry
5. Minimize overlaps

### Step 4: Render to SVG
1. Draw bonds (lines for single, parallel lines for double, etc.)
2. Draw atoms (circles or text labels)
3. Apply ACS styling guidelines
4. Add stereochemistry wedges

## ACS Guidelines Summary (1996)

### Bond Lengths
- Standard length: ~0.5 inches (14.4 pt) at full size
- Consistent across structure

### Bond Angles
- sp3 (tetrahedral): 109.5°
- sp2 (trigonal planar): 120°
- sp (linear): 180°

### Double Bonds
- Parallel lines
- Spacing: ~2 pt
- Centered on bond axis

### Triple Bonds
- Three parallel lines
- Even spacing

### Aromatic Rings
- Circle inside hexagon OR
- Alternating double bonds (Kekulé)

### Atom Labels
- Carbon: Usually implicit (not shown at chain ends)
- Heteroatoms: Always shown (O, N, S, etc.)
- Font: Sans-serif, consistent size

### Stereochemistry
- Wedge bonds: Filled triangle (forward)
- Dashed bonds: Dashed lines (backward)
- Bold lines: In plane (forward)

## Implementation Considerations

### Coordinate Generation
- Use depth-first traversal
- Maintain consistent bond lengths
- Optimize angles for minimal strain
- Handle ring systems specially

### SVG Rendering
- ViewBox scaling for responsiveness
- Clean, semantic SVG elements
- Proper z-ordering (bonds before atoms)
- Accessible labels

### Edge Cases
- Fused rings (naphthalene, steroids)
- Bridged systems
- Spiro compounds
- Large macrocycles
- Multiple stereoisomers

## References
- Weininger, D. (1988). "SMILES, a chemical language and information system"
- Daylight Chemical Information Systems
- ACS Style Guide (1996) - Graphics Guidelines
