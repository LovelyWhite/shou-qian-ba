const express = require('express')

const router = express.Router()

router.get('/agreement', (req, res) => {
  res.render('agreement', { title: '用户服务协议' })
})

router.get('/privacy', (req, res) => {
  res.render('privacy', { title: '隐私政策' })
})

module.exports = router
