import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "vitest"

import {
  buildInstallCommand,
  detectManager,
  formatCommand,
  loadPeerDependencies,
  prepareInstall,
} from "../scripts/peer-deps/install.js"

const fixturePath = relative => fileURLToPath(new URL(`./fixtures/${relative}`, import.meta.url))

describe("install-peers helper", () => {
  test("loadPeerDependencies returns pinned peers", async () => {
    const peers = await loadPeerDependencies(fixturePath("manifest-with-peers.json"))
    expect(peers).toEqual(["eslint@9.39.1", "prettier@3.6.2"])
  })

  test("loadPeerDependencies handles missing peers", async () => {
    const peers = await loadPeerDependencies(fixturePath("manifest-no-peers.json"))
    expect(peers).toEqual([])
  })

  test("detectManager respects explicit flag", () => {
    const manager = detectManager({ managerArg: "pnpm" })
    expect(manager).toBe("pnpm")
  })

  test("detectManager infers from user agent", () => {
    const manager = detectManager({ userAgent: "pnpm/9.0.0 npm/?" })
    expect(manager).toBe("pnpm")
  })

  test("detectManager infers from lockfile", async () => {
    const dir = await mkdtemp(join(tmpdir(), "signmax-config-"))
    await writeFile(join(dir, "bun.lockb"), "")
    const manager = detectManager({ cwd: dir })
    expect(manager).toBe("bun")
  })

  test("buildInstallCommand supports npm", () => {
    const result = buildInstallCommand("npm", ["eslint@9.39.1"])
    expect(result.command).toBe("npm")
    expect(result.args).toEqual(["install", "--save-dev", "--save-exact", "eslint@9.39.1"])
    expect(formatCommand(result)).toBe("npm install --save-dev --save-exact eslint@9.39.1")
  })

  test("buildInstallCommand throws on unsupported manager", () => {
    expect(() => buildInstallCommand("yarn", ["eslint@9.39.1"])).toThrow(/Unsupported package manager/)
  })

  test("prepareInstall returns printable command", async () => {
    const result = await prepareInstall({
      managerArg: "npm",
      env: {},
      cwd: process.cwd(),
      manifestPath: fixturePath("manifest-with-peers.json"),
    })

    expect(result.manager).toBe("npm")
    expect(result.packages).toEqual(["eslint@9.39.1", "prettier@3.6.2"])
    expect(result.printable).toBe("npm install --save-dev --save-exact eslint@9.39.1 prettier@3.6.2")
  })

  test("prepareInstall returns empty when no peers", async () => {
    const result = await prepareInstall({
      managerArg: "npm",
      env: {},
      cwd: process.cwd(),
      manifestPath: fixturePath("manifest-no-peers.json"),
    })

    expect(result.packages).toEqual([])
  })
})
