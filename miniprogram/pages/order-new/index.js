const engine = require('../../utils/engine')

Page({
  data: {
    form: {
      orderNo: '',
      remark: '',
    },
    createdId: '',
    codeUrl: '',
  },
  onFieldChange(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail
    if (!key) return
    this.setData({ [`form.${key}`]: value })
  },
  onSubmit() {
    const orderNo = String(this.data.form.orderNo || '').trim()
    const remark = String(this.data.form.remark || '').trim()
    if (!orderNo) {
      wx.showToast({ title: '请输入订单号', icon: 'none' })
      return
    }
    wx.showLoading({ title: '提交中' })
    engine
      .createAdminApplication({ orderNo, remark })
      .then((res) => {
        const id = res && res.id ? String(res.id) : ''
        if (!id) {
          wx.showToast({ title: '创建失败', icon: 'none' })
          return
        }
        const base = engine.getBaseUrl()
        const codeUrl = `${base}/applications/${id}/code.png`
        this.setData({ createdId: id, codeUrl })
        wx.showToast({ title: '创建成功', icon: 'none' })
      })
      .catch((err) => {
        wx.showToast({ title: err && err.message ? err.message : '提交失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
})
