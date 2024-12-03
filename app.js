// app.js
App({
  onLaunch() {
    
  },
  globalData: {
    userInfo: null,
    chart_acc1: wx.getStorageSync('chart_acc1')?JSON.parse(wx.getStorageSync('chart_acc1')) : [],
    chart_acc2: wx.getStorageSync('chart_acc2')?JSON.parse(wx.getStorageSync('chart_acc2')) : [],
  },

  onHide() {
    wx.setStorageSync('chart_acc1', JSON.stringify(this.globalData.chart_acc1)),
    wx.setStorageSync('chart_acc2', JSON.stringify(this.globalData.chart_acc2))
  }
})
