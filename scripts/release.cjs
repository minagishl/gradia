const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const RELEASE_DIR = "release";

function exec(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch {
    console.error(`Failed: ${description}`);
    process.exit(1);
  }
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const mb = (stats.size / (1024 * 1024)).toFixed(2);
  return `${mb} MB`;
}

(async () => {
  try {
    // Create release directory
    if (fs.existsSync(RELEASE_DIR)) {
      fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(RELEASE_DIR, { recursive: true });

    // Build extension
    exec("bun run build", "Building extension");

    // Create Firefox zip
    exec("bun run build:firefox", "Creating Firefox zip");
    if (fs.existsSync("dist/firefox.zip")) {
      fs.renameSync("dist/firefox.zip", path.join(RELEASE_DIR, "firefox.zip"));
    }

    // Copy LICENSE and README.md to dist for Chrome zip
    if (fs.existsSync("LICENSE")) {
      fs.copyFileSync("LICENSE", "dist/LICENSE");
    }
    if (fs.existsSync("README.md")) {
      fs.copyFileSync("README.md", "dist/README.md");
    }

    // Create Chrome zip
    exec(
      `cd dist && zip -r ../${RELEASE_DIR}/chrome.zip . && cd ..`,
      "Creating Chrome zip"
    );

    // Clean up
    if (fs.existsSync("dist/LICENSE")) {
      fs.unlinkSync("dist/LICENSE");
    }
    if (fs.existsSync("dist/README.md")) {
      fs.unlinkSync("dist/README.md");
    }

    console.log("\n✓ Build complete!");
    console.log(
      `  - firefox.zip: ${getFileSize(path.join(RELEASE_DIR, "firefox.zip"))}`
    );
    console.log(
      `  - chrome.zip: ${getFileSize(path.join(RELEASE_DIR, "chrome.zip"))}`
    );
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
})();
