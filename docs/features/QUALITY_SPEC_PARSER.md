# Quality Specifications Natural Language Parser

**Version:** 1.0
**Last Updated:** 2025-12-01
**Status:** Active

## Overview

The Quality Specifications Natural Language Parser is a powerful feature that allows users to enter quality specifications in natural language and automatically converts them into structured table entries. This feature dramatically speeds up the process of defining quality attributes for new product tickets.

## Table of Contents

- [Features](#features)
- [Usage Guide](#usage-guide)
- [Input Formats](#input-formats)
- [Automatic Capitalization](#automatic-capitalization)
- [Default Test Methods](#default-test-methods)
- [Advanced Examples](#advanced-examples)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)

---

## Features

### Core Capabilities

1. **Natural Language Parsing**: Convert free-form text into structured quality specifications
2. **Batch Processing**: Enter multiple specifications at once, separated by commas or "and"
3. **Smart Capitalization**: Automatic proper casing for test names and values
4. **Default Test Methods**: Auto-assignment of common test methods when not specified
5. **Method Extraction**: Intelligent parsing of test methods using "by", "via", or "using" keywords
6. **Live Preview**: Review parsed specifications before adding them to the ticket
7. **Inline Editing**: Edit specifications directly in the table after parsing

### User Benefits

- **Time Savings**: Enter 10+ specifications in seconds instead of minutes
- **Consistency**: Automatic standardization of nomenclature and formatting
- **Reduced Errors**: Smart parsing reduces typos and formatting mistakes
- **Flexibility**: Multiple input formats supported for user convenience

---

## Usage Guide

### Where to Find It

The Quality Spec Parser is located in the **Quality Specifications** section when creating a new product ticket.

Look for the purple/blue gradient box labeled **"Quick Entry"** with an information icon (ℹ️).

### Basic Workflow

1. **Enter Specifications**: Type your quality specifications in the text area
   - Example: `purity ≥99.9% by gc, ph 6.5-7.5, appearance is clear`

2. **Click "Decipher"**: The parser will analyze your input and extract structured data

3. **Review Preview**: A modal window shows the parsed results
   - **Quality Attributes to Add:** Successfully parsed specifications
   - **Failed to Parse:** Any specifications that couldn't be understood

4. **Confirm or Cancel**:
   - Click **"Add All to Ticket"** to insert all specifications
   - Click **"Cancel"** to discard and re-enter

5. **Inline Editing** (Optional): After adding, click the pencil icon on any row to edit values directly in the table

### Information Dialog

Click the information icon (ℹ️) next to "Quick Entry" to see detailed help on:
- How to separate multiple specifications
- Supported input formats
- Tips for best results

---

## Input Formats

### Supported Formats

The parser recognizes multiple natural language patterns:

#### 1. Operator-Based Format
Tests with comparison operators (≥, ≤, >, <, =)

**Examples:**
```
purity ≥99.9% by gc
water content ≤50 ppm
ph ≥6.0
assay >98.5% by hplc
```

**Pattern:** `[Test] [Operator] [Value] by/via/using [Method]`

#### 2. Range Format
Tests with numeric ranges

**Examples:**
```
ph 6.5-7.5
melting point 150-155°C
particle size 10-50 μm
```

**Pattern:** `[Test] [MinValue]-[MaxValue] [Unit]`

#### 3. "Is/Are/Was/Were" Format
Tests using connector words

**Examples:**
```
appearance is clear
color is white
form is powder
structure is Conforms by 1HNMR
purity is 99%
```

**Pattern:** `[Test] is/are/was/were [Value] by/via/using [Method]`

#### 4. "Of" Format
Tests using "of" as a separator between test and value

**Examples:**
```
purity of 99.8%
water content of 50 ppm
assay of ≥99%
content of 98-102%
purity of 99% by hplc
water content of ≤0.5% via Karl Fischer
```

**Pattern:** `[Test] of [Value] by/via/using [Method]`

**Note:** The word "of" separates the test attribute from the value. The value comes **after** "of", not before.

#### 5. "Conforms/Confirmed" Format
Conformity tests

**Examples:**
```
structure conforms by 1HNMR
identity confirmed by IR
conforms to structure by 13C NMR
```

**Pattern:** `[Test] conforms/confirmed [to/by] [Method]`

#### 6. Colon Format
Tests separated by a colon

**Examples:**
```
appearance: white powder
color: colorless
odor: odorless
```

**Pattern:** `[Test]: [Value]`

### Method Extraction

The parser intelligently separates test values from test methods using these keywords:
- **by**: `purity ≥99% by gc`
- **via**: `water content ≤50 ppm via Karl Fischer`
- **using**: `identity Confirmed using FTIR`

**Important:** The value **before** the keyword becomes the Value/Range, and the text **after** becomes the Comments/Method.

**Examples:**
- `structure Conforms by 1HNMR` → Value: "Conforms", Method: "1H NMR"
- `purity is 99% by HPLC` → Value: "99%", Method: "HPLC"

### Separating Multiple Specifications

You can enter multiple specifications in a single line using these separators:

| Separator | Example |
|-----------|---------|
| Comma (,) | `purity ≥99%, ph 6.5-7.5, appearance is clear` |
| Semicolon (;) | `purity ≥99%; ph 6.5-7.5; appearance is clear` |
| Pipe (\|) | `purity ≥99% \| ph 6.5-7.5 \| appearance is clear` |
| "and" | `purity ≥99% and ph 6.5-7.5 and appearance is clear` |
| New line | One specification per line |

**Recommended:** Use commas (,) as they are the most natural separator.

---

## Automatic Capitalization

The parser applies intelligent capitalization to ensure consistency:

### Test Attributes

Common test names are automatically capitalized properly:

| You Type | Parser Outputs |
|----------|----------------|
| purity | Purity |
| ph | pH |
| water content | Water Content |
| melting point | Melting Point |
| h2o | H₂O |
| lod | LOD |
| related substances | Related Substances |
| structure conformity | Structure Conformity |

**Default Rule:** If not in the known list, capitalizes the first letter of each word.

### Test Methods

Test methods are capitalized based on their type:

| You Type | Parser Outputs |
|----------|----------------|
| gc | GC |
| hplc | HPLC |
| 1hnmr | 1H NMR |
| 13c nmr | 13C NMR |
| ir | IR |
| ftir | FTIR |
| uv-vis | UV-Vis |
| karl fischer | Karl Fischer |
| icp-ms | ICP-MS |
| visual | Visual |

**Acronyms (≤6 chars):** Automatically converted to uppercase
**Full names:** Proper case with capital first letters

### Values/Ranges

Values are intelligently capitalized based on their content:

**Numeric Values:** Left as-is
- `99%` → `99%`
- `≥99.9%` → `≥99.9%`
- `6.5-7.5` → `6.5-7.5`

**Word Values:** Capitalized
- `clear` → `Clear`
- `colorless` → `Colorless`
- `white powder` → `White Powder`

---

## Default Test Methods

When you don't specify a test method, the parser automatically assigns the most common method for that test type:

| Test Attribute | Auto-Assigned Method |
|----------------|---------------------|
| Purity | HPLC |
| Assay | HPLC |
| Water / Water Content / Moisture | Karl Fischer |
| Structure / Structure Conformity | 1H NMR |
| Identity | IR |
| pH | pH meter |
| Appearance | Visual |
| Color | Visual |
| Form | Visual |
| Odor | Organoleptic |

**Example:**
```
Input:  purity ≥99%
Output: Purity | ≥99% | HPLC (method auto-assigned)
```

**Override:** To use a different method, explicitly specify it:
```
Input:  purity ≥99% by gc
Output: Purity | ≥99% | GC (method explicitly specified)
```

---

## Advanced Examples

### Real-World Use Cases

#### Example 1: Complete Quality Spec Entry
**Input:**
```
purity ≥99.9% by gc, water content ≤50 ppm, appearance is clear, ph 6.5-7.5, structure conforms by 1HNMR
```

**Parsed Output:**

| Test/Attribute | Data Source | Value/Range | Comments |
|----------------|-------------|-------------|----------|
| Purity | QC | ≥99.9% | GC |
| Water Content | QC | ≤50 ppm | Karl Fischer |
| Appearance | QC | Clear | Visual |
| pH | QC | 6.5-7.5 | pH meter |
| Structure | QC | Conforms | 1H NMR |

#### Example 2: High-Purity Chemical (Using "of" Format)
**Input:**
```
purity of 99.8% by hplc, water content of ≤0.5% via Karl Fischer, assay of ≥99%, impurities ≤0.2%, heavy metals ≤10 ppm by icp-ms
```

**Parsed Output:**

| Test/Attribute | Data Source | Value/Range | Comments |
|----------------|-------------|-------------|----------|
| Purity | QC | 99.8% | HPLC |
| Water Content | QC | ≤0.5% | Karl Fischer |
| Assay | QC | ≥99% | HPLC |
| Impurities | QC | ≤0.2% | HPLC |
| Heavy Metals | QC | ≤10 ppm | ICP-MS |

#### Example 3: Physical Properties
**Input:**
```
appearance: white powder, melting point 150-155°C, particle size 10-50 μm by laser diffraction, lod ≤0.5%
```

**Parsed Output:**

| Test/Attribute | Data Source | Value/Range | Comments |
|----------------|-------------|-------------|----------|
| Appearance | QC | White Powder | Visual |
| Melting Point | QC | 150-155°C | Melting point apparatus |
| Particle Size | QC | 10-50 μm | Laser diffraction |
| LOD | QC | ≤0.5% | LOD |

#### Example 4: Structural Confirmation
**Input:**
```
structure is Conforms by 1HNMR, identity Confirmed using FTIR, molecular weight Confirmed by MS
```

**Parsed Output:**

| Test/Attribute | Data Source | Value/Range | Comments |
|----------------|-------------|-------------|----------|
| Structure | QC | Conforms | 1H NMR |
| Identity | QC | Confirmed | FTIR |
| Molecular Weight | QC | Confirmed | MS |

---

## Troubleshooting

### Common Issues

#### Issue 1: Specification Not Parsing
**Problem:** Your specification appears in the "Failed to Parse" section

**Solutions:**
- Check if you're using a supported format (see [Input Formats](#input-formats))
- Ensure operators are typed correctly (use ≥ ≤ or >= <=)
- Verify the specification isn't too complex (keep it simple)
- Try breaking it into multiple simpler specifications

**Example:**
```
❌ Not working: "the purity should be greater than or equal to ninety nine percent"
✅ Working:     "purity ≥99%"
```

#### Issue 2: Method in Wrong Field
**Problem:** Test method appears in the Value instead of Comments field

**Solution:** Use "by", "via", or "using" keywords to separate:
```
❌ Without keyword: "purity 99% gc"        → Value: "99% gc"
✅ With keyword:    "purity 99% by gc"     → Value: "99%", Method: "GC"
```

#### Issue 3: Incorrect Capitalization
**Problem:** Test name or method not capitalized as expected

**Solution:**
- Common terms are automatically normalized (see [Automatic Capitalization](#automatic-capitalization))
- If a specialized term isn't recognized, you can edit it after adding to the table
- Consider requesting addition to the normalization dictionary

#### Issue 4: Value Showing as "is" or "are"
**Problem:** Connector word included in the value

**Solution:** This is a bug in older versions. Ensure you're using the latest version where Pattern 5 properly handles connector words.

**Fixed in v1.0:**
```
✅ "appearance is clear" → Value: "Clear" (not "is clear")
```

### Getting Better Results

**Do's:**
- ✅ Use standard operators: ≥, ≤, >, <, =
- ✅ Separate value and method with "by", "via", or "using"
- ✅ Use commas to separate multiple specifications
- ✅ Keep specifications simple and concise
- ✅ Use standard abbreviations (gc, hplc, nmr)

**Don'ts:**
- ❌ Don't use overly complex sentences
- ❌ Don't mix multiple values in one specification
- ❌ Don't use unusual abbreviations without explanation
- ❌ Don't forget to separate value from method

---

## Technical Details

### Parser Architecture

The Quality Spec Parser is implemented using a pattern-matching approach with the following components:

#### Core Functions

Located in `/client/src/utils/qualitySpecParser.js`:

1. **parseQualitySpec(text)**
   - Main parsing function using 6 regex patterns
   - Returns structured object: `{ testAttribute, valueRange, comments, dataSource }`

2. **parseQualitySpecsBatch(text)**
   - Splits input on separators (comma, semicolon, pipe, "and", newline)
   - Calls `parseQualitySpec()` for each specification
   - Returns results with success/error counts

3. **normalizeTestAttribute(attribute)**
   - Applies proper capitalization to test names
   - Maintains dictionary of 30+ common test terms

4. **normalizeTestMethod(method)**
   - Capitalizes test methods appropriately
   - Handles acronyms (uppercase) vs full names (proper case)
   - Dictionary of 20+ common analytical methods

5. **normalizeValueRange(value)**
   - Capitalizes word values (clear → Clear)
   - Preserves numeric values unchanged (99% → 99%)

6. **normalizeOperator(text)**
   - Converts text operators to symbols
   - "greater than or equal to" → "≥"
   - "less than or equal to" → "≤"

7. **getDefaultTestMethod(testAttribute)**
   - Returns default method for common test types
   - Based on industry standards and common practices

#### Regex Patterns

Six patterns are evaluated in sequence:

1. **Pattern 1**: `Test Operator Value by/via/using Method`
   - Example: `purity ≥99.9% by gc`

2. **Pattern 2**: `Test Operator Value` (no method)
   - Example: `purity ≥99.9%`

3. **Pattern 3**: `Test: Value` or `Test - Value`
   - Example: `appearance: white powder`

4. **Pattern 4**: `Test Value-Value` (range format)
   - Example: `ph 6.5-7.5`

5. **Pattern 5**: `Test is/are/was/were Value [by/via/using Method]`
   - Example: `structure is Conforms by 1HNMR`

6. **Pattern 6**: `Test Value [by/via/using Method]` (simple format)
   - Example: `structure Conforms by 1HNMR`

### UI Components

Located in `/client/src/components/forms/QualitySpecificationsForm.jsx`:

- **Quick Entry Section**: Purple/blue gradient box with textarea
- **Decipher Button**: Triggers parsing via `handleParseNLP()`
- **Preview Modal**: Shows parsed results in table format
- **Inline Editing**: Pencil icon enables row editing with save/cancel

### Data Flow

```
User Input (Natural Language)
    ↓
normalizeOperator() - Convert text operators to symbols
    ↓
parseQualitySpecsBatch() - Split by separators
    ↓
parseQualitySpec() - Pattern matching (x6 patterns)
    ↓
Normalization Functions:
  - normalizeTestAttribute()
  - normalizeValueRange()
  - normalizeTestMethod()
  - getDefaultTestMethod()
    ↓
Structured Output { testAttribute, valueRange, comments, dataSource }
    ↓
Preview Modal (Review)
    ↓
appendQuality() - Add to form array
    ↓
React Hook Form - Save to ticket
```

### File References

- **Parser Logic**: `/client/src/utils/qualitySpecParser.js`
- **UI Component**: `/client/src/components/forms/QualitySpecificationsForm.jsx`
- **Form Pages**:
  - `/client/src/pages/CreateTicket.jsx`
  - `/client/src/pages/TicketDetails.jsx`

### Dependencies

- **React**: UI component framework
- **React Hook Form**: Form state management
- **React Hot Toast**: User notifications
- **Heroicons**: UI icons

---

## Version History

### Version 1.0 (2025-12-01)
- ✅ Initial release with 6 parsing patterns
- ✅ Natural language input with batch processing
- ✅ Smart capitalization for attributes, values, and methods
- ✅ Default test method assignment
- ✅ Method extraction using "by/via/using" keywords
- ✅ Value capitalization (words vs numbers)
- ✅ Live preview with success/error reporting
- ✅ Inline editing capability
- ✅ Information dialog with usage tips

### Known Limitations

1. **Complex Sentences**: Very complex or unusual phrasing may not parse correctly
2. **Ambiguous Inputs**: Some inputs could be interpreted multiple ways
3. **Language**: Only English is supported
4. **Customization**: Normalization dictionaries are currently hardcoded

### Future Enhancements (Potential)

- [ ] User-customizable normalization dictionaries
- [ ] Specification templates for common product types
- [ ] Import from Excel/CSV
- [ ] Export specifications for reuse
- [ ] Multi-language support
- [ ] Pattern learning from user corrections

---

## Best Practices

### For Product Managers

1. **Be Consistent**: Use the same phrasing for similar specifications across products
2. **Use Standard Terms**: Stick to industry-standard test names and methods
3. **Review Before Confirming**: Always check the preview before adding to ticket
4. **Edit If Needed**: Use inline editing to adjust any incorrectly parsed values
5. **Report Issues**: If a specification doesn't parse correctly, note the pattern for future improvement

### For Administrators

1. **Train Users**: Show team members the supported formats and examples
2. **Monitor Patterns**: Track which specifications fail to parse frequently
3. **Request Updates**: If your team uses specialized terms, request addition to normalization dictionaries
4. **Quality Control**: Periodically review tickets to ensure specifications are consistent

---

## Support and Feedback

### Getting Help

- **Usage Questions**: Refer to this documentation
- **Technical Issues**: Contact the NPDI development team
- **Feature Requests**: Submit enhancement requests through your normal channels

### Reporting Issues

When reporting parser issues, please include:

1. **Exact Input**: What you typed in the text area
2. **Expected Output**: What you expected to see
3. **Actual Output**: What the parser produced
4. **Screenshot**: Visual of the preview modal (if applicable)

**Example Report:**
```
Input: "purity ≥99% gc"
Expected: Value="≥99%", Method="GC"
Actual: Value="≥99% gc", Method=(empty)
Issue: Method keyword "by" missing - parser didn't separate
```

---

## Appendix: Complete Normalization Reference

### Test Attribute Dictionary

```
purity → Purity
assay → Assay
identity → Identity
ph → pH
water → Water
water content → Water Content
moisture → Moisture
moisture content → Moisture Content
h2o → H₂O
structure → Structure
structure conformity → Structure Conformity
structural confirmation → Structural Confirmation
related substances → Related Substances
impurities → Impurities
residual solvents → Residual Solvents
heavy metals → Heavy Metals
melting point → Melting Point
mp → MP
particle size → Particle Size
loss on drying → Loss on Drying
lod → LOD
appearance → Appearance
color → Color
form → Form
odor → Odor
solubility → Solubility
```

### Test Method Dictionary

```
gc → GC
hplc → HPLC
tlc → TLC
gc-ms → GC-MS
lc-ms → LC-MS
uplc → UPLC
nmr → NMR
1h nmr / 1hnmr → 1H NMR
13c nmr / 13cnmr → 13C NMR
ir → IR
ftir → FTIR
uv → UV
uv-vis → UV-Vis
ms → MS
icp-ms → ICP-MS
icp-oes → ICP-OES
aas → AAS
dsc → DSC
tga → TGA
sem → SEM
karl fischer → Karl Fischer
visual → Visual
organoleptic → Organoleptic
titration → Titration
ph meter → pH meter
laser diffraction → Laser diffraction
melting point apparatus → Melting point apparatus
```

---

**Document Version:** 1.0
**Last Reviewed:** 2025-12-01
**Next Review:** 2026-03-01
**Maintained By:** NPDI Development Team
