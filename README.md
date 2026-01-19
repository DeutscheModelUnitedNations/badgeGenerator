# Badge and Placard Generator

This repository contains a tool designed to generate Name Badges and Placards for Model United Nations (MUN) Conferences. The project is structured to make it easy to customize and generate tags for various events or purposes just using a tabular data source (csv, xlsx, google sheets link).

## Features

- templates
  - `horizontal badge` - 85mm x 55mm for pinning
  - `vertical badge` - 55mm x 85mm for lanyard
  - `placard` - A4 for table display
- Simple integration
  - `csv` - Comma Separated Values
  - `xlsx` - Excel Spreadsheet
  - `google sheets` - Google Sheets Link
- Custom Image Support: Add a custom image to the badge or use built in flag library
- Easy-to-use interface for generating printable tags

## External Integration

To link users from your app to the badge generator with pre-filled data, use the token-based session API. This approach protects PII by using short-lived opaque tokens instead of exposing data in URL parameters.

### HTML Form (Recommended)

The simplest integration method - no JavaScript required:

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

### JSON API (for JavaScript apps)

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

### Supported Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Person's full name |
| `countryName` | Yes | Display name (e.g., "Deutschland") |
| `countryAlpha2Code` | No* | ISO 3166-1 alpha-2 code or "UN" |
| `alternativeImage` | No* | Custom image name from image library |
| `committee` | No | Committee name |
| `pronouns` | No | Pronouns (e.g., "sie/ihr") |
| `id` | No | ID number |
| `mediaConsentStatus` | No | `NOT_SET`, `NOT_ALLOWED`, `PARTIALLY_ALLOWED`, `ALLOWED_ALL` |

*Either `countryAlpha2Code` or `alternativeImage` should be provided.

### Token Expiry

Links expire after 15 minutes for privacy protection. Users will see a warning if they try to use an expired link.

## FAQ

### Why does the project not supply an arm64 image?
Sqlite3 needs to be installed from source on arm64 systems. Since we don't deploy on arm64 systems yet, we took the easy way out and built the image for amd64 systems only. Please feel free to open an issue if you need an arm64 image.

## Usage

> [!IMPORTANT]
> The project is custom tailored for Conferences of Deutsche Model United Nations and contains logos and corporate identity elements of the organization. To customize the project for your own use, you will need to replace the logos and other elements with your own and adjust the templates as needed.

1. Clone the repository.
2. Customize the configuration or templates as needed.
3. Build the docker image.

## Getting Started

Ensure you have the necessary prerequisites installed. Follow the instructions in the documentation for setup and execution.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with improvements. Feel free to reach out to the maintainers for any questions or concerns.

## License

This project is licensed under the [MIT License](LICENSE).