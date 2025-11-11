import { mkdtemp, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "vitest"

import { auditPeerDependencies, formatAuditMessage } from "../scripts/peer-deps/audit.js"

const fixturePath = relative => fileURLToPath(new URL(`./fixtures/${relative}`, import.meta.url))

async function createPackage(root, name, version) {
  const parts = name.split("/")
  const packageDir = join(root, "node_modules", ...parts)
  await mkdir(packageDir, { recursive: true })
  await writeFile(join(packageDir, "package.json"), JSON.stringify({ name, version }), "utf8")
}

async function createProjectRoot() {
  const root = await mkdtemp(join(tmpdir(), "skyltmax-check-peers-"))
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "example", version: "1.0.0" }), "utf8")
  return root
}

describe("check-peers audit", () => {
  test("returns empty when all peers match", async () => {
    const root = await createProjectRoot()
    await createPackage(root, "eslint", "9.39.1")
    await createPackage(root, "prettier", "3.6.2")

    const result = await auditPeerDependencies({
      manifestPath: fixturePath("manifest-with-peers.json"),
      consumerRoot: root,
    })

    expect(result.missing).toEqual([])
    expect(result.mismatched).toEqual([])
    expect(formatAuditMessage(result)).toBeNull()
  })

  test("detects missing peers", async () => {
    const root = await createProjectRoot()
    await createPackage(root, "eslint", "9.39.1")

    const result = await auditPeerDependencies({
      manifestPath: fixturePath("manifest-with-peers.json"),
      consumerRoot: root,
    })

    expect(result.missing.map(item => item.name)).toEqual(["prettier"])
    const message = formatAuditMessage(result)
    expect(message).toContain("Missing peers")
    expect(message).toContain("prettier@3.6.2")
  })

  test("detects version mismatches", async () => {
    const root = await createProjectRoot()
    await createPackage(root, "eslint", "9.0.0")
    await createPackage(root, "prettier", "3.6.2")

    const result = await auditPeerDependencies({
      manifestPath: fixturePath("manifest-with-peers.json"),
      consumerRoot: root,
    })

    expect(result.mismatched).toEqual([
      {
        name: "eslint",
        expectedVersion: "9.39.1",
        actualVersion: "9.0.0",
      },
    ])
    const message = formatAuditMessage(result)
    expect(message).toContain("Version mismatches")
    expect(message).toContain("eslint@9.39.1 (found 9.0.0)")
  })
})
