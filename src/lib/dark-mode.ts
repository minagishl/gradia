/**
 * Dark mode utility
 * Detects system color scheme preference and applies dark class to body element
 */

function initDarkMode() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function updateDarkMode(e: MediaQueryList | MediaQueryListEvent) {
    if (e.matches) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  // Set initial dark mode
  updateDarkMode(mediaQuery);

  // Listen for changes
  mediaQuery.addEventListener("change", updateDarkMode);
}

// Run immediately when script loads
initDarkMode();
