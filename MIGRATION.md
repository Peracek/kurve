# Migration Guide: Gulp to Vite

## Overview
This project has been modernized by migrating from **Gulp** to **Vite** as the build tool. Vite provides better performance, faster dev server startup, and modern ES module support out of the box.

## What Changed

### Build System
- **Old**: Gulp with separate tasks for JS minification, SCSS compilation, and asset bundling
- **New**: Vite with automatic bundling, minification, and optimization

### Commands
| Task | Old Command | New Command |
|------|------------|------------|
| Install dependencies | `npm install` | `npm install` |
| Development with watch | `gulp watch` | `npm run dev` |
| Production build | `gulp build` | `npm run build` |
| Preview production build | N/A | `npm run preview` |

### Configuration Files
- **Removed**: `gulpfile.js` - no longer needed
- **Added**: `vite.config.js` - Vite configuration
- **Updated**: `package.json` - new scripts and dependencies

### JavaScript Modules
- All source files in `/src` are now proper ES modules
- Created `src/main.js` as the application entry point
- `index.html` now uses `<script type="module" src="/src/main.js"></script>`

## Benefits

1. **Faster Dev Server**: Vite starts in milliseconds vs. Gulp's several seconds
2. **Hot Module Replacement (HMR)**: Changes instantly reflect in the browser without full page reload
3. **Modern Tooling**: Built on Rollup for production, with esbuild for transformation
4. **Better Performance**: Minified bundle is optimized automatically
5. **ES Modules**: Native ES module support throughout the codebase

## Development Workflow

### Start Development
```bash
npm install  # First time only
npm run dev  # Starts server at http://localhost:5173
```
The dev server will automatically reload when you edit source files.

### Build for Production
```bash
npm run build  # Creates optimized build in dist/
```

### Preview Production Build
```bash
npm run preview  # Test production build locally
```

## Build Output

The production build outputs to the `dist/` folder with the same structure:
- `dist/js/index.js` - Minified JavaScript bundle
- `dist/css/index.css` - Compiled CSS
- `dist/images/` - Static images
- `dist/index.html` - HTML file with bundle references

## Deployment

The `dist/` folder contains everything needed for deployment. Simply upload it to your web server.

## Troubleshooting

### "Module not found" errors
Ensure all imports use correct relative paths starting with `./` or `../`.

### CSS not updating in dev mode
Vite has built-in HMR for CSS. Simply save your file and it will hot-reload.

### Production build seems to not include changes
Run `npm run build` again to generate a fresh build from the latest source files.

## Future Improvements

Potential next steps for modernization:
- **Vitest**: Set up unit testing framework (see `src/` for testable modules)
- **ESLint/Prettier**: Add code quality and formatting tools
- **TypeScript**: Consider migrating to TypeScript for better type safety
- **Component Framework**: Refactor to a modern framework like Vue, React, or Svelte
