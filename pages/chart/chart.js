import * as echarts from "../../ec-canvas/echarts";

const app = getApp();

function setOption(chart) {
  const option = {
    title: {
      text: "Accel",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["x", "y", "z", "-x", "g"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["1", "2", "3", "4", "5", "6", "7"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "x",
        type: "line",
        stack: "Total",
        data: [10, 132, 101, 134, 90, 230, 210],
      },
      {
        name: "y",
        type: "line",
        stack: "Total",
        data: [220, 182, 191, 234, 290, 330, 310],
      },
      {
        name: "z",
        type: "line",
        stack: "Total",
        data: [150, 232, 201, 154, 190, 330, 410],
      },
      {
        name: "-x",
        type: "line",
        stack: "Total",
        data: [320, 332, 301, 334, 390, 330, 320],
      },
      {
        name: "g",
        type: "line",
        stack: "Total",
        data: [820, 932, 901, 934, 1290, 1330, 1320],
      },
    ],
  };
  chart.setOption(option);
}

Page({
  onReady: function () {
    // 获取组件
    this.ecComponent = this.selectComponent("#mychart-dom-bar");
  },

  data: {
    ec: {
      // 将 lazyLoad 设为 true 后，需要手动初始化图表
      lazyLoad: false,
    },
    isLoaded: false,
    isDisposed: false,
  },

  // 点击按钮后初始化图表
  init: function () {
    this.ecComponent.init((canvas, width, height, dpr) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr, // new
      });
      setOption(chart);

      // 将图表实例绑定到 this 上，可以在其他成员函数（如 dispose）中访问
      this.chart = chart;

      this.setData({
        isLoaded: true,
        isDisposed: false,
      });

      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return chart;
    });
  },

  dispose: function () {
    if (this.chart) {
      this.chart.dispose();
    }

    this.setData({
      isDisposed: true,
    });
  },
});
