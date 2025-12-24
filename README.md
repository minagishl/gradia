<img alt="" src="./docs/gradia.png" />

<h3 align="center">Gradia</h3>

<p align="center">
A beautiful animated gradient screensaver for Chrome as an extension.
<br />
<br />
<a href="#introduction"><strong>Introduction</strong></a> ·
<a href="#tech-stack"><strong>Tech Stack</strong></a> ·
<a href="#installation"><strong>Installation</strong></a> ·
<a href="#contributing"><strong>Contributing</strong></a>
</p>

## introduction

Gradia is a lightweight Chrome extension screensaver built with React, Vite, and Canvas. Features beautiful animated gradient visualizations that transform your browser into a mesmerizing display.

## Features

- **10 Stunning Gradient Presets**: Choose from Aurora Borealis, Cosmic Nebula, Galaxy Swirl, and more
- **Advanced Animations**: Multi-layer radial gradients with wave-like motion and dynamic color positioning
- **Smooth Performance**: Hardware-accelerated Canvas rendering with blend modes
- **Simple Controls**: Launch with one click, exit with Escape key
- **Lightweight**: Minimal permissions, no background tracking
- **Customizable**: Easy-to-use popup interface for selecting gradient themes

## Tech Stack

- React 19 + TypeScript
- Vite for fast development and builds
- HTML5 Canvas for rendering
- Chrome Extension Manifest V3
- Modern web extension APIs

## Installation

### Prerequisites

- Node.js 20 or higher
- pnpm package manager

### Build Instructions

Install dependencies:
```bash
pnpm install
```

Build the extension:
```bash
pnpm build
```

### Chrome Installation

1. Clone this repository
2. Build the extension using the commands above
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the `dist` folder from the cloned repository
7. The extension icon will appear in your toolbar

### Edge Installation

1. Clone this repository
2. Build the extension using the commands above
3. Open Edge and navigate to `edge://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the `dist` folder from the cloned repository
7. The extension icon will appear in your toolbar

## Usage

### Basic Operation

1. Click the Gradia icon in your browser toolbar
2. A popup will appear with gradient preset options
3. Select your preferred gradient from the dropdown menu
4. Click "Start Screensaver" to launch in fullscreen
5. Press `Escape` to close the screensaver

### Available Gradients

- **Aurora Borealis**: Northern lights-inspired flowing colors
- **Cosmic Nebula**: Deep space purple and pink hues
- **Sunset Wave**: Warm orange and gold tones
- **Ocean Depth**: Cool blues and deep sea colors
- **Electric Dreams**: Vibrant electric blue and purple
- **Fire & Ice**: Contrasting warm and cool colors
- **Forest Mist**: Natural green and blue tones
- **Galaxy Swirl**: Cosmic purple and pink spirals
- **Candy Rush**: Sweet pink and golden colors
- **Midnight City**: Dark urban night atmosphere

## Development

### Development Setup

1. Clone and install dependencies:
```bash
git clone https://github.com/minagishl/gradia.git
cd gradia
pnpm install
```

2. Build for production:
```bash
pnpm build
```

### Code Quality

```bash
# Type checking
pnpm build

# Linting
pnpm lint
```

### Project Structure

```
gradia/
├── src/
│   ├── components/
│   │   ├── Button.tsx            # Reusable button component
│   │   └── ScreensaverCanvas.tsx # Main canvas animation
│   ├── types/
│   │   └── gradients.ts          # Gradient presets and types
│   ├── background.ts             # Extension background script
│   ├── popup.tsx                 # Popup interface
│   ├── popup.html                # Popup HTML
│   ├── main.tsx                  # Screensaver page logic
│   ├── main.html                 # Screensaver HTML
│   └── logger.ts                 # Logging utility
├── dist/                         # Build output
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── biome.json                    # Biome linter configuration
└── package.json                  # Project dependencies
```

## How It Works

### Animation System

The screensaver uses a multi-layer gradient system:

1. **Multiple Layers**: Each preset contains 2-3 gradient layers
2. **Radial Gradients**: Creates natural, organic color spreads
3. **Wave Motion**: Gradient centers move in circular patterns using sine/cosine functions
4. **Dynamic Sizing**: Radii oscillate to create breathing effects
5. **Color Animation**: Color stops shift positions over time
6. **Blend Modes**: Layers use "screen" blend mode for ethereal effects

### Performance

- Uses `requestAnimationFrame` for smooth 60fps animations
- Canvas operations are optimized for minimal redraws
- Gradient calculations cached per frame
- Efficient event handling with proper cleanup

## Browser Support

- Chrome (latest)
- Edge (latest)
- Firefox (latest)
- Any Chromium-based browser supporting Manifest V3

## Contributing

Contributions are welcome! If you'd like to improve Gradia, please follow these steps:

1. **Fork the repository** and create your feature branch (`git checkout -b feature/my-new-feature`).
2. **Install dependencies** with `pnpm install`.
3. **Make your changes**, following the existing code style.
4. **Run linter and build** to ensure everything works (`pnpm run biome` and `pnpm build`).
5. **Commit your changes** (`git commit -am 'feat: add new feature'`).
6. **Push to your fork** (`git push origin feature/my-new-feature`).
7. **Open a Pull Request** describing your changes.

### Guidelines

- Use clear, descriptive commit messages.
- For large changes, consider opening an issue first to discuss.
- Ensure your code passes all existing lint and build checks.
- Update documentation and tests as appropriate.

Thank you for helping improve Gradia!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
