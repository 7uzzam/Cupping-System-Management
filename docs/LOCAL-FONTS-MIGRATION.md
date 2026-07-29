# Local Fonts Migration

## Summary

Migrated all Google Fonts (Tajawal, Cairo, Inter) from external CDN to bundled local woff2 files. The application now loads all fonts from `assets/fonts/` without any network requests.

## Fonts Added

| Font | Weights | Subsets | Files | Total Size |
|------|---------|--------|-------|------------|
| Tajawal | 300, 400, 500, 700, 800, 900 | Arabic, Latin | 12 | ~114 KB |
| Cairo | 300–900 (variable) | Arabic, Latin, Latin-Ext | 3 | ~81 KB |
| Inter | 400–800 (variable) | Latin, Latin-Ext | 2 | ~133 KB |
| **Total** | | | **17 files** | **~328 KB** |

## Changes Made

### 1. Removed Google Fonts CDN references
- `index.html` line 7: Removed `<link href="https://fonts.googleapis.com/...">` 
- `index.html` thermal print template: Replaced CDN link with inline `@font-face`
- `index.html` A4 report template: Replaced CDN link with inline `@font-face`

### 2. Added local @font-face declarations
- 12 declarations for Tajawal (6 weights × 2 subsets)
- 3 declarations for Cairo (variable font, 3 subsets)
- 2 declarations for Inter (variable font, 2 subsets)
- All use `font-display: swap` for consistent behavior with original
- Unicode-range subsetting preserved for optimal loading

### 3. Print templates
- Thermal print template: 6 inline `@font-face` declarations (Tajawal 400/700/900)
- A4 report template: 6 inline `@font-face` declarations (Tajawal 400/700/900)
- Print windows load fonts from `./assets/fonts/` relative to index.html

### 4. CSP unchanged
- `font-src 'self' data:` already allows local fonts
- No external domains added to any CSP directive
- All security hardening from Phase 2 preserved

## License Compliance

All fonts are licensed under the **SIL Open Font License 1.1** (OFL), which permits:
- Bundling in commercial applications
- Redistribution
- Modification

Full license documentation: `assets/fonts/LICENSES.md`
