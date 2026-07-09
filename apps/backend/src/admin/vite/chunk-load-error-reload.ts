/**
 * After a backend redeploy, hashed admin chunks change. Browsers with an open
 * admin session may still reference old lazy chunks (cached up to 1 year with
 * immutable). Reload once so index.html picks up the new asset manifest.
 */
const RELOAD_SNIPPET = `
;(function () {
  var storageKey = "medusa_admin_chunk_reload"
  function reloadOnce() {
    var key = storageKey + ":" + window.location.pathname
    try {
      if (sessionStorage.getItem(key) === "1") {
        return
      }
      sessionStorage.setItem(key, "1")
    } catch (_) {}
    window.location.reload()
  }
  window.addEventListener("vite:preloadError", function (event) {
    event.preventDefault()
    reloadOnce()
  })
  window.addEventListener("unhandledrejection", function (event) {
    var message = String(
      event.reason && event.reason.message ? event.reason.message : event.reason || ""
    )
    if (message.indexOf("Failed to fetch dynamically imported module") !== -1) {
      event.preventDefault()
      reloadOnce()
    }
  })
})()
`

export function chunkLoadErrorReload() {
  return {
    name: "medusa-admin-chunk-load-error-reload",
    transformIndexHtml: {
      order: "post" as const,
      handler(html: string) {
        return html.replace(
          "</head>",
          `  <script>${RELOAD_SNIPPET}</script>\n    </head>`
        )
      },
    },
  }
}
