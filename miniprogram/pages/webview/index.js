Page({
  data: {
    src: '',
  },
  onLoad(options) {
    const src = decodeURIComponent((options && options.src) || '')
    const title = decodeURIComponent((options && options.title) || '')
    if (title) {
      wx.setNavigationBarTitle({ title })
    }
    this.setData({ src })
  },
})
