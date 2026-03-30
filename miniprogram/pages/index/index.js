Page({
  data: {
    applicationId: '',
  },
  onLoad(options) {
    const scene = options && options.scene ? String(options.scene) : ''
    const id = options && options.id ? String(options.id) : ''
    const applicationId = id || (scene ? decodeURIComponent(scene) : '')
    if (applicationId) {
      this.setData({ applicationId })
      console.log('applicationId', applicationId)
    }
  },
  onApply() {
    const id = this.data.applicationId
    const url = id
      ? `/pages/apply/index?id=${encodeURIComponent(id)}`
      : '/pages/apply/index'
    wx.navigateTo({ url })
  },
  onShow() {
    if (!this.getTabBar) return

    try {
      const tabBar = this.getTabBar()
      if (tabBar && tabBar.updateSelected) tabBar.updateSelected()
      return
    } catch (e) {}

    try {
      this.getTabBar((tabBar) => {
        if (tabBar && tabBar.updateSelected) tabBar.updateSelected()
      })
    } catch (e) {}
  },
})
