// const DEFAULT_BASE_URL = 'https://task.suxitech.cn'
const DEFAULT_BASE_URL = 'http://192.168.8.231:3000'
let baseUrl = DEFAULT_BASE_URL

function setBaseUrl(url) {
  baseUrl = url || ''
}

function getBaseUrl() {
  return baseUrl || DEFAULT_BASE_URL
}

function request(options) {
  const url = options && options.url ? options.url : ''
  const isAbsolute = /^https?:\/\//.test(url)
  const resolvedBaseUrl = getBaseUrl()
  if (!isAbsolute && !resolvedBaseUrl) {
    return Promise.reject(new Error('未配置接口地址'))
  }
  const fullUrl = isAbsolute ? url : `${resolvedBaseUrl}${url}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: (options && options.method) || 'GET',
      data: (options && options.data) || {},
      header: (options && options.header) || {},
      timeout: (options && options.timeout) || 15000,
      success(res) {
        if (!res) {
          reject(new Error('请求失败'))
          return
        }
        const statusCode = res.statusCode
        if (statusCode >= 200 && statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(new Error(`请求失败(${statusCode})`))
      },
      fail(err) {
        reject(err || new Error('网络异常'))
      },
    })
  })
}

function uploadFile(filePath, applicationId) {
  const resolvedBaseUrl = getBaseUrl()
  if (!resolvedBaseUrl) return Promise.reject(new Error('未配置接口地址'))

  return new Promise((resolve, reject) => {
    const query = applicationId ? `?applicationId=${encodeURIComponent(String(applicationId))}` : ''
    wx.uploadFile({
      url: `${resolvedBaseUrl}/upload${query}`,
      filePath,
      name: 'file',
      success(res) {
        const statusCode = res && res.statusCode
        if (!statusCode || statusCode < 200 || statusCode >= 300) {
          reject(new Error(`上传失败(${statusCode || 0})`))
          return
        }

        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch (e) {}
        }

        if (!data || !data.url) {
          reject(new Error('上传失败'))
          return
        }

        const url = /^https?:\/\//.test(data.url) ? data.url : `${resolvedBaseUrl}${data.url}`
        resolve({ ...data, url })
      },
      fail(err) {
        reject(err || new Error('上传失败'))
      },
    })
  })
}

function submitApply(payload) {
  return request({
    url: '/apply',
    method: 'POST',
    data: payload,
  })
}

function createAdminApplication(payload) {
  return request({
    url: '/applications',
    method: 'POST',
    data: payload,
    header: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

module.exports = {
  setBaseUrl,
  getBaseUrl,
  request,
  uploadFile,
  submitApply,
  createAdminApplication,
}
