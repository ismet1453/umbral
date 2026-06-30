import { execSync } from "node:child_process";

const ports = new Set(["3000", "3001", "3002", "3004"]);
const pids = new Set();

try {
  const out = execSync("netstat -ano", { encoding: "utf8" });
  for (const line of out.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    const local = parts[1] ?? "";
    const state = parts[3] ?? "";
    const pid = parts[4] ?? "";
    const port = local.split(":").pop();
    if (state === "LISTENING" && ports.has(port) && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }
} catch (err) {
  console.error("Could not inspect ports:", err instanceof Error ? err.message : err);
  process.exit(1);
}

if (pids.size === 0) {
  console.log("No dev servers found on ports 3000/3001/3002/3004.");
  process.exit(0);
}

for (const pid of pids) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
  } catch {
    // Process may already be gone.
  }
}

console.log("Stopped dev servers on ports 3000/3001/3002/3004.");
