import { areaList } from '../../utils/area-data/dist/index.js';
const engine = require('../../utils/engine')

Page({
  data: {
    showArea: false,
    agreed: false,
    applicationId: '',
    form: {
      merchantName: '',
      contact: '',
      areaCode: '',
      areaText: '',
      addressDetail: '',
      bankName: '',
    },
    fileLists: {
      idCardFront: [],
      idCardBack: [],
      bankCard: [],
      shopFront: [],
      shopInside: [],
      license: [],
    },
    areaList,
  },
  onLoad(options) {
    const id = options && options.id ? String(options.id) : ''
    if (id) this.setData({ applicationId: id })
  },
  onFieldChange(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail
    if (!key) return
    this.setData({ [`form.${key}`]: value })
  },
  openArea() {
    this.setData({ showArea: true })
  },
  closeArea() {
    this.setData({ showArea: false })
  },
  onAreaConfirm(e) {
    const values = e.detail.values || []
    const code = values[values.length - 1] && values[values.length - 1].code
    const text = values.map((v) => v && v.name).filter(Boolean).join('')
    this.setData({
      showArea: false,
      'form.areaCode': code || '',
      'form.areaText': text,
    })
  },
  onAfterRead(e) {
    const key = e.currentTarget.dataset.key
    const file = e.detail && e.detail.file
    if (!key || !file) return

    const normalized = Array.isArray(file) ? file : [file]
    const current = this.data.fileLists[key] || []
    const maxCountMap = { shopFront: 3 }
    const maxCount = maxCountMap[key] || 1
    const remaining = Math.max(0, maxCount - current.length)
    const toUpload = normalized.slice(0, remaining)
    if (toUpload.length === 0) return

    wx.showLoading({ title: '上传中' })

    Promise.all(
      toUpload.map((f) => {
        return engine.uploadFile(f.url).then((res) => {
          return { url: res.url, name: f.name, type: f.type }
        })
      })
    )
      .then((uploaded) => {
        const next = current.concat(uploaded).slice(0, maxCount)
        this.setData({ [`fileLists.${key}`]: next })
      })
      .catch((err) => {
        wx.showToast({ title: err && err.message ? err.message : '上传失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  onDelete(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    const index = e.detail && typeof e.detail.index === 'number' ? e.detail.index : -1
    const current = this.data.fileLists[key] || []
    if (index < 0) {
      this.setData({ [`fileLists.${key}`]: [] })
      return
    }
    const next = current.slice(0, index).concat(current.slice(index + 1))
    this.setData({ [`fileLists.${key}`]: next })
  },
  onAgreeChange(e) {
    this.setData({ agreed: !!e.detail })
  },
  onSubmit() {
    const form = this.data.form
    const fileLists = this.data.fileLists

    const requiredTextFields = [
      { key: 'merchantName', label: '商户名称' },
      { key: 'contact', label: '联系方式' },
      { key: 'areaText', label: '经营地址' },
      { key: 'addressDetail', label: '详细地址' },
      { key: 'bankName', label: '开户银行名称' },
    ]

    for (const item of requiredTextFields) {
      if (!String(form[item.key] || '').trim()) {
        wx.showToast({ title: `请填写${item.label}`, icon: 'none' })
        return
      }
    }

    const requiredFiles = [
      { key: 'idCardFront', label: '身份证人像面' },
      { key: 'idCardBack', label: '身份证国徽面' },
      { key: 'bankCard', label: '银行卡正面' },
      { key: 'shopFront', label: '店铺门头照' },
      { key: 'shopInside', label: '店铺内景照' },
    ]

    for (const item of requiredFiles) {
      if (!fileLists[item.key] || fileLists[item.key].length === 0) {
        wx.showToast({ title: `请上传${item.label}`, icon: 'none' })
        return
      }
    }

    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选用户服务协议及隐私政策', icon: 'none' })
      return
    }

    const payload = {
      id: this.data.applicationId,
      merchantName: form.merchantName,
      contact: form.contact,
      areaCode: form.areaCode,
      areaText: form.areaText,
      addressDetail: form.addressDetail,
      bankName: form.bankName,
      files: {
        idCardFront: fileLists.idCardFront,
        idCardBack: fileLists.idCardBack,
        bankCard: fileLists.bankCard,
        shopFront: fileLists.shopFront,
        shopInside: fileLists.shopInside,
        license: fileLists.license,
      },
    }

    wx.showLoading({ title: '提交中' })
    engine
      .submitApply(payload)
      .then(() => {
        wx.hideLoading()
        wx.navigateBack()
      })
      .catch((err) => {
        wx.hideLoading()
        wx.showToast({ title: err && err.message ? err.message : '提交失败', icon: 'none' })
      })
  },
  openAgreement() {
    const base = engine.getBaseUrl()
    const src = `${base}/agreement`
    wx.navigateTo({
      url: `/pages/webview/index?src=${encodeURIComponent(src)}&title=${encodeURIComponent('用户服务协议')}`,
    })
  },
  openPrivacy() {
    const base = engine.getBaseUrl()
    const src = `${base}/privacy`
    wx.navigateTo({
      url: `/pages/webview/index?src=${encodeURIComponent(src)}&title=${encodeURIComponent('隐私政策')}`,
    })
  },
})
