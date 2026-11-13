#!/usr/bin/env node
// Thin npm launcher. It forwards every argument to the native binary.

"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const binary = path.join(__dirname, "..", "bin", process.platform === "win32" ? "pondai-cli.exe" : "pondai-cli");
if (!fs.existsSync(binary)) {
  console.error(`pondai-cli: native binary missing at ${binary}`);
  console.error("Reinstall @pond-international/cli with a reachable public release repository.");
  process.exit(1);
}

const child = spawn(binary, process.argv.slice(2), { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code === null ? 1 : code);
});
child.on("error", (error) => {
  console.error(`pondai-cli: ${error.message}`);
  process.exit(1);
});
