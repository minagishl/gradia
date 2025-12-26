import fs from "node:fs";
import path from "node:path";

const RELEASE_DIR = "release";

async function exec(command, description) {
  console.log(`\n${description}...`);
  const proc = Bun.spawn(["sh", "-c", command], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`Failed: ${description}`);
    process.exit(1);
  }
}

async function getFileSize(filePath) {
  const size = await Bun.file(filePath).size;
  const mb = (size / (1024 * 1024)).toFixed(2);
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
    await exec("bun run build", "Building extension");

    // Create Firefox zip
    await exec("bun run build:firefox", "Creating Firefox zip");
    if (fs.existsSync("dist/firefox.zip")) {
      fs.renameSync("dist/firefox.zip", path.join(RELEASE_DIR, "firefox.zip"));
    }

    // Copy LICENSE and README.md to dist for Chrome zip
    if (fs.existsSync("LICENSE")) {
      await Bun.write("dist/LICENSE", Bun.file("LICENSE"));
    }
    if (fs.existsSync("README.md")) {
      await Bun.write("dist/README.md", Bun.file("README.md"));
    }

    // Create Chrome zip
    await exec(
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
      `  - firefox.zip: ${await getFileSize(path.join(RELEASE_DIR, "firefox.zip"))}`
    );
    console.log(
      `  - chrome.zip: ${await getFileSize(path.join(RELEASE_DIR, "chrome.zip"))}`
    );
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
})();
