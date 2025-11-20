# AI Content Generation Fields - Complete Reference

## CorpBase Form Fields ↔ Admin Configuration

All CorpBase form fields now have corresponding configuration sections in the Admin Dashboard.

### Complete Field Mapping

| CorpBase Form Field | Admin Configuration Section | Parameters | Default Values |
|---------------------|----------------------------|------------|----------------|
| **Product Description** | Product Description | • Prompt Template<br>• Max Words<br>• Temperature | 200 words<br>0.7 temp |
| **Website Title** | Website Title (SEO) | • Prompt Template<br>• Max Characters<br>• Temperature | 70 chars<br>0.5 temp |
| **Meta Description** | Meta Description (SEO) | • Prompt Template<br>• Max Characters<br>• Temperature | 160 chars<br>0.6 temp |
| **Key Features & Benefits** | Key Features & Benefits | • Prompt Template<br>• Bullet Count<br>• Words/Bullet<br>• Temperature | 5 bullets<br>10 words/bullet<br>0.6 temp |
| **Applications** | Applications | • Prompt Template<br>• Item Count<br>• Temperature | 4 items<br>0.6 temp |
| **Target Industries** | Target Industries | • Prompt Template<br>• Item Count<br>• Temperature | 4 items<br>0.5 temp |

## Configuration Location

**Admin Dashboard → System Settings → AI Content Generation**

### Sections Available:

1. **Azure OpenAI API Configuration**
   - Enable/Disable
   - API Key
   - Environment (dev/test/staging/prod)
   - API Version
   - Model/Deployment Name
   - Max Tokens
   - Timeout
   - Test Connection button

2. **AI Prompt Configuration** (6 sections)
   - Product Description
   - Website Title (SEO)
   - Meta Description (SEO)
   - Key Features & Benefits  *newly added*
   - Applications  *newly added*
   - Target Industries  *newly added*

## Each Prompt Section Includes:

- **Enable/Disable checkbox** - Turn individual prompts on/off
- **Prompt Template** - Customizable prompt with variable placeholders
- **Configuration Parameters** - Field-specific settings
- **Temperature Control** - Creativity/randomness (0-2)

## Available Template Variables

Use these placeholders in any prompt template:

- `{productName}` - Product name
- `{casNumber}` - CAS registry number
- `{molecularFormula}` - Molecular formula
- `{molecularWeight}` - Molecular weight
- `{iupacName}` - IUPAC name
- `{sbu}` - Strategic Business Unit
- `{maxWords}` - Maximum word count (for description)
- `{maxChars}` - Maximum characters (for titles/meta)
- `{bulletCount}` - Number of bullets (for features)
- `{wordsPerBullet}` - Words per bullet (for features)
- `{itemCount}` - Number of items (for applications/industries)

## Default Prompts

### Product Description
```
You are a technical content writer for MilliporeSigma, a leading life science company.
Generate a professional, informative product description for {productName}
(CAS: {casNumber}, Formula: {molecularFormula}). Include: brief introduction of the compound,
key chemical properties and characteristics, primary applications in research/industry,
quality and purity highlights, and mention of available package sizes.
Tone: Professional, scientific, but accessible.
Target audience: Research scientists and laboratory professionals.
Maximum {maxWords} words.
```

### Website Title
```
Create an SEO-optimized webpage title for {productName}.
Include the product name and "MilliporeSigma" brand.
Keep it under {maxChars} characters.
Make it compelling for search engines while remaining accurate.
```

### Meta Description
```
Write a compelling meta description for {productName} (CAS: {casNumber}).
Highlight key benefits: high purity, research quality, multiple sizes.
Target researchers searching for this chemical.
Maximum {maxChars} characters.
```

### Key Features & Benefits
```
Generate {bulletCount} concise bullet points highlighting key features and benefits
of {productName} for MilliporeSigma's product page. Focus on: quality/purity specifications,
packaging and availability, application suitability, reliability and support.
Format as bullet points, {wordsPerBullet} words each maximum.
Return as newline-separated list with bullet points (•).
```

### Applications
```
List {itemCount} specific research or industrial applications for {productName}
(Formula: {molecularFormula}). Be specific about the scientific fields or processes.
Return as newline-separated list.
```

### Target Industries
```
Identify {itemCount} primary industries or research sectors that would use {productName}
(CAS: {casNumber}). Examples: Pharmaceutical R&D, Biotechnology, Academic Research,
Chemical Manufacturing, etc. Return as comma-separated text only, no additional explanation.
```

## Temperature Guide

| Temperature | Behavior | Best For |
|-------------|----------|----------|
| 0.0 - 0.3 | Very deterministic | SEO titles, technical specs |
| 0.4 - 0.7 | Balanced | Product descriptions, features |
| 0.8 - 1.2 | Creative | Marketing copy, varied content |
| 1.3 - 2.0 | Very creative | Brainstorming (not recommended for production) |

**Recommended Settings:**
- Product Description: 0.7
- Website Title: 0.5 (more consistent)
- Meta Description: 0.6
- Key Features: 0.6
- Applications: 0.6
- Target Industries: 0.5 (more consistent)

## How AI Generation Works

1. User clicks "Generate with AI" button in CorpBase form
2. System retrieves product data (name, CAS, formula, etc.)
3. For each enabled prompt:
   - Replaces template variables with actual data
   - Sends request to Azure OpenAI
   - Receives generated content
4. Populates form fields with generated content
5. User can review and edit before saving

## Customization Examples

### Example 1: More Technical Product Descriptions

Change the Product Description prompt to:
```
Generate a highly technical product description for {productName} (CAS: {casNumber},
Formula: {molecularFormula}, MW: {molecularWeight}). Include detailed chemical properties,
synthesis considerations, analytical specifications, and advanced research applications.
Target audience: PhD-level research scientists. Maximum {maxWords} words.
```

### Example 2: More Marketing-Focused Features

Change the Key Features prompt to:
```
Create {bulletCount} compelling marketing bullets for {productName}, focusing on competitive
advantages, unique selling points, and customer benefits. Each bullet should be persuasive
and {wordsPerBullet} words maximum. Use bullet points (•).
```

### Example 3: Industry-Specific Applications

Change the Applications prompt to:
```
List {itemCount} specific applications for {productName} in pharmaceutical drug development,
including formulation, synthesis, quality control, and research applications.
Be specific about the drug development stages.
```

## Troubleshooting

### Field Not Generating
1. Check if the prompt is enabled (checkbox)
2. Verify Azure OpenAI is enabled and configured
3. Check API key is valid
4. Test connection in Admin Dashboard

### Content Quality Issues
1. Adjust temperature (lower = more factual, higher = more creative)
2. Customize the prompt template
3. Adjust length parameters (maxWords, maxChars, etc.)
4. Try different model (gpt-4o for higher quality vs gpt-4o-mini)

### Missing Fields in Form
All 6 CorpBase fields are now configurable in Admin Dashboard. If you don't see them:
1. Refresh the page
2. Clear browser cache
3. Check that you're on the "AI Content Generation" section
4. Verify you have admin permissions

## Field Alignment Summary

  **All CorpBase form fields now have corresponding Admin configuration sections**

Before the update:
-   Key Features & Benefits - NOT configurable
-   Applications - NOT configurable
-   Target Industries - NOT configurable

After the update:
-   Product Description - Configurable
-   Website Title - Configurable
-   Meta Description - Configurable
-   Key Features & Benefits - Configurable
-   Applications - Configurable
-   Target Industries - Configurable

All fields are now fully aligned! 
