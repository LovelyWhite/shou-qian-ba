const engine = require('../../utils/engine')

Page({
  data: {
    items: [
      {
        title: '收钱吧云音响',
        image: '/images/boxPro.jpg',
        url: 'https://www.shouqianba.com/boxPro.html',
      },
      {
        title: '收钱吧云打印机',
        image: '/images/print.jpg',
        url: 'https://www.shouqianba.com/print.html',
      },
      {
        title: '收钱吧扫码王',
        image: '/images/saomawang4.jpg',
        url: 'https://h5.shouqianba.com/product/saomawang4',
      },
      {
        title: '收银机',
        image: '/images/cashTools.jpg',
        url: 'https://www.shouqianba.com/cashTools.html',
      },
      {
        title: '手持收银机',
        image: '/images/wisdompos.jpg',
        url: 'https://www.shouqianba.com/wisdompos.html',
      },
      {
        title: '扫码点餐',
        image: '/images/pickmoney.jpg',
        url: 'https://www.shouqianba.com/pickmoney.html',
      },
      {
        title: '数电发票',
        image: '/images/e-invocing.jpg',
        url: 'https://www.shouqianba.com/zh/product/e-invoicing',
      },
      {
        title: '收银一体机',
        image: '/images/pos.jpg',
        url: 'https://www.shouqianba.com/pos.html',
      },
    ],
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
  openProduct(e) {
    const url = e.currentTarget.dataset.url || ''
    const title = e.currentTarget.dataset.title || ''
    if (!url) return
    wx.navigateTo({
      url: `/pages/webview/index?src=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    })
  },
})
