# Development

## Requirements
- Node.js 16+
- npm

## Local Development
```bash
# Clone the repository
git clone https://github.com/kechengzhang28/obsidian-calendarz.git

# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Project Structure
```
src/
├── main.ts                    # Plugin entry point
├── i18n.ts                    # Internationalization
├── svelte-shims.d.ts          # Svelte type declarations
├── components/                # Svelte components
│   ├── Calendar.svelte
│   ├── CalendarHeader.svelte
│   ├── DaysGrid.svelte
│   ├── WeekdaysRow.svelte
│   └── types.ts
├── core/                      # Core types and constants
│   ├── constants.ts
│   └── types/
│       ├── index.ts
│       ├── plugin.ts
│       └── settings.ts
├── locales/                   # Language files
│   ├── en-US.json
│   └── zh-CN.json
├── services/                  # Business logic services
│   ├── dailyNote/
│   │   └── DailyNoteService.ts
│   ├── notes/
│   │   └── NoteCounter.ts
│   ├── todos/
│   │   └── TodoService.ts
│   ├── weekNote/
│   │   └── WeekNoteService.ts
│   └── index.ts
├── settings/                  # Settings related
│   ├── CalendarZSettingTab.ts
│   ├── defaults.ts
│   ├── index.ts
│   ├── settingUtils.ts
│   ├── types.ts
│   ├── modules/               # Setting modules
│   │   ├── basic.ts
│   │   ├── click.ts
│   │   ├── dots.ts
│   │   ├── heatmap.ts
│   │   ├── language.ts
│   │   ├── statistics.ts
│   │   └── weekNote.ts
│   └── ui/                    # Settings UI
│       ├── SettingGroup.ts
│       ├── SettingRenderer.ts
│       └── index.ts
├── ui/                        # UI components
│   ├── modals/
│   │   ├── ConfirmModal.ts
│   │   └── IgnoredFoldersModal.ts
│   └── view/
│       ├── CalendarViewController.ts
│       └── CalendarZView.ts
└── utils/                     # Utility functions
    ├── date/                  # Date utilities
    │   ├── calculator.ts
    │   ├── dayjsConfig.ts
    │   ├── formatter.ts
    │   ├── index.ts
    │   └── parser.ts
    ├── index.ts
    └── path.ts
```