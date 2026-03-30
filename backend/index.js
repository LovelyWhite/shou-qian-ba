const path = require('path')
const fs = require('fs')

require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')

const apiRouter = require('./src/routes/api')
const adminRouter = require('./src/routes/admin')
const pagesRouter = require('./src/routes/pages')

const PORT = Number(process.env.PORT || 3000)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shouqianba'

async function main() {
  await mongoose.connect(MONGODB_URI)

  const app = express()

  const uploadsDir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  app.set('views', path.join(__dirname, 'src', 'views'))
  app.set('view engine', 'ejs')

  app.use(morgan('dev'))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use('/public', express.static(path.join(__dirname, 'public')))
  app.use('/uploads', express.static(uploadsDir))

  app.get('/', (req, res) => {
    res.redirect('/admin/applications')
  })

  app.use('/api', apiRouter)
  app.use(apiRouter)
  app.use('/admin', adminRouter)
  app.use(pagesRouter)

  app.use((req, res) => {
    res.status(404).send('Not Found')
  })

  app.use((err, req, res, next) => {
    const status = err && err.status ? err.status : 500
    const message = err && err.message ? err.message : 'Server Error'
    if (req.originalUrl.startsWith('/api/')) {
      res.status(status).json({ error: message })
      return
    }
    res.status(status).send(message)
  })

  app.listen(PORT, () => {
    console.log(`[backend] listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('[backend] failed to start', err)
  process.exitCode = 1
})
