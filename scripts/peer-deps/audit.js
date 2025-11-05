#!/usr/bin/env node

import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const defaultManifestPath = resolve(__dirname, "..", "..", "package.json")
const defaultConsumerRoot = process.env.INIT_CWD ?? process.env.npm_config_local_prefix ?? process.cwd()

async function readManifest(path) {
  const raw = await readFile(path, "utf8")
  return JSON.parse(raw)
}

function createConsumerRequire(root) {
  const candidate = resolve(root, "package.json")
  if (existsSync(candidate)) {
    return createRequire(candidate)
  }

  return createRequire(import.meta.url)
}

export async function auditPeerDependencies({
  manifestPath = defaultManifestPath,
  consumerRoot = defaultConsumerRoot,
} = {}) {
  const manifest = await readManifest(manifestPath)
  const peers = Object.entries(manifest.peerDependencies ?? {})

  if (!peers.length) {
    return {
      peers,
      missing: [],
      mismatched: [],
    }
  }

  const requireFromConsumer = createConsumerRequire(consumerRoot)
  const missing = []
  const mismatched = []

  for (const [name, expectedVersion] of peers) {
    let resolvedPackageJson
    try {
      resolvedPackageJson = requireFromConsumer.resolve(`${name}/package.json`)
    } catch (error) {
      missing.push({ name, expectedVersion, reason: error.message })
      continue
    }

    try {
      const pkg = JSON.parse(await readFile(resolvedPackageJson, "utf8"))
      const actualVersion = pkg.version
      if (actualVersion !== expectedVersion) {
        mismatched.push({ name, expectedVersion, actualVersion })
      }
    } catch (error) {
      mismatched.push({ name, expectedVersion, actualVersion: "unknown", reason: error.message })
    }
  }

  return {
    peers,
    missing,
    mismatched,
  }
}

export function formatAuditMessage({ missing, mismatched }) {
  if (!missing.length && !mismatched.length) {
    return null
  }

  const lines = ["[signmax-config] Peer dependency check detected issues:"]

  if (missing.length) {
    lines.push("  Missing peers:")
    for (const item of missing) {
      lines.push(`    - ${item.name}@${item.expectedVersion}`)
    }
  }

  if (mismatched.length) {
    lines.push("  Version mismatches:")
    for (const item of mismatched) {
      const details = item.actualVersion ? ` (found ${item.actualVersion})` : ""
      lines.push(`    - ${item.name}@${item.expectedVersion}${details}`)
    }
  }

  lines.push('  Run "npx signmax-config-peers" to install the correct versions.')

  return lines.join("\n")
}

export async function runPostinstallAudit() {
  try {
    const result = await auditPeerDependencies()
    const message = formatAuditMessage(result)

    if (message) {
      console.warn(message)
    }
  } catch (error) {
    console.warn(`[signmax-config] Peer dependency check skipped: ${error.message}`)
  }
}

if (process.argv[1] === __filename) {
  runPostinstallAudit()
}
