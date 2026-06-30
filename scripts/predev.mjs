import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEV_PORTS = new Set(["3000", "3001", "3002"]);

function sleep(ms) {
  execSync(`ping -n ${Math.ceil(ms / 1000) + 1} 127.0.0.1 > nul`, {
    stdio: "ignore",
  });
}

function freeDevPorts() {
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
      if (state === "LISTENING" && DEV_PORTS.has(port) && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }
  } catch (err) {
    console.warn(
      "Could not inspect ports:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }

  if (pids.size === 0) {
    console.log("Ports 3000/3001 are free.");
    return 0;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Freed port — stopped PID ${pid}`);
    } catch {
      // Process may already be gone.
    }
  }

  return pids.size;
}

const stopped = freeDevPorts();

if (stopped > 0) {
  // Let processes release file locks before touching .next
  sleep(800);
  rmSync(path.join(root, "frontend", ".next"), { recursive: true, force: true });
  console.log("Cleaned frontend .next cache (after stopping stale servers).");
}
