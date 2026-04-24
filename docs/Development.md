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
├── main.ts              # Plugin entry point
├── CalendarView.ts      # Calendar view
├── components/          # Svelte components
│   ├── Calendar.svelte
│   ├── CalendarHeader.svelte
│   ├── WeekdaysRow.svelte
│   └── DaysGrid.svelte
├── settings/            # Settings related
│   ├── types.ts
│   ├── defaults.ts
│   └── modules/
├── utils/               # Utility functions
│   ├── getNotes.ts
│   ├── createNote.ts
│   └── date/
├── i18n.ts              # Internationalization
└── locales/             # Language files
    ├── en-US.json
    └── zh-CN.json
```