const engine = require('../../utils/engine')

Page({
  data: {
    news: [],
    loadingNews: false,
    newsError: '',
  },
  onLoad() {
    this.fetchNews()
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
  fetchNews() {
    this.setData({ loadingNews: true, newsError: '' })
    engine
      .request({ url: '/news', method: 'GET' })
      .then((res) => {
        const list = Array.isArray(res) ? res : []
        const normalized = list.map((item, index) => {
          const id = `${index}-${(item.title || '').slice(0, 20)}`
          const title = item.title || ''
          const url = item.link || ''
          const date = item.time || ''
          const cover = item.cover || ''
          return { id, title, url: url, date, cover: cover }
        })
        this.setData({ news: normalized, loadingNews: false, newsError: '' })
      })
      .catch((err) => {
        const msg = (err && err.message) || '加载失败'
        this.setData({ newsError: msg, loadingNews: false })
      })
  },
  openNews(e) {
    const url =
      (e &&
        e.currentTarget &&
        e.currentTarget.dataset &&
        e.currentTarget.dataset.url) ||
      ''
    const title =
      (e &&
        e.currentTarget &&
        e.currentTarget.dataset &&
        e.currentTarget.dataset.title) ||
      '新闻'
    if (!url) return
    wx.navigateTo({
      url: `/pages/webview/index?src=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    })
  },
})
