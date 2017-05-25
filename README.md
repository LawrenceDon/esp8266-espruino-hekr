# esp8266-espruino-hekr
在esp8266模块上使用espruino对接氦氪云平台

### 必备条件：
* 1.ESP8266模块(Flash容量大于等于512KB)
* 2.氦氪云平台的开发者账号(个人开发者认证就可以了)

### 使用方法：
根据作品的通信协议，修改device.js的内容

代码开头的位置
```javascript
var ssid = "xxxxxx" 需要填写自己路由器的ssid
var pwd = "xxxxxx" 需要填写自己路由器的password
prodKey:"xxxxxx" 需要填写自己产品的prodKey
```

代码结尾的位置
```javascript
deviceInit,deviceFunction,parseAppSend,reportStatus这4个函数的内容需要开发者自己完成
function deviceInit() 初始化需要使用的GPIO和接口
function deviceFunction() 具体的设备功能在此函数中完成
function parseAppSend(jsonData) 根据产品通信协议，解析从云端下发的协议数据
function reportStatus(tcplink) 根据产品通信协议，上报设备当前状态
```
device-example.js使用的产品通信协议来自 [氦氪云入门教程04-基于氦氪主控协议的作品-SDK演示插座](http://bbs.hekr.me/forum.php?mod=viewthread&tid=74&fromuid=1)
实际使用时只需要把ssid，pwd和prodKey修改成自己的就可以了。

详细的使用实例请参考
[运行Espruino固件的Esp8266模块接入氦氪云之SDK演示插座](http://bbs.hekr.me/forum.php?mod=viewthread&tid=79)

### 注意事项：
* 本程序支持TCP断线重连，路由器断电或者断网恢复之后，TCP会重新连接。
当路由器突然断网的时候，因为目前espruino本身没提供主动断开tcp连接的机制，所以模块在10分钟之后才会触发TCP error然后进行TCP重连。如果不想等待10分钟，可以使用esp8266.reboot()重启模块。

* 本程序中的devTid是自动生成的，token是自动维护的，如果设备登录过一次云端，你想在代码中更改prodKey并上传的话，则需要手动在console中输入clearDevToken(flash,tokenAddress)清除之前的token，如果该设备已经被绑定，那需要先在APP中将该设备删除掉。
可以使用setDevToken(flash,tokenAddress,“yourDevToken”)设置token的值。

### 参考文档：

[氦氪云联网功能组件](http://docs.hekr.me/v4/%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/%E4%BA%91%E7%AB%AFAPI/%E8%AE%BE%E5%A4%87%E8%81%94%E7%BD%91/)

[设备云端通信协议](http://docs.hekr.me/v4/%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE/%E8%AE%BE%E5%A4%87%E4%BA%91%E7%AB%AF%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE/)

* 本程序涉及的上行服务指令如下：
  * getProdInfo
  * devLogin
  * reportDevInfo
  * devSend
  * heartbeat

* 本程序涉及的下行服务指令如下：
  * appSend
