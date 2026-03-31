const express = require('express')
const fs = require('fs')
const path = require('path')

const ExcelJS = require('exceljs')

const Application = require('../models/Application')
const wechat = require('../services/wechat')
const { createApplicationCodePngHandler } = require('../utils/applicationCodePng')
const {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  clearAuthCookie,
  isAuthed,
  safeNextUrl,
  setAuthCookie,
} = require('../utils/adminAuth')

const router = express.Router()

function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    hour12: false,
    timeZone: 'Asia/Shanghai',
  })
}

function statusText(status) {
  if (status === 'completed') return '已完成'
  return '未完成'
}

router.get('/login', (req, res) => {
  if (isAuthed(req)) {
    res.redirect(
      safeNextUrl(req.query && req.query.next ? String(req.query.next) : ''),
    )
    return
  }
  const err = req.query && req.query.err ? String(req.query.err) : ''
  const next = req.query && req.query.next ? String(req.query.next) : ''
  res.render('admin/login', { title: '登录', err, next })
})

router.post('/login', (req, res) => {
  const username = String((req.body && req.body.username) || '').trim()
  const password = String((req.body && req.body.password) || '').trim()
  const next = safeNextUrl(
    String((req.body && req.body.next) || (req.query && req.query.next) || ''),
  )

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const secure =
      Boolean(req.secure) ||
      String(req.get('x-forwarded-proto') || '').toLowerCase() === 'https'
    setAuthCookie(res, secure)
    res.redirect(next)
    return
  }

  res.redirect(`/admin/login?err=1&next=${encodeURIComponent(next)}`)
})

router.get('/logout', (req, res) => {
  const secure =
    Boolean(req.secure) ||
    String(req.get('x-forwarded-proto') || '').toLowerCase() === 'https'
  clearAuthCookie(res, secure)
  res.redirect('/admin/login')
})

router.get('/applications', async (req, res, next) => {
  try {
    const rawPage = req.query && req.query.page ? Number(req.query.page) : 1
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
    const pageSize = 10

    const total = await Application.countDocuments()
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)

    const items = await Application.find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * pageSize)
      .limit(pageSize)
      .lean()

    res.render('admin/index', {
      items,
      formatDate,
      statusText,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/applications/export.xlsx', async (req, res, next) => {
  try {
    const items = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean()

    const baseUrl = `${req.protocol}://${req.get('host')}`

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'shou-qian-ba'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('申请列表', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    sheet.columns = [
      { header: '订单号', key: 'orderNo', width: 20 },
      { header: '更新时间', key: 'updatedAt', width: 20 },
      { header: '商户名称', key: 'merchantName', width: 20 },
      { header: '联系方式', key: 'contact', width: 16 },
      { header: '省市区', key: 'areaText', width: 18 },
      { header: '详细地址', key: 'addressDetail', width: 28 },
      { header: '开户银行名称', key: 'bankName', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '完成时间', key: 'completedAt', width: 20 },
      { header: '详情链接', key: 'detailUrl', width: 38 },
      { header: '小程序码链接', key: 'codeUrl', width: 38 },
      { header: '状态', key: 'status', width: 10 },
    ]

    sheet.getRow(1).font = { bold: true }
    sheet.getColumn('addressDetail').alignment = {
      wrapText: true,
      vertical: 'top',
    }
    sheet.getColumn('remark').alignment = { wrapText: true, vertical: 'top' }

    for (const item of items) {
      const detailUrl = `${baseUrl}/admin/applications/${item._id}`
      const codeUrl = `${baseUrl}/applications/${item._id}/code.png`

      const row = sheet.addRow({
        orderNo: item.orderNo || '',
        updatedAt: formatDate(item.updatedAt),
        merchantName: item.merchantName || '',
        contact: item.contact || '',
        areaText: item.areaText || '',
        addressDetail: item.addressDetail || '',
        bankName: item.bankName || '',
        remark: item.remark || '',
        completedAt: formatDate(item.completedAt),
        detailUrl: '',
        codeUrl: '',
        status: statusText(item.status),
      })

      row.getCell('detailUrl').value = { text: detailUrl, hyperlink: detailUrl }
      row.getCell('codeUrl').value = { text: codeUrl, hyperlink: codeUrl }
    }

    const fileName = `applications_${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'no-store')

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    next(err)
  }
})

router.get('/applications/new', (req, res) => {
  res.render('admin/new', {
    values: { orderNo: '', remark: '' },
    statusText,
  })
})

router.post('/applications', async (req, res, next) => {
  try {
    const orderNo = String((req.body && req.body.orderNo) || '').trim()
    const remark = String((req.body && req.body.remark) || '').trim()

    const doc = await Application.create({
      orderNo,
      remark,
      status: 'pending',
      completedAt: null,
    })

    res.redirect(`/admin/applications/${doc._id}`)
  } catch (err) {
    next(err)
  }
})

router.get('/applications/:id', async (req, res, next) => {
  try {
    const item = await Application.findById(req.params.id).lean()
    if (!item) {
      res.status(404).send('Not Found')
      return
    }
    res.render('admin/show', { item, formatDate, statusText })
  } catch (err) {
    next(err)
  }
})

router.post('/applications/:id/remark', async (req, res, next) => {
  try {
    const id = req.params.id
    const remark = String((req.body && req.body.remark) || '').trim()
    const rawPage = req.body && req.body.page ? Number(req.body.page) : 1
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

    await Application.findByIdAndUpdate(id, { remark })
    res.redirect(`/admin/applications?page=${page}&saved=1`)
  } catch (err) {
    next(err)
  }
})

router.get(
  '/applications/:id/code.png',
  createApplicationCodePngHandler({ wechat }),
)

router.post('/applications/:id/delete', async (req, res, next) => {
  try {
    const id = req.params.id
    const doc = await Application.findById(id)
    if (doc) {
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
      const groups = doc.files || {}
      for (const key of Object.keys(groups)) {
        const list = Array.isArray(groups[key]) ? groups[key] : []
        for (const f of list) {
          const url = f && f.url
          if (typeof url === 'string' && url.startsWith('/uploads/')) {
            const filePath = path.join(uploadsDir, path.basename(url))
            try {
              await fs.promises.unlink(filePath)
            } catch (e) {}
          }
        }
      }
    }
    await Application.findByIdAndDelete(id)
    res.redirect('/admin/applications')
  } catch (err) {
    next(err)
  }
})

module.exports = router
