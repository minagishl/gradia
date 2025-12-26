# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-12-27

### Added

- Custom gradient preset management system:
  - Create, edit, and delete custom gradient presets
  - Full control over gradient colors, animation type, and visual parameters
  - Import/export functionality for sharing custom presets
  - Duplicate existing presets for quick customization
- Dedicated options page (`chrome://extensions/?options=<extension-id>`):
  - Manage custom gradient presets
  - Visual preset editor with real-time preview
  - Bulk export/import of custom presets
- About page with project information:
  - Automatic version display from manifest
  - Credits and acknowledgments
  - Quick links to GitHub repository and license
- Context menu integration:
  - Right-click menu for quick screensaver access
  - Quick start with specific preset selection
  - Direct access to Settings and About pages
  - Available on both page context and extension icon
- Husky pre-commit hooks:
  - Automatic commit message linting with commitlint
  - Ensures conventional commit format

### Changed

- Refactored codebase structure:
  - Split `lib/gradients.ts` into `lib/preset.ts` for better organization
  - Separated built-in presets from custom preset logic
  - Improved code maintainability and readability
- Version management:
  - Automatic version retrieval from manifest file
  - Single source of truth for version number
- Updated popup UI to display custom presets alongside built-in presets
- Enhanced preset selection with categorized groups (Built-in, Custom, Random)

### Fixed

- Improved type safety in gradient preset handling
- Better error handling in custom preset operations

## [1.0.1] - 2024-12-26

### Added

- 2 new gradient presets:
  - Cherry Blossom: Soft pink gradient inspired by cherry blossoms with waterPlane animation
  - Emerald: Rich green gradient with emerald tones and sphere animation
- Dual random selection modes:
  - Random (Preset): Randomly selects from existing preset gradients
  - Random (Full): Generates completely random gradients with unique colors and parameters
- Chrome Web Store installation instructions in README
- `getRandomPresetFromExisting()` helper function for preset-based randomization

### Changed

- Migrated build system from pnpm to bun for faster installation and builds
- Converted build scripts from CommonJS (.cjs) to ES modules (.mjs)
- Updated README with clearer installation instructions including Chrome Web Store option
- Optimized CI/CD build workflow for better performance
- Unified and streamlined release process
- Refactored gradient selection logic to support multiple random modes
- Improved TypeScript type safety in gradient handling
- Updated project dependencies to latest versions

## [1.0.0] - 2024-12-25

### Added

- Base screensaver functionality with animated gradient visualizations
- 10 gradient presets: Aurora Borealis, Cosmic Nebula, Sunset Wave, Ocean Depth, Electric Dreams, Fire & Ice, Forest Mist, Galaxy Swirl, Candy Rush, Midnight City
- Random gradient selection option
- Password protection for fullscreen mode (password stored as SHA-256 hash)
- Multi-monitor support to launch screensaver on all connected displays simultaneously
- Simultaneous close feature: when one monitor's screensaver closes, all other monitors close automatically
- Keyboard shortcut for quick launch: `Ctrl+Shift+S` (Windows/Linux) or `Command+Shift+S` (Mac)
- Debug menu accessible via KONAMI code (↑↑↓↓←→←→BA) to view debug information and preset details
- Dark mode toggle support
- Modern popup design with clean and intuitive settings interface
- Extension icons in multiple sizes (16px, 19px, 38px, 128px)
- Improved cursor feedback on interactive elements
- Comprehensive error handling measures throughout the application
- Translation hiding feature for cleaner interface
- Tailwind CSS integration for styling
- shadcn UI component library integration
- GitHub issue template for better issue reporting

### Changed

- Updated dependencies including Vite 6.3.4 → 6.4.1
- Migrated from previous linting setup to Prettier + ESLint
- Updated file naming conventions to follow consistent patterns
- Refactored project structure for better maintainability
- Replaced and organized component structure
- Enhanced visual styling throughout the application
- Consistent code formatting across the codebase
- Improved cursor feedback on button hover
- Updated popup design
- Updated CSS styles

### Fixed

- Resolved low image quality rendering issues
- Enhanced error handling and recovery mechanisms
- Adjusted build warning thresholds

### Documentation

- Comprehensive README with installation, usage, and development guides
- Added important notes about multi-monitor functionality

[Unreleased]: https://github.com/minagishl/gradia/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/minagishl/gradia/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/minagishl/gradia/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/minagishl/gradia/releases/tag/v1.0.0

