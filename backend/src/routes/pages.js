const express = require('express')

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
    const id = req.params.id
    const buf = await wechat.getWxaCodeUnlimited({
      scene: id,
      page: 'pages/index/index',
      check_path: false,
      env_version: 'trial',
    })
    res.setHeader('Content-Type', 'image/png')
    res.send(buf)
  } catch (err) {
    next(err)
  }
})

module.exports = router
