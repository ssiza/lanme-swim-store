const readFlag = (sources: string[], flag: string) => {
  for (let index = 0; index < sources.length; index += 1) {
    const value = sources[index]

    if (value === flag && sources[index + 1]) {
      return sources[index + 1]
    }

    if (value?.startsWith(`${flag}=`)) {
      return value.slice(flag.length + 1)
    }
  }

  return undefined
}

const hasToken = (sources: string[], token: string) =>
  sources.some((value) => value === token || value === `--${token}`)

export const getExecArgSources = (args: string[] = []) => [
  ...args,
  ...process.argv.slice(2),
]

export const isDryRun = (args: string[] = []) =>
  hasToken(getExecArgSources(args), "dry-run")

export const isForce = (args: string[] = []) =>
  hasToken(getExecArgSources(args), "force")

export const getExecFlagValue = (args: string[], flag: string) =>
  readFlag(getExecArgSources(args), flag) ??
  readFlag(getExecArgSources(args), `--${flag}`)
