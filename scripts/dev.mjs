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

function runProject(label, projectDir) {
  const command = "npm run dev";
  const child = spawn(command, {
    cwd: path.join(root, projectDir),
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error(`[${label}] failed to start:`, err);
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }
  });

  return child;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const backendRunning = await isPortOpen(3001);
const frontendRunning = await isPortOpen(3000);
const children = [];

if (!backendRunning) {
  console.log("Starting backend on http://localhost:3001 ...");
  children.push(runProject("backend", "backend"));
  await sleep(2500);
} else {
  console.log("Backend already running on http://localhost:3001");
}

if (frontendRunning) {
  console.log("Frontend already running on http://localhost:3000");
  console.log(
    "If the page shows ENOENT/.next errors, run `npm run dev:stop` once, then `npm run dev` again."
  );
} else {
  console.log("Cleaning frontend .next cache ...");
  rmSync(path.join(root, "frontend", ".next"), { recursive: true, force: true });

  console.log("Starting frontend on http://localhost:3000 ...");
  children.push(runProject("frontend", "frontend"));
}

console.log("\nOpen http://localhost:3000\nPress Ctrl+C to stop this launcher.\n");

process.on("SIGINT", () => {
  for (const child of children) child.kill("SIGINT");
  process.exit(0);
});

process.stdin.resume();
