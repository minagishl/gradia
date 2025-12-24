# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/minagishl/gradia/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/minagishl/gradia/releases/tag/v1.0.0

