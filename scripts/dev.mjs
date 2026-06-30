import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function runFrontend() {
  const child = spawn("npm run dev", {
    cwd: path.join(root, "frontend"),
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error("[frontend] failed to start:", err);
  });

  return child;
}

const frontendRunning = await isPortOpen(3000);
let child = null;

if (frontendRunning) {
  console.log("Frontend already running on http://localhost:3000");
} else {
  console.log("Cleaning frontend .next cache ...");
  rmSync(path.join(root, "frontend", ".next"), { recursive: true, force: true });
  console.log("Starting frontend on http://localhost:3000 ...");
  child = runFrontend();
}

console.log("\nOpen http://localhost:3000\nPress Ctrl+C to stop.\n");

process.on("SIGINT", () => {
  if (child) child.kill("SIGINT");
  process.exit(0);
});

process.stdin.resume();
