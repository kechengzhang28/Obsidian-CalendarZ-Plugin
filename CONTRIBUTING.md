# Contributing to CalendarZ

## Development Setup

```bash
git clone https://github.com/kechengzhang28/Obsidian-CalendarZ-Plugin.git
cd Obsidian-CalendarZ-Plugin
npm install
```

### Build

```bash
npm run build    # production build
npm run dev      # watch mode
```

Copy `main.js`, `manifest.json`, and `styles.css` into your vault's `.obsidian/plugins/calendarz/` folder, then reload Obsidian.

### Lint

```bash
npm run lint
```

## Adding a New Language

1. Copy `src/locales/en-US.json` to `src/locales/<locale>.json` and translate all values.
2. Add the locale to the `Language` type in `src/core/types/settings.ts`:
   ```ts
   export type Language = "en-US" | "zh-CN" | "pt-BR" | "your-locale";
   ```
3. Import and register the locale in `src/i18n.ts`:
   ```ts
   import yourLocale from "./locales/your-locale.json";
   // ...
   "your-locale": yourLocale as I18n,
   ```
4. Add the dropdown option in `src/settings/modules/language.ts`:
   ```ts
   "your-locale": "Display Name",
   ```

## Project Structure

```
src/
  main.ts             # Plugin entry point, lifecycle
  i18n.ts             # I18n interface and locale registry
  core/               # Types, constants
  settings/           # Settings tab, defaults, UI modules
  components/         # Svelte UI components
  services/           # Business logic (daily notes, todos, etc.)
  utils/              # Date formatting, helpers
  locales/            # Locale JSON files
```

## Pull Requests

- Run `npm run lint` and `npm run build` before submitting.
- Keep changes focused and minimal.
- Follow existing code style and conventions.
- Follow the [Obsidian Developer Policies](https://docs.obsidian.md/Developer+policies) and [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
