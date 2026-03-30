const https = require('https')
const express = require('express')

const router = express.Router()

function registerProxy(prefix, hostname) {
  const route = new RegExp(`^\\/${prefix}(?:\\/.*)?$`)

  router.all(route, (req, res) => {
    const method = req.method || 'GET'
    if (method !== 'GET' && method !== 'HEAD') {
      res.status(405).end()
      return
    }

    const rawPath = req.path || ''
    const rest = rawPath.replace(new RegExp(`^\\/${prefix}\\/?`), '')
    const targetPath = rest ? `/${rest}` : '/'
    const queryIndex = req.originalUrl.indexOf('?')
    const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : ''
    const upstreamPath = `${targetPath}${query}`

    const hopByHop = new Set([
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailer',
      'transfer-encoding',
      'upgrade',
    ])

    const headers = { ...(req.headers || {}) }
    delete headers.host
    for (const key of hopByHop) delete headers[key]

    const upstreamReq = https.request(
      {
        protocol: 'https:',
        hostname,
        method,
        path: upstreamPath,
        headers: { ...headers, host: hostname },
      },
      (upstreamRes) => {
        res.status(upstreamRes.statusCode || 502)

        const upstreamHeaders = upstreamRes.headers || {}
        for (const [key, value] of Object.entries(upstreamHeaders)) {
          if (!key) continue
          const lower = key.toLowerCase()
          if (hopByHop.has(lower)) continue
          if (typeof value === 'undefined') continue
          res.setHeader(key, value)
        }

        if (method === 'HEAD') {
          res.end()
          upstreamRes.resume()
          return
        }

        upstreamRes.pipe(res)
      },
    )

    upstreamReq.on('error', (err) => {
      if (res.headersSent) {
        res.end()
        return
      }
      res.status(502).send((err && err.message) || 'Bad Gateway')
    })

    upstreamReq.setTimeout(15000, () => {
      upstreamReq.destroy(new Error('Upstream timeout'))
    })

    upstreamReq.end()
  })
}

registerProxy('wosaimg', 'images.wosaimg.com')
registerProxy('shouqianba', 'www.shouqianba.com')

module.exports = router
