# pondai-cli

Public release repository for the `pondai-cli` command-line interface.

The CLI source is maintained in a private repository. This repository holds the
npm bootstrap package (`@pond-international/cli`), the npm publish workflow, and
the release artifacts, checksums, and install script. It does not contain the
CLI source code.

## Install

macOS and Linux:

```sh
curl -fsSL https://github.com/Pond-International/pondai-cli/releases/latest/download/install.sh | sh
```

The script installs to `$HOME/.local/bin` by default. Set `PONDAI_INSTALL_DIR`
to change the destination. It verifies every archive against `checksums.txt`
and refuses to install on a mismatch.

With Node.js 18 or newer:

```sh
npx @pond-international/cli@latest version
```

```sh
npm install -g @pond-international/cli
pondai-cli version
```

The npm package contains no binary. It downloads the release archive that
matches its own version, verifies it against `checksums.txt`, and runs the
native `pondai-cli` executable.

## Release assets

| Asset | Platform |
| --- | --- |
| `pondai_<version>_darwin_amd64.tar.gz` | macOS, Intel |
| `pondai_<version>_darwin_arm64.tar.gz` | macOS, Apple Silicon |
| `pondai_<version>_linux_amd64.tar.gz` | Linux, x86-64 |
| `pondai_<version>_linux_arm64.tar.gz` | Linux, arm64 |
| `pondai_<version>_windows_amd64.zip` | Windows, x86-64 |
| `pondai_<version>_windows_arm64.zip` | Windows, arm64 |
| `checksums.txt` | SHA-256 digest for every archive |
| `install.sh` | Install script |

## Verify a download manually

```sh
curl -fsSLO https://github.com/Pond-International/pondai-cli/releases/download/v0.1.0/pondai_0.1.0_darwin_arm64.tar.gz
curl -fsSLO https://github.com/Pond-International/pondai-cli/releases/download/v0.1.0/checksums.txt
shasum -a 256 -c checksums.txt --ignore-missing
```

On Linux, use `sha256sum -c checksums.txt --ignore-missing`.

## Repository layout

```text
package.json                     npm bootstrap, no binary and no business logic
scripts/install.js               downloads and verifies the archive on install
scripts/run.js                   launches the native binary
.github/workflows/publish-npm.yml  publishes the npm package from a release
```

## Mirrors

Set `PONDAI_RELEASE_REPO` to an `owner/repository` pair to install and update
from an internal mirror that follows the same asset layout.

## Status

Release binaries are cross-compiled and verified by checksum, but they are not
yet code-signed or notarized. macOS Gatekeeper and Windows SmartScreen may warn
on first run until signing is added in a future release.
