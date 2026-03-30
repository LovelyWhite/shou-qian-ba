const axios = require('axios')

let cachedToken = null
let cachedExpireAt = 0

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

async function getAccessToken() {
  const appid = process.env.WECHAT_APPID || ''
  const secret = process.env.WECHAT_SECRET || ''
  if (!appid || !secret) {
    throw new Error('未配置 WECHAT_APPID/WECHAT_SECRET')
  }

  const now = nowSeconds()
  if (cachedToken && cachedExpireAt - 60 > now) return cachedToken

  const url = 'https://api.weixin.qq.com/cgi-bin/token'
  const { data } = await axios.get(url, {
    params: { grant_type: 'client_credential', appid, secret },
    timeout: 15000,
  })

  if (!data || !data.access_token) {
    const msg = data && data.errmsg ? data.errmsg : '获取 access_token 失败'
    throw new Error(msg)
  }

  cachedToken = data.access_token
  cachedExpireAt = now + Number(data.expires_in || 0)
  return cachedToken
}

async function getWxaCodeUnlimited(params) {
  const accessToken = await getAccessToken()
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`

  const res = await axios.post(url, params, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  })

  const contentType = String(res.headers && res.headers['content-type'] ? res.headers['content-type'] : '')
  if (contentType.includes('application/json')) {
    let json = null
    try {
      json = JSON.parse(Buffer.from(res.data).toString('utf8'))
    } catch (e) {}
    const msg = (json && json.errmsg) || '生成小程序码失败'
    throw new Error(msg)
  }

  return Buffer.from(res.data)
}

module.exports = {
  getWxaCodeUnlimited,
}
