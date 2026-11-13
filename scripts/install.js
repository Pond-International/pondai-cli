#!/usr/bin/env node
// npm bootstrap: download, verify, and unpack the native pondai-cli binary.
//
// The npm package deliberately contains no binary and no business logic. It
// resolves the public release repository, downloads the platform archive,
// verifies it against checksums.txt, and leaves the binary in ./bin.

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_REPO = "Pond-International/pondai-cli";
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const BIN_DIR = path.join(PACKAGE_ROOT, "bin");
const BINARY = process.platform === "win32" ? "pondai-cli.exe" : "pondai-cli";
const PACKAGE_VERSION = require(path.join(PACKAGE_ROOT, "package.json")).version;

function repo() {
  return process.env.PONDAI_RELEASE_REPO || DEFAULT_REPO;
}

function platform() {
  const osMap = { darwin: "darwin", linux: "linux", win32: "windows" };
  const archMap = { x64: "amd64", arm64: "arm64" };
  const goos = osMap[process.platform];
  const goarch = archMap[process.arch];
  if (!goos || !goarch) {
    throw new Error(`unsupported platform ${process.platform}/${process.arch}`);
  }
  return { goos, goarch };
}

function request(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: headers || {} }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(request(res.headers.location, headers));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(60000, () => req.destroy(new Error(`timeout for ${url}`)));
  });
}

// Resolution order:
//   1. the release tagged v<package version>, so a pinned or prerelease
//      install never runs a different binary than the package it came from;
//   2. /releases/latest, which GitHub defines to exclude prereleases.
async function fetchRelease(headers) {
  const pinned = `https://api.github.com/repos/${repo()}/releases/tags/v${PACKAGE_VERSION}`;
  try {
    return JSON.parse((await request(pinned, headers)).toString("utf8"));
  } catch (error) {
    if (!/HTTP 404/.test(error.message)) {
      throw error;
    }
  }
  return JSON.parse(
    (await request(`https://api.github.com/repos/${repo()}/releases/latest`, headers)).toString("utf8")
  );
}

async function main() {
  if (process.env.PONDAI_SKIP_DOWNLOAD === "1") {
    console.log("pondai-cli: PONDAI_SKIP_DOWNLOAD=1, leaving the binary untouched");
    return;
  }
  const target = path.join(BIN_DIR, BINARY);
  if (fs.existsSync(target)) {
    console.log(`pondai-cli: ${target} already exists`);
    return;
  }
  const { goos, goarch } = platform();
  const headers = { "User-Agent": "pondai-cli-npm", Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const release = await fetchRelease(headers);
  const extension = goos === "windows" ? ".zip" : ".tar.gz";
  const assetName = `pondai-cli_${goos}_${goarch}${extension}`;
  const asset = (release.assets || []).find((item) => item.name === assetName);
  const checksums = (release.assets || []).find((item) => item.name === "checksums.txt");
  if (!asset || !checksums) {
    throw new Error(`release ${release.tag_name} has no ${assetName} or checksums.txt`);
  }
  const archive = await request(asset.browser_download_url, { "User-Agent": "pondai-cli-npm" });
  const checksumText = (await request(checksums.browser_download_url, { "User-Agent": "pondai-cli-npm" })).toString("utf8");
  const expected = checksumFor(checksumText, assetName);
  const actual = crypto.createHash("sha256").update(archive).digest("hex");
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`checksum mismatch for ${assetName}`);
  }
  fs.mkdirSync(BIN_DIR, { recursive: true });
  const temp = path.join(os.tmpdir(), `pondai-cli-${Date.now()}${extension}`);
  fs.writeFileSync(temp, archive);
  extract(temp, BIN_DIR, goos);
  fs.rmSync(temp, { force: true });
  if (!fs.existsSync(target)) {
    throw new Error(`archive did not contain ${BINARY}`);
  }
  if (process.platform !== "win32") {
    fs.chmodSync(target, 0o755);
  }
  console.log(`pondai-cli: installed ${target} from ${release.tag_name}`);
}

function checksumFor(text, name) {
  for (const line of text.split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length === 2 && fields[1].replace(/^\*/, "") === name) {
      if (!/^[0-9a-fA-F]{64}$/.test(fields[0])) {
        throw new Error(`invalid checksum for ${name}`);
      }
      return fields[0];
    }
  }
  throw new Error(`checksums.txt does not list ${name}`);
}

function extract(archive, destination, goos) {
  const result = goos === "windows"
    ? spawnSync("tar", ["-xf", archive, "-C", destination], { stdio: "inherit" })
    : spawnSync("tar", ["-xzf", archive, "-C", destination], { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("tar failed to extract the archive");
  }
}

main().catch((error) => {
  console.error(`pondai-cli: install failed: ${error.message}`);
  console.error("Set PONDAI_RELEASE_REPO to a reachable public release repository or install from GitHub Releases directly.");
  process.exit(1);
});
