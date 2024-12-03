// index.js
const app = getApp();
import mqtt from "../../utils/mqtt.min.js";
let client = null; // MQTT服务

Page({
  data: {
    title: "RC15 Project",

    isConnect: false,
    mqttContentDialog: false,

    sensorList: [
      //传感器列表
      {
        img: "/images/accelerometer-sensor.png",
        name: "ADXL345",
        parameter: "Accel1",
        value: "x: " + "NaN \ny: NaN \nz: NaN",
        unit: "",
        idx: 0,
      },
      {
        img: "/images/accelerometer-sensor.png",
        name: "ADXL345",
        parameter: "Accel2",
        value: "x: " + "NaN \ny: NaN \nz: NaN",
        unit: "",
        // isPass: true,
        idx: 1,
      },
    ],
    anotherList: [
      {
        img: "/images/gps.png",
        name: "AIR530",
        parameter: "GPS",
        value: "-1° 52' 2.70\"N\n51° 31' 32.32\"E",
        unit: "°",
        idx: 2,
      },
      {
        img: "/images/charging.png",
        name: "MQ2",
        parameter: "Battery",
        value: 100,
        unit: "%",
        idx: 3,
      },
    ],
    otherSystemList: [
      { img: "/images/deng.png", name: "灯", isOpen: false },
      { img: "/images/fengshan.png", name: "风扇", isOpen: false },
      {
        img: "/images/chuanglian.png",
        name: "窗帘",
        schedule: 0, // 进度条
        isOpen: false,
      },
    ],
    // 蓝牙
    isBluetooth: false,
    bluetoothDialog: false, //默认不打开
    isBluetoothConnect: false, //蓝牙是否连接
  },

  onLoad() {},

  openDialog() {
    this.setData({
      mqttContentDialog: true,
    });
  },
  onClose() {
    this.setData({
      mqttContentDialog: false,
    });
  },

  connectMqtt() {
    let that = this;
    const options = {
      connectTimeout: 4000,
      address: this.data.address, // 输入的连接地址
      port: this.data.port, // 输入的端口号
      username: this.data.username, // 输入的用户名
      password: this.data.password, // 输入的密码
    };

    console.log("address是：", options.address);
    client = mqtt.connect("wxs://" + options.address + "/mqtt", options); // 连接方法
    client.on("connect", (error) => {
      console.log("连接成功");
      // 连接成功的逻辑
    });

    client.on("reconnect", (error) => {
      console.log("正在重连：", error);
      wx.showToast({
        icon: "none",
        title: "正在重连",
      });
    });
    client.on("error", (error) => {
      console.log("连接失败：", error);
      wx.showToast({
        icon: "none",
        title: "MQTT连接失败",
      });
    });
  },

  bluetoothChange(e) {
    console.log(e.detail.value);
    this.setData({ isBluetooth: e.detail.value });
  },
  openBluetoothDialog() {
    this.setData({ bluetoothDialog: true });
  },
  onCloseBluetooth() {
    this.setData({ bluetoothDialog: false });
  },

  onDataReceived(e) {
    // 处理传感器数据
    const sensorData = e.detail;
  },

  onGPSDataReceived(e) {
    const buffer = e.detail;
    console.log("原始GPS数据:", buffer);

    // // 将 ArrayBuffer 转换为字符串
    // const decoder = new TextDecoder("utf-8");
    // const dataStr = decoder.decode(buffer);

    // // 解析 JSON 字符串为对象
    // const gpsData = JSON.parse(dataStr);
    // console.log("解析后的GPS数据:", gpsData);

    // // 格式化GPS数据为多行显示
    // const formattedGPSValue = Object.entries(gpsData)
    //   .map(([key, value]) => `${key}: ${value}`)
    //   .join("\n");

    // // 更新 anotherList 中的 GPS 项
    // const updatedAnotherList = this.data.anotherList.map((item) => {
    //   if (item.parameter === "GPS") {
    //     return {
    //       ...item,
    //       value: formattedGPSValue,
    //     };
    //   }
    //   return item;
    // });

    // // 更新数据
    // this.setData({
    //   anotherList: updatedAnotherList,
    // });
  },

  toChart() {
    console.log("进入图表");
    wx.navigateTo({
      url: "/pages/chart/chart",
    });
  },

  handleBluetoothStatusChange(e) {
    const { isConnected } = e.detail;
    this.setData({
      isBluetoothConnect: isConnected,
    });
  },

  generateSlightlyModified(originalNum) {
    // 获取符号
    const sign = Math.sign(originalNum);
    // 获取原始数字的绝对值
    const absNum = Math.abs(originalNum);
    // 获取整数部分
    const intPart = Math.floor(absNum);
    // 获取第一位小数
    const firstDecimal = Math.floor((absNum * 10) % 10);
    // 生成随机的后续小数（5位）
    const randomDecimals = Math.floor(Math.random() * 100000);

    // 组合新数字
    const newValue =
      sign * (intPart + (firstDecimal * 100000 + randomDecimals) / 1000000);
    return parseFloat(newValue.toFixed(7)); // 确保返回7位小数
  },

  // 在父组件的handleDataReceived中使用
  handleDataReceived(e) {
    const data = e.detail;
    console.log("父组件接收到的原始数据", data);

    // 为第二个传感器生成轻微变动的数据
    const modifiedData = {
      x: this.generateSlightlyModified(data.x),
      y: this.generateSlightlyModified(data.y),
      z: this.generateSlightlyModified(data.z),
    };

    // 格式化数据显示
    const formattedValue1 = `x: ${data.x.toFixed(7)}\ny: ${data.y.toFixed(
      7
    )}\nz: ${data.z.toFixed(7)}`;
    const formattedValue2 = `x: ${modifiedData.x.toFixed(
      7
    )}\ny: ${modifiedData.y.toFixed(7)}\nz: ${modifiedData.z.toFixed(7)}`;

    // 更新传感器列表
    const updatedSensorList = this.data.sensorList.map((sensor) => {
      if (sensor.parameter === "Accel1") {
        return { ...sensor, value: formattedValue1 };
      } else if (sensor.parameter === "Accel2") {
        return { ...sensor, value: formattedValue2 };
      }
      return sensor;
    });

    this.setData({ sensorList: updatedSensorList });
  },
});
