#!/usr/bin/env node
import { spawn } from "node:child_process"
import { existsSync, realpathSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HELP = `Usage: signmax-config-peers [options]

Options:
  --manager <name>   npm | pnpm | bun (auto-detected by default)
  --dry-run          Print the install command without running it
  --help             Show this help message
`

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const defaultManifestPath = resolve(__dirname, "..", "..", "package.json")

export async function loadPeerDependencies(manifestPath = defaultManifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  const peers = manifest.peerDependencies ?? {}
  return Object.entries(peers).map(([name, version]) => `${name}@${version}`)
}

export function detectManager({ managerArg, userAgent = "", cwd = process.cwd() } = {}) {
  if (managerArg) return managerArg

  if (userAgent.startsWith("pnpm/")) return "pnpm"
  if (userAgent.startsWith("bun/")) return "bun"
  if (userAgent.startsWith("npm/")) return "npm"

  if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (existsSync(resolve(cwd, "bun.lockb"))) return "bun"
  if (existsSync(resolve(cwd, "package-lock.json"))) return "npm"

  return "npm"
}

export function buildInstallCommand(manager, packages) {
  if (!packages.length) {
    throw new Error("No peer dependencies to install.")
  }

  const commandByManager = {
    npm: {
      command: "npm",
      args: ["install", "--save-dev", "--save-exact", ...packages],
    },
    pnpm: {
      command: "pnpm",
      args: ["add", "-D", "--save-exact", ...packages],
    },
    bun: {
      command: "bun",
      args: ["add", "--dev", "--exact", ...packages],
    },
  }

  const selected = commandByManager[manager]

  if (!selected) {
    const supported = Object.keys(commandByManager).join(", ")
    throw new Error(`Unsupported package manager: ${manager}. Supported managers: ${supported}`)
  }

  return selected
}

export function formatCommand({ command, args }) {
  return `${command} ${args.join(" ")}`
}

export async function prepareInstall({
  managerArg,
  cwd = process.cwd(),
  env = process.env,
  manifestPath = defaultManifestPath,
} = {}) {
  const packages = await loadPeerDependencies(manifestPath)

  if (packages.length === 0) {
    return { packages: [] }
  }

  const manager = detectManager({ managerArg, userAgent: env.npm_config_user_agent ?? "", cwd })
  const command = buildInstallCommand(manager, packages)

  return {
    manager,
    packages,
    command: command.command,
    args: command.args,
    printable: formatCommand(command),
  }
}

export async function runCli({ args = process.argv.slice(2), env = process.env, cwd = process.cwd() } = {}) {
  if (args.includes("--help")) {
    process.stdout.write(HELP)
    return 0
  }

  const argValue = flag => {
    const index = args.indexOf(flag)
    if (index === -1) return undefined
    return args[index + 1]
  }

  const managerArg = argValue("--manager")
  const dryRun = args.includes("--dry-run")

  try {
    const result = await prepareInstall({ managerArg, cwd, env })

    if (!result.packages || result.packages.length === 0) {
      process.stdout.write("No peer dependencies found on @signmax/config.\n")
      return 0
    }

    if (dryRun) {
      process.stdout.write(`${result.printable}\n`)
      return 0
    }

    process.stdout.write(`Running: ${result.printable}\n`)

    const child = spawn(result.command, result.args, {
      stdio: "inherit",
    })

    return await new Promise((resolve, reject) => {
      child.on("close", code => {
        if (code === 0) {
          resolve(0)
        } else {
          reject(new Error(`${result.command} exited with code ${code}`))
        }
      })

      child.on("error", error => {
        reject(error)
      })
    })
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 1
  }
}

const isDirectExecution = (() => {
  const [argvPath] = process.argv.slice(1, 2)

  if (!argvPath) return false

  try {
    return realpathSync(argvPath) === realpathSync(__filename)
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false
    }

    throw error
  }
})()

if (isDirectExecution) {
  runCli()
    .then(code => {
      process.exit(code)
    })
    .catch(error => {
      process.stderr.write(`${error.message}\n`)
      process.exit(1)
    })
}
