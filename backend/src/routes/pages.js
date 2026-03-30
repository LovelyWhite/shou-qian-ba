const express = require('express')
const fs = require('fs')
const path = require('path')

const wechat = require('../services/wechat')

const router = express.Router()

router.get('/agreement', (req, res) => {
  res.render('agreement', { title: '用户服务协议' })
})

router.get('/privacy', (req, res) => {
  res.render('privacy', { title: '隐私政策' })
})

router.get('/applications/:id/code.png', async (req, res, next) => {
  try {
    const rawId = req.params.id ? String(req.params.id) : ''
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!id || id !== rawId) {
      res.status(400).send('Bad Request')
      return
    }

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
    const codesDir = path.join(uploadsDir, 'codes')
    if (!fs.existsSync(codesDir)) fs.mkdirSync(codesDir, { recursive: true })

    const filePath = path.join(codesDir, `${id}.png`)
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.sendFile(filePath)
      return
    }

    const buf = await wechat.getWxaCodeUnlimited({
      scene: id,
      page: 'pages/index/index',
      check_path: false,
      env_version: 'trial',
    })

    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
    await fs.promises.writeFile(tmpPath, buf)
    await fs.promises.rename(tmpPath, filePath)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.sendFile(filePath)
  } catch (err) {
    next(err)
  }
})

module.exports = router
