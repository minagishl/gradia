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

Gradia is a lightweight Chrome extension screensaver built with React, Vite, and WebGL shader gradients. Features beautiful animated gradient visualizations that transform your browser into a mesmerizing display.

## Features

- **10 Stunning Gradient Presets**: Choose from Aurora Borealis, Cosmic Nebula, Galaxy Swirl, and more
- **Advanced Animations**: WebGL-based shader gradients with dynamic 3D camera movements and color transitions
- **Smooth Performance**: Hardware-accelerated WebGL rendering with adaptive pixel density
- **Simple Controls**: Launch with one click or keyboard shortcut, exit with Escape key
- **Keyboard Shortcut**: Quick launch with `Ctrl+Shift+S` (Windows/Linux) or `Command+Shift+S` (Mac)
- **Multi-Monitor Support**: Option to start screensaver on all connected monitors simultaneously
- **Lightweight**: Minimal permissions, no background tracking
- **Customizable**: Easy-to-use popup interface for selecting gradient themes
- **Optional Password Lock**: Protect fullscreen mode with a password stored only as a hash

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for fast development and builds
- [@shadergradient/react](https://github.com/ruucm/shadergradient) for WebGL-based shader gradient rendering
- [Three.js](https://threejs.org/) + [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D graphics
- Chrome Extension Manifest V3
- Modern web extension APIs

## Installation

### From Chrome Web Store

The easiest way to install Gradia is directly from the Chrome Web Store:

[Install Gradia from Chrome Web Store](https://chromewebstore.google.com/detail/hnlbjepmcmlmclkpmpdnbkbhfebpfmeg)

### From Source

For developers or advanced users who want to build from source:

#### Prerequisites

- Node.js 20 or higher
- bun package manager

#### Build Instructions

Install dependencies:

```bash
bun install
```

Build the extension:

```bash
bun run build
```

#### Chrome Installation

1. Clone this repository
2. Build the extension using the commands above
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the `dist` folder from the cloned repository
7. The extension icon will appear in your toolbar

#### Edge Installation

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
4. (Optional) Enter an exit password to protect fullscreen mode
5. (Optional) Check "Start on all monitors" to launch on all connected displays
6. Click "Start" to launch in fullscreen
7. Press `Escape` to close the screensaver

### Keyboard Shortcut

You can quickly launch the screensaver using a keyboard shortcut:

- **Windows/Linux**: `Ctrl+Shift+S`
- **Mac**: `Command+Shift+S`

The shortcut uses your saved settings (gradient preset and multi-monitor preference). You can customize or disable the shortcut in Chrome's extension shortcuts page (`chrome://extensions/shortcuts`).

### Multi-Monitor Support

Gradia supports multiple monitors. When the "Start on all monitors" option is enabled:

- The screensaver will launch on all connected displays simultaneously
- Each monitor will display the same gradient preset
- **Important**: Chrome must be open on all monitors for fullscreen mode to work properly
- If Chrome is not open on a monitor, the screensaver will open as a window on that monitor instead of fullscreen
- Password protection applies to all screensaver windows

### Password Protection

Gradia supports an optional password to prevent leaving fullscreen without authorization:

1. In the popup, enter a password in the "Exit Password (optional)" field.
2. Start the screensaver. The password is hashed using SHA-256 and stored in extension storage.
3. While the screensaver is running, pressing `Escape` will open a password prompt.
4. Only the correct password will unlock and close the screensaver.
5. To remove password protection for future sessions, start the screensaver with an empty password field.

To make it harder to close the screensaver using the browser window controls while a password is active, the background script will recreate the fullscreen window if it is closed while protection is enabled. Note that users can still forcibly quit the browser or disable the extension; this feature is intended as a lightweight protection, not a full kiosk or system-level lock.

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
bun install
```

2. Build for production:

```bash
bun run build
```

### Code Quality

```bash
# Type checking
bun run build

# Linting
bun run lint
```

### Project Structure

```
gradia/
├── src/
│   ├── components/
│   │   ├── canvas.tsx            # WebGL shader gradient canvas component
│   │   └── ui/                   # Reusable UI components
│   ├── lib/
│   │   ├── gradients.ts          # Gradient presets and types
│   │   └── password.ts           # Password hashing utilities
│   ├── background.ts             # Extension background script
│   ├── popup.tsx                 # Popup interface
│   ├── popup.html                # Popup HTML
│   ├── main.tsx                  # Screensaver page logic
│   └── main.html                 # Screensaver HTML
├── dist/                         # Build output
├── scripts/
│   └── firefox.cjs               # Firefox build script
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## How It Works

### Animation System

The screensaver uses [@shadergradient/react](https://github.com/ruucm/shadergradient) for WebGL-based shader gradient rendering:

1. **WebGL Shaders**: Hardware-accelerated gradient rendering using custom GLSL shaders
2. **Three.js Scene**: 3D scene management with optimized rendering pipeline
3. **Dynamic Properties**: Each preset defines camera position, rotation, colors, lighting, and animation parameters
4. **Adaptive Pixel Density**: Automatically adjusts rendering resolution based on screen size and orientation for optimal performance
5. **React Three Fiber**: Declarative 3D rendering with React components
6. **Real-time Animation**: Smooth gradient transitions and movements powered by WebGL

### Performance

- WebGL-based shader rendering for hardware-accelerated graphics
- Optimized Three.js scene with efficient gradient calculations
- Dynamic pixel density adjustment based on screen size and orientation
- Efficient event handling with proper cleanup

## Browser Support

- Chrome (latest)
- Edge (latest)
- Firefox (latest)
- Any Chromium-based browser supporting Manifest V3

## Contributing

Contributions are welcome! If you'd like to improve Gradia, please follow these steps:

1. **Fork the repository** and create your feature branch (`git checkout -b feature/my-new-feature`).
2. **Install dependencies** with `bun install`.
3. **Make your changes**, following the existing code style.
4. **Run linter and build** to ensure everything works (`bun run lint` and `bun run build`).
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
