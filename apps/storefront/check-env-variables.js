const c = require("ansi-colors")

const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    description:
      "Publishable API key from Medusa Admin → Settings → Publishable API Keys (starts with pk_).",
  },
  {
    key: "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
    description:
      "Public URL of the deployed Medusa backend (e.g. https://your-backend.up.railway.app).",
  },
  {
    key: "NEXT_PUBLIC_DEFAULT_REGION",
    description:
      "Default country code for storefront URLs (e.g. us). Baked in at build time.",
  },
]

function checkEnvVariables() {
  const missingEnvs = requiredEnvs.filter((env) => !process.env[env.key])

  const invalidEnvs = requiredEnvs.filter((env) => {
    if (env.key !== "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY") {
      return false
    }

    const value = process.env[env.key]
    return Boolean(value && !value.startsWith("pk_"))
  })

  if (missingEnvs.length > 0 || invalidEnvs.length > 0) {
    console.error(
      c.red.bold("\n🚫 Error: Missing or invalid environment variables\n")
    )

    missingEnvs.forEach((env) => {
      console.error(c.yellow(`  ${c.bold(env.key)} (missing)`))
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`))
      }
    })

    invalidEnvs.forEach((env) => {
      console.error(
        c.yellow(
          `  ${c.bold(env.key)} (invalid — must be a publishable key starting with pk_)`
        )
      )
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`))
      }
    })

    console.error(
      c.yellow(
        "\nSet these on the Railway storefront service before deploying. NEXT_PUBLIC_* variables are baked in at build time.\n"
      )
    )

    process.exit(1)
  }
}

module.exports = checkEnvVariables
