const engine = require('../../utils/engine')

Page({
  data: {
    items: [
      {
        title: '收钱吧云音响',
        image: '/images/boxPro.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/hardware/smart-qr-pro',
      },
      {
        title: '收钱吧云打印机',
        image: '/images/print.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/hardware/cloud-printer-1',
      },
      {
        title: '收钱吧扫码王',
        image: '/images/saomawang4.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/hardware/qr-master-4',
      },
      {
        title: '收银机',
        image: '/images/cashTools.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/hardware/smart-cashier-system',
      },
      {
        title: '智慧POS',
        image: '/images/wisdompos.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/hardware/intelligent-pos',
      },
      {
        title: '餐饮SaaS',
        image: '/images/pickmoney.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/product/restaurant-saas-platform',
      },
      {
        title: '数电发票',
        image: '/images/e-invocing.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/product/e-invoicing',
      },
      {
        title: '智能POS',
        image: '/images/pos.jpg',
        url: 'https://task.suxitech.cn/shouqianba/zh/hardware/smart-pos',
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
