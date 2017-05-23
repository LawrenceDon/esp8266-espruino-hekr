/*
Author: LawrenceDon 
Mail: lawrencedon@163.com
QQ: 20515042 
Website: www.espruino.cn
Github: github.com/LawrenceDon/esp8266-espruino-hekr
MIT License 
Copyright (c) 2017 LawrenceDon
*/

var debugOutputFlag = true; //设置是否输出debug信息，也可以在espruino的console中使用logOn()和logOff()函数来打开或者关闭debug信息输出
var ssid = "xxxxxx"; //需要填写自己路由器的ssid
var pwd = "xxxxxx"; //需要填写自己路由器的password
var tokenAddress = 487424; //默认使用该值，不需要更改。使用ESP8266库的getFreeFlash函数获得空闲的可以使用的flash页面首地址和长度，示例：var esp8266 = require('ESP8266'); esp8266.getFreeFlash();
var device = { //在espruino的console中输入device，会显示该对象的内容，其中的devTid,prodKey,token,ctrlKey,bindKey我们需要记录下来，其中的devTid和bindKey将用于生成绑定设备时需要的二维码
	devTid:"",
	prodKey:"xxxxxx", //需要填写自己产品的prodKey。更改prodKey之前应该先在espruino的console中使用clearDevToken(flash,tokenAddress)清除之前的token，如果该设备已经被绑定，那需要先在APP中将该设备删除掉
	token:"",
  ctrlKey:"",
  bindKey:"",
  mainTCPLink:null,
  mainTCPLinkReady:false,
  getProdInfoTCPLink:null,
  heartbeatIntervalID:0
};

var devInfo = {
  devTid:"",
  mid:"",
  workMode:0,
  tokenType:2,
  serviceHost:"",
  servicePort:0,
  binVer:"0.1.0",
  binType:"NA",
  sdkver:"2.0.0",
  SDKVer:"2.0.0",
ÿ
