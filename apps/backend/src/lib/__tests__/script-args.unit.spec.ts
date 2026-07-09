import { getExecArgSources, isDryRun, isForce } from "../script-args"

describe("script args", () => {
  it("detects dry-run from medusa exec args and process argv", () => {
    expect(isDryRun(["--handle", "fanarc-denim-short", "--dry-run"])).toBe(true)
    expect(isDryRun(["dry-run"])).toBe(true)
    expect(isDryRun(["--handle", "fanarc-denim-short"])).toBe(false)
  })

  it("detects force from args", () => {
    expect(isForce(["--force"])).toBe(true)
    expect(isForce(["force"])).toBe(true)
    expect(isForce([])).toBe(false)
  })

  it("merges script args with process argv sources", () => {
    expect(getExecArgSources(["--preset", "shorts-sizes"])).toContain(
      "--preset"
    )
  })
})
