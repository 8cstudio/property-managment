# UI language (console)

We use **`next-intl`** with JSON catalogs in `apps/console/messages/`. Supported locales: **en-GB**, **fr-FR**, **es-ES**, **pl-PL**. Locale is stored in the **`ezzi-locale`** cookie (see language control in the app bar).

## Never translate (show as stored)

- Product brand: **Ezzi** / **EZZI** (`src/i18n/brand.ts`)
- **Organisation** display name, legal name, company number
- **Person** names and email addresses
- **Office** names, addresses, postcodes, manager names (operational labels)
- **Property** addresses, tenant/landlord names on records
- **Integration** provider names configured by the customer
- User-generated notes, audit actor names, free-text reasons

Use plain JSX for these fields: `{org.name}`, `{user.name}` — never `t(org.name)`.

## Always translate

- Navigation, buttons, headings, hints, empty states, validation messages
- Role labels and role taglines (keys under `roles.*`)
- Tab titles, form **field labels**, table **column headers**
- Status **words** only when they are enums with fixed catalog keys (e.g. `status.active`), not when displaying a custom status string from data

## Organisation default language

`OrgSettings.defaultLocale` is the tenant default for new sessions (mock). User cookie overrides until we persist profile locale in IAM.

## Adding a locale

1. Copy `messages/en-GB.json` → `messages/<locale>.json`
2. Register in `src/i18n/config.ts`
3. Keep keys identical; CI can diff keys later

Missing keys fall back to English strings in production via shared keys; dev shows `[namespace.key]` when a translation is missing.
