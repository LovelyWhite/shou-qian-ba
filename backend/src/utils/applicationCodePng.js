const fs = require('fs')
const path = require('path')
const { createCanvas, loadImage } = require('canvas')

const Application = require('../models/Application')

function createApplicationCodePngHandler({
  wechat,
  page = 'pages/index/index',
  envVersion = 'trial',
} = {}) {
  if (!wechat || typeof wechat.getWxaCodeUnlimited !== 'function') {
    throw new Error('Invalid wechat client')
  }

  return async (req, res, next) => {
    try {
      const applicationId = req.params.id ? String(req.params.id) : ''
      const application = await Application.findById(applicationId)
        .select('orderNo')
        .lean()
      if (!application) {
        res.status(404).send('未找到订单')
        return
      }

      const orderNo = application.orderNo ? String(application.orderNo) : ''
      if (!orderNo) {
        res.status(400).send('订单号为空')
        return
      }

      const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
      const codesDir = path.join(uploadsDir, 'codes')
      if (!fs.existsSync(codesDir)) fs.mkdirSync(codesDir, { recursive: true })

      const filePath = path.join(codesDir, `${orderNo}.png`)
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.sendFile(filePath)
        return
      }

      const buf = await wechat.getWxaCodeUnlimited({
        scene: applicationId,
        page,
        check_path: false,
        env_version: envVersion,
      })


      // 使用 canvas 在二维码下方添加文字 SN:xxxxxx
      const img = await loadImage(buf)
      const padding = 20 // 图片与文字间距
      const fontSize = 24
      const text = `SN:${orderNo}`

      // 计算画布尺寸
      const canvas = createCanvas(img.width, img.height + padding + fontSize)
      const ctx = canvas.getContext('2d')

      // 绘制原始二维码
      ctx.drawImage(img, 0, 0)

      // 设置文字样式并绘制
      ctx.fillStyle = '#000'
      ctx.font = `${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(text, canvas.width / 2, img.height + padding)

      // 将 canvas 转为 buffer
      const pngBuffer = canvas.toBuffer('image/png')

      const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
      await fs.promises.writeFile(tmpPath, pngBuffer)
      await fs.promises.rename(tmpPath, filePath)

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.sendFile(filePath)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = { createApplicationCodePngHandler }
