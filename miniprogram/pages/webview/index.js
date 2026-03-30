Page({
  data: {
    src: '',
    originalSrc: '',
  },
  onLoad(options) {
    const src = decodeURIComponent((options && options.src) || '')
    const title = decodeURIComponent((options && options.title) || '')
    if (title) {
      wx.setNavigationBarTitle({ title })
    }
    this.setData({ src, originalSrc: src })
  },
  onWebviewLoad(e) {
    const current = (e && e.detail && e.detail.src) || ''
    const original = this.data.originalSrc || ''
    if (original && current && current !== original) {
      this.setData({ src: original })
    }
  },
  onWebviewMessage() {},
})
