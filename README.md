# Badge and Placard Generator

A web-based tool for generating printable name badges and placards for Model United Nations (MUN) conferences. Upload tabular data (CSV, XLSX, or Google Sheets) and generate professional PDFs ready for printing.

## Features

- **Three PDF templates**
  - Horizontal badge (85mm × 55mm) — for pinning
  - Vertical badge (55mm × 85mm) — for lanyards
  - Placard (A4 landscape) — table display with fold line
- **Multiple input formats**
  - CSV files
  - Excel spreadsheets (XLSX)
  - Google Sheets (via public link)
- **Built-in customization**
  - Country flags from ISO alpha-2 codes
  - Custom images via image library
  - Media consent indicators
  - Optional barcode generation from ID field
- **External integration** via token-based session API

---

## For Users

### Using the Hosted Version

Visit [badges.dmun.de](https://badges.dmun.de) to use the generator directly.

### Input Data Format

Your data source (CSV, XLSX, or Google Sheets) should contain these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `name` | Yes | Person's full name |
| `countryName` | Yes | Display name (e.g., "Deutschland", "France") |
| `countryAlpha2Code` | No* | ISO 3166-1 alpha-2 code (e.g., "DE", "FR") or "UN" |
| `alternativeImage` | No* | Custom image name from the image library |
| `committee` | No | Committee name (shown in parentheses after name) |
| `pronouns` | No | Pronouns (e.g., "sie/ihr", "he/him") |
| `id` | No | ID number (generates barcode on vertical badges) |
| `mediaConsentStatus` | No | `NOT_SET`, `NOT_ALLOWED`, `PARTIALLY_ALLOWED`, `ALLOWED_ALL` |

*Either `countryAlpha2Code` or `alternativeImage` must be provided for each row.

### External Integration

To link users from your application to the badge generator with pre-filled data, use the token-based session API. This approach protects PII by using short-lived opaque tokens instead of exposing data in URL parameters.

#### HTML Form (Recommended)

The simplest integration method — no JavaScript required:

```html
<form action="https://badges.dmun.de/api/session/create" method="POST">
  <input type="hidden" name="name" value="Max Mustermann">
  <input type="hidden" name="countryName" value="Deutschland">
  <input type="hidden" name="countryAlpha2Code" value="DE">
  <input type="hidden" name="committee" value="Generalversammlung">
  <input type="hidden" name="pronouns" value="er/ihm">
  <input type="hidden" name="id" value="12345">
  <input type="hidden" name="mediaConsentStatus" value="ALLOWED_ALL">
  <button type="submit">Badge erstellen</button>
</form>
```

The form POST creates a session and redirects the user to `/?t={token}` with the form pre-filled.

#### JSON API (for JavaScript apps)

For applications that need programmatic access:

```javascript
async function openBadgeGenerator(userData) {
  const response = await fetch('https://badges.dmun.de/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const { token, url } = await response.json();
  window.location.href = url;
}
```

#### Token Expiry

Session tokens expire after 15 minutes for privacy protection. Users will see a warning if they try to use an expired link.

---

## For Developers

### Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0+)
- Node.js 18+ (optional, for npm compatibility)

### Quick Start

```bash
git clone https://github.com/dmun-ev/badges.git
cd badges
bun install
bun run dev
```

The development server will start at `http://localhost:5173`.

### Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Production build (runs prepareFlags.ts then vite build) |
| `bun run check` | Type checking with svelte-check |
| `bun run check:watch` | Type checking in watch mode |
| `bun run format` | Format code with Prettier |
| `bun run lint` | Check code formatting |
| `bun run preview` | Preview production build |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `3000` |
| `ORIGIN` | Full origin URL for CORS | — |
| `DATA_DIR` | Directory for SQLite database | `./` |

For production deployments behind a reverse proxy, configure your adapter settings for proper header handling.

### Docker Deployment

Build the image:

```bash
docker build -t badges:latest \
  --build-arg VERSION=$(git describe --tags --always) \
  --build-arg SHA=$(git rev-parse --short HEAD) \
  .
```

Run the container:

```bash
docker run -d \
  -p 3000:3000 \
  -v badges-data:/app/data \
  -e ORIGIN=https://badges.yourdomain.com \
  badges:latest
```

The `/app/data` volume persists the SQLite database for custom images.

---

## Customization Guide

This section explains how to fork and adapt the project for your own organization.

### Adding a New Brand

Follow these steps to add your organization's branding:

#### 1. Add Logo Files

Place your logo files in the `static/logo/` directory:

```
static/logo/
├── color/
│   └── your-brand.png      # Main logo (square, ~200×200px recommended)
└── watermark/
    └── your-brand.png      # Watermark for placards (same dimensions)
```

#### 2. Update the Brand Type

Edit `src/lib/types.ts` and add your brand to the union type:

```typescript
export type Brand = 'MUN-SH' | 'MUNBW' | 'DMUN' | 'UN' | 'YOUR-BRAND';
```

#### 3. Configure Brand Info

Edit `src/lib/pdfCommon.ts` and add a case to the `getBrandInfo` function:

```typescript
case 'YOUR-BRAND':
  brandLogo = '/logo/color/your-brand.png';
  primaryColor = '#FF5500';  // Your brand color (hex)
  conferenceName = `Your Conference ${new Date().getFullYear()}`;
  break;
```

#### 4. Add Watermark Handling (for Placards)

Edit `src/lib/placardGeneration.ts` and add a case to the watermark switch statement (around line 97):

```typescript
case 'YOUR-BRAND':
  brandLogo = '/logo/watermark/your-brand.png';
  break;
```

#### 5. Add UI Tab

Edit `src/routes/Preview.svelte` and add an entry to the `brandingTabs` array:

```typescript
const brandingTabs = [
  { title: 'MUN-SH', value: 'MUN-SH', icon: 'fa-solid fa-tag' },
  { title: 'MUNBW', value: 'MUNBW', icon: 'fa-solid fa-tag' },
  { title: 'DMUN', value: 'DMUN', icon: 'fa-solid fa-tag' },
  { title: 'United Nations', value: 'UN', icon: 'fa-solid fa-globe' },
  { title: 'Your Brand', value: 'YOUR-BRAND', icon: 'fa-solid fa-tag' }  // Add this
] as const;
```

### Removing DMUN-Specific Elements

If you want to remove Deutsche Model United Nations branding entirely:

1. **Remove unwanted brands** from `src/lib/types.ts` (Brand type) and related switch statements
2. **Remove the hardcoded DMUN logo** on vertical badges:
   - In `src/lib/verticalBadgeGeneration.ts`, remove lines 96 and 188-204 which fetch and draw `small_dmun.png` at the bottom of badges
3. **Update the default brand** in `src/routes/Preview.svelte` (line 24):
   ```typescript
   const brandState = persistedState<Brand>('badge-generator-brand', 'YOUR-BRAND');
   ```
4. **Delete unused logo files** from `static/logo/`

### Changing UI Language

The user interface is written in German. To translate:

1. Search for German text strings in `src/routes/` components
2. Replace with your preferred language
3. Update validation messages in `src/lib/tableSchema.ts`

Key files with translatable strings:
- `src/routes/Start.svelte` — form labels and instructions
- `src/routes/Preview.svelte` — tab labels
- `src/lib/tableSchema.ts` — validation error messages
- `src/lib/pdfCommon.ts` — warning messages

---

## Architecture Overview

```
Input (CSV/XLSX/Google Sheets)
    → Start.svelte (data upload + validation)
    → Zod schema validation (tableSchema.ts)
    → Preview.svelte (select PDF type + brand)
    → PDFPreviewer.svelte (orchestrates generation)
    → PDF Generator (placardGeneration.ts / verticalBadgeGeneration.ts / horizontalBadgeGeneration.ts)
    → Download
```

### Key Modules

| Module | Purpose |
|--------|---------|
| `src/lib/tableSchema.ts` | Zod schema for input data validation |
| `src/lib/pdfCommon.ts` | Shared PDF utilities and brand configuration |
| `src/lib/placardGeneration.ts` | A4 placard generator (2-sided design) |
| `src/lib/verticalBadgeGeneration.ts` | 55mm × 85mm lanyard badge |
| `src/lib/horizontalBadgeGeneration.ts` | 85mm × 55mm pin badge |
| `src/lib/stores/` | Svelte 5 stores for progress and warnings |
| `src/routes/api/img/` | Custom image upload/retrieval API |

For detailed developer documentation, see `CLAUDE.md`.

---

## FAQ

### Why does the project not supply an arm64 image?

SQLite needs to be compiled from source on arm64 systems. Since we don't deploy on arm64 systems yet, we took the easy way out and built the image for amd64 systems only. Please open an issue if you need an arm64 image.

### How do I add my own organization's branding?

See the [Customization Guide](#customization-guide) above for step-by-step instructions on adding new brands, including logo files, type definitions, and UI elements.

### Can I remove unused brands?

Yes. Remove the brand from the `Brand` type in `src/lib/types.ts`, delete the corresponding cases from switch statements in `pdfCommon.ts` and `placardGeneration.ts`, remove the UI tab entry from `Preview.svelte`, and delete the unused logo files from `static/logo/`.

### How do I deploy behind a reverse proxy?

Configure your proxy to forward the appropriate headers (X-Forwarded-Host, X-Forwarded-Proto) and set the `ORIGIN` environment variable to your public URL.

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with improvements. Feel free to reach out to the maintainers for any questions or concerns.

---

## License

This project is licensed under the [MIT License](LICENSE).
