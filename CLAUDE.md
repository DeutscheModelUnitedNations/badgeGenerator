# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
bun run dev          # Start development server with hot reload
bun run build        # Production build (runs prepareFlags.ts then vite build)
bun run check        # Type checking with svelte-check
bun run check:watch  # Type checking in watch mode
bun run format       # Format code with Prettier
bun run lint         # Check code formatting
bun run preview      # Preview production build
```

## Architecture Overview

This is a **MUN badge and placard PDF generator** built with SvelteKit 2 + Svelte 5. It generates printable name badges and placards from CSV or Excel data.

### Data Flow

```
Input (CSV/XLSX)
    → Start.svelte (data upload)
    → Zod validation (tableSchema.ts)
    → Preview.svelte (select PDF type + brand)
    → PDFPreviewer.svelte (orchestrates generation)
    → PDF Generator module
    → Download
```

### Key Modules

- **`src/lib/tableSchema.ts`** - Zod schema defining input data structure (name, countryName, countryAlpha2Code, alternativeImage, committee, pronouns, mediaConsentStatus)
- **`src/lib/pdfCommon.ts`** - Shared PDF utilities (image fetching, text rendering, brand info)
- **`src/lib/placardGeneration.ts`** - A4 placard generator (2-page design)
- **`src/lib/verticalBadgeGeneration.ts`** - 155.91 x 241mm lanyard badge
- **`src/lib/horizontalBadgeGeneration.ts`** - 241 x 155.91mm pin badge
- **`src/lib/stores/`** - Svelte 5 stores for progress tracking and validation warnings

### PDF Generator Pattern

Each generator uses async class lifecycle:
1. `constructor()` - Initialize
2. `initialize()` - Embed fonts, create page
3. `generateContent()` - Draw images, text, branding
4. `generate()` - Execute lifecycle, return page

### API Routes

- **`/api/img`** - Custom image upload/retrieval (SQLite storage with sharp resizing)

### Supported Brands

MUN-SH, MUNBW, DMUN, UN - logos stored in `static/logo/color/` and `static/logo/watermark/`

### Important Notes

- UI text is in German
- Country flags from flag-icons library in `static/flags/`
- Custom images stored as base64 in SQLite (`db.sqlite`)
- Warning threshold at 80+ rows for browser performance
