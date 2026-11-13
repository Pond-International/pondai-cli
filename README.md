# pondai CLI

Public release repository for the `pondai` command-line interface.

The source code is maintained in a private repository. This repository contains
only release artifacts, their SHA-256 checksums, and the install script. It does
not contain source code.

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
npx @pondai/cli@latest version
```

```sh
npm install -g @pondai/cli
```

The npm package contains no binary. It downloads the matching release archive,
verifies it against `checksums.txt`, and runs the native executable.

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

## Mirrors

Set `PONDAI_RELEASE_REPO` to an `owner/repository` pair to install and update
from an internal mirror that follows the same asset layout.

## Status

Release binaries are cross-compiled and verified by checksum, but they are not
yet code-signed or notarized. macOS Gatekeeper and Windows SmartScreen may warn
on first run until signing is added in a future release.
