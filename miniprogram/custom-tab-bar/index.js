Component({
  data: {
    selected: 0,
    color: '#7d7e80',
    selectedColor: '#1989fa',
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home-o' },
      { pagePath: '/pages/products/index', text: '产品展示', icon: 'apps-o' },
      { pagePath: '/pages/about/index', text: '关于我们', icon: 'info-o' },
    ],
  },
  methods: {
    onTap(e) {
      const path = e.currentTarget.dataset.path
      const index = Number(e.currentTarget.dataset.index)
      if (!path) return
      if (!Number.isNaN(index)) this.setData({ selected: index })
      wx.switchTab({ url: path })
    },
    updateSelected() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const route = current && current.route ? `/${current.route}` : ''
      const selected = this.data.list.findIndex((item) => item.pagePath === route)
      if (selected >= 0) this.setData({ selected })
    },
  },
  lifetimes: {
    attached() {
      this.updateSelected()
    },
  },
  pageLifetimes: {
    show() {
      this.updateSelected()
    },
  },
})
