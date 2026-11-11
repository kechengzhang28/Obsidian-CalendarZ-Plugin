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

### Test in Obsidian

1. Run `npm run test:vault` to build CalendarZ and install it in the test vault at `.misc/calendarz-test-vault`.
2. In Obsidian, select **Open folder as vault** and open that folder. In the test vault, go to **Settings → Community plugins**, turn off restricted mode, and enable **CalendarZ**.
3. Open **CalendarZ test checklist** in the test vault and follow the checks for dots, tasks, week notes, and the heatmap.

After editing the plugin, run `npm run test:vault` again and reload CalendarZ. If the Obsidian CLI is enabled and the test vault is open, run `obsidian vault=calendarz-test-vault plugin:reload id=calendarz`. You can also turn CalendarZ off and on again under **Settings → Community plugins**.

The sample notes live in `test/fixtures/vault`. Open the generated vault at `.misc/calendarz-test-vault` for testing. Git ignores that vault, and rebuilding preserves its notes and settings. To start over, close the test vault, move the generated folder aside, and run `npm run test:vault` again.

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
