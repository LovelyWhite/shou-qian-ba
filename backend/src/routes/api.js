const path = require('path')
const crypto = require('crypto')

const express = require('express')
const multer = require('multer')

const Application = require('../models/Application')

const router = express.Router()

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads'))
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '')
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    cb(null, name)
  },
})

const upload = multer({ storage })

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: '缺少文件' })
    return
  }
  const url = `/uploads/${req.file.filename}`
  res.json({
    url,
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  })
})

async function createApplication(req, res, next) {
  try {
    const body = req.body || {}
    const id = body.id ? String(body.id) : ''

    const merchantName = String(body.merchantName || '').trim()
    const contact = String(body.contact || '').trim()
    const areaText = String(body.areaText || '').trim()
    const addressDetail = String(body.addressDetail || '').trim()
    const bankName = String(body.bankName || '').trim()

    const required = [
      [merchantName, '商户名称'],
      [contact, '联系方式'],
      [areaText, '经营地址'],
      [addressDetail, '详细地址'],
      [bankName, '开户银行名称'],
    ]

    for (const [value, label] of required) {
      if (!value) {
        res.status(400).json({ error: `缺少${label}` })
        return
      }
    }

    const payload = {
      merchantName,
      contact,
      areaCode: body.areaCode ? String(body.areaCode) : '',
      areaText,
      addressDetail,
      bankName,
      files: body.files || {},
      status: 'completed',
      completedAt: new Date(),
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    }

    if (id) {
      const doc = await Application.findByIdAndUpdate(id, payload, {
        new: true,
      })
      if (!doc) {
        res.status(404).json({ error: '订单不存在' })
        return
      }
      res.json({ id: doc._id })
      return
    }

    const doc = await Application.create(payload)

    res.json({ id: doc._id })
  } catch (err) {
    next(err)
  }
}

router.post('/applications', createApplication)
router.post('/apply', createApplication)

router.get('/applications', async (req, res, next) => {
  try {
    const items = await Application.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

const NEWS_ITEMS = [
  {
    title: '扫码王5重磅登场！卡码全能收，极速长续航，让生意收款全程无忧',
    time: '2026-03-20',
    cover:'https://images.wosaimg.com/d5/550c546938c26f943242fb5b6eb5b42c24c5d1.png?x-oss-process=image/format,webp',
    link: 'https://www.shouqianba.com/zh/about-us/news/008',
  },
  {
    title: '喜报！收钱吧连续5年获评收单外包机构优秀评级',
    cover:'https://images.wosaimg.com/98/ec6270ed15da00a24587e38c62eee2948e4822.png?x-oss-process=image/format,webp',
    time: '2026-01-13',
    link: 'https://www.shouqianba.com/zh/about-us/news/001',
  },
  {
    title: '收钱吧线上门店升级“微信小店”！支持更多缴费场景',
    time: '2025-03-27',
    cover:'https://images.wosaimg.com/aa/f8bae40ad03de0ba8bf55a2b5c69c159715431.png?x-oss-process=image/format,webp',
    link: 'https://www.shouqianba.com/zh/about-us/news/002',
  },
]

router.get('/news', (req, res) => {
  res.json(NEWS_ITEMS)
})

module.exports = router
