import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")
const sourceScriptsDir = join(backendRoot, "src/scripts")
const serverScriptsDir = join(backendRoot, ".medusa/server/scripts")

if (!existsSync(sourceScriptsDir)) {
  process.exit(0)
}

mkdirSync(serverScriptsDir, { recursive: true })

for (const file of readdirSync(sourceScriptsDir).filter((entry) =>
  entry.endsWith(".ts")
)) {
  copyFileSync(join(sourceScriptsDir, file), join(serverScriptsDir, file))
}
