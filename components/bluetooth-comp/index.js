// pages/index/components/bluetooth-comp/bluetooth-comp.js
function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// 将字符串转为 ArrayBuffer
function str2ab(str) {
  let buf = new ArrayBuffer(str.length);
  let bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

Component({
  properties: {},

  data: {
    devices: [],
    connected: false,
    chs: [],
    sensorData: null,
    gpsData: null,
  },

  // bluetooth-comp/index.js
  methods: {
    /* 初始化蓝牙模块 */
    openBluetoothAdapter() {
      // 先关闭蓝牙模块再开启 防止断开后点连接连接不上
      this.closeBluetoothAdapter();

      wx.openBluetoothAdapter({
        success: (response) => {
          console.log("初始化蓝牙模块成功：openBluetoothAdapter", response);
          this.startBluetoothDevicesDiscovery();
        },
        fail: (err) => {
          if (err.errCode === 10001) {
            /* 监听蓝牙适配器状态变化事件 */
            wx.onBluetoothAdapterStateChange((res) => {
              console.log(
                "监听蓝牙适配器状态变化事件：onBluetoothAdapterStateChange",
                res
              );
              res.available && this.startBluetoothDevicesDiscovery();
            });
          }
        },
      });
    },
    /* 获取本机蓝牙适配器状态 */
    getBluetoothAdapterState() {
      wx.getBluetoothAdapterState({
        success: (res) => {
          console.log("getBluetoothAdapterState", res);
          if (res.discovering) {
            // 是否正在搜索设备
            this.onBluetoothDeviceFound();
          } else if (res.available) {
            // 蓝牙适配器是否可用
            this.startBluetoothDevicesDiscovery();
          }
        },
      });
    },
    /* 开始搜寻附近的蓝牙外围设备 */
    startBluetoothDevicesDiscovery() {
      // 开始扫描参数
      if (this._discoveryStarted) return;

      this._discoveryStarted = true;
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        success: (response) => {
          console.log(
            "开始搜寻附近的蓝牙外围设备：startBluetoothDevicesDiscovery",
            response
          );
          this.onBluetoothDeviceFound();
        },
        fail: (err) => {
          console.log("搜索设备失败", err);
          wx.showToast({
            title: "搜索设备失败",
            icon: "none",
          });
        },
      });
    },
    /* 停止搜寻附近的蓝牙外围设备。*/
    stopBluetoothDevicesDiscovery() {
      console.log("停止搜寻附近的蓝牙外围设备");
      wx.stopBluetoothDevicesDiscovery();
    },
    /* 监听搜索到新设备的事件 */
    onBluetoothDeviceFound() {
      wx.onBluetoothDeviceFound((res) => {
        res.devices.forEach((device) => {
          if (!device.name && !device.localName) {
            return;
          }

          const foundDevices = this.data.devices;
          const idx = inArray(foundDevices, "deviceId", device.deviceId);
          const data = {};
          if (idx === -1) {
            data[`devices[${foundDevices.length}]`] = device;
          } else {
            data[`devices[${idx}]`] = device;
          }
          this.setData(data);
        });
      });
    },
    /* 连接蓝牙低功耗设备。*/
    createBLEConnection(e) {
      const ds = e.currentTarget.dataset;
      const deviceId = ds.deviceId;
      const name = ds.name;
      wx.createBLEConnection({
        deviceId,
        success: () => {
          this.setData({
            connected: true,
            name,
            deviceId,
          });
          // 触发连接状态改变事件
          this.triggerEvent("BluetoothStatusChange", { isConnected: true });

          wx.showToast({
            title: "连接蓝牙设备成功",
            icon: "none",
          });
          this.getBLEDeviceServices(deviceId);
        },
        fail: (e) => {
          console.log("连接失败", e.errMsg);
          wx.showToast({
            title: "连接失败,错误信息: " + e.errMsg,
            icon: "none",
          });
        },
      });
      // 停止搜寻蓝牙设备
      this.stopBluetoothDevicesDiscovery();
    },
    /* 断开与蓝牙低功耗设备的连接。 */
    closeBLEConnection() {
      console.log("断开与蓝牙低功耗设备的连接");
      wx.showToast({
        title: "已断开和蓝牙设备的连接",
        icon: "none",
      });
      wx.closeBLEConnection({
        deviceId: this.data.deviceId,
      });
      this.setData({
        connected: false,
        chs: [],
        canWrite: false,
      });
      // 触发连接状态改变事件
      this.triggerEvent("BluetoothStatusChange", { isConnected: false });
    },
    /* 获取蓝牙低功耗设备所有服务 (service) */
    getBLEDeviceServices(deviceId) {
      wx.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          for (let i = 0; i < res.services.length; i++) {
            if (res.services[i].isPrimary) {
              this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid);
              return;
            }
          }
        },
      });
    },
    /* 获取蓝牙低功耗设备某个服务中所有特征 (characteristic)。 */
    getBLEDeviceCharacteristics(deviceId, serviceId) {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          for (let i = 0; i < res.characteristics.length; i++) {
            let item = res.characteristics[i];

            if (item.properties.read) {
              wx.readBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
              });
            }
            if (item.properties.write) {
              this.setData({
                canWrite: true,
              });
              this._deviceId = deviceId;
              this._serviceId = serviceId;
              this._characteristicId = item.uuid;
            }
            if (item.properties.notify || item.properties.indicate) {
              // 对所有可通知的特征值都开启监听
              wx.notifyBLECharacteristicValueChange({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
                state: true,
                success(res) {
                  console.log(
                    "notifyBLECharacteristicValueChange success",
                    res
                  );
                },
              });
            }
          }
        },
      });
      this.onBLECharacteristicValueChange();
    },
    /* 向蓝牙低功耗设备特征值中写入二进制数据 */
    writeBLECharacteristicValue(jsonStr) {
      let arrayBufferValue = str2ab(jsonStr);
      console.log(
        "发送数据给蓝牙",
        "原始字符串",
        jsonStr,
        "转换arrayBuffer",
        arrayBufferValue
      );

      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: this._serviceId, // 微信文档上是错误的
        characteristicId: this._characteristicId,
        value: arrayBufferValue, // 只能发送arrayBuffer类型数据
        success(res) {
          console.log("消息发送成功", res.errMsg);
          wx.showToast({
            title: "消息发送成功",
            icon: "none",
          });
        },
        fail(e) {
          console.log("发送消息失败", e);
          wx.showToast({
            title: "发送消息失败,错误信息: " + e.errMsg,
            icon: "none",
          });
        },
      });
    },
    closeBluetoothAdapter() {
      console.log("关闭蓝牙模块");
      wx.closeBluetoothAdapter();
      this._discoveryStarted = false;
    },

    // 将 ArrayBuffer 转换为字符串
    ab2str(buf) {
      return String.fromCharCode.apply(null, new Uint8Array(buf));
    },

    // 修改监听函数
    onBLECharacteristicValueChange() {
      wx.onBLECharacteristicValueChange((characteristic) => {
        const buffer = characteristic.value;
        const dataStr = this.ab2str(buffer);

        try {
          const dataObj = JSON.parse(dataStr);

          // 根据特征UUID区分数据类型
          if (
            characteristic.characteristicId.toLowerCase() ===
            "19b10002-e8f2-537e-4f6c-d104768a1214"
          ) {
            // GPS数据处理
            this.setData({
              gpsData: dataObj,
            });
            // 触发GPS数据事件
            this.triggerEvent("GPSDataReceived", dataObj);
          } else {
            // 原有传感器数据处理
            this.setData({
              sensorData: dataObj,
            });
            this.triggerEvent("DataReceived", dataObj);
          }

          console.log("解析后的数据对象", dataObj);
        } catch (e) {
          console.error("数据解析失败", e);
        }
      });
    },
  },
});
