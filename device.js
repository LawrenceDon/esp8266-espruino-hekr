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
  mac:"",
  MAC:"",
  ssid:"",
  SSID:"",
  lanIp:""
};

var infoServer = {
    host:'info-dev.hekr.me',
    port:91
};

var server = {
	host:"",
	port:0
};   

var net = require('net');
var wifi = require("Wifi");
var flash = require("Flash");    
var msgId = -1;     
var esp8266 = require('ESP8266');
var respStrTemp = "";  
var heartbeatRespFlag = 0;

function getMsgId() 
{
  if(msgId == 65535) 
  {
    msgId = 0;
  } 
  else 
  {
    msgId++;
  }                
  return msgId;
}

function isRespComplete(data)
{
  var index0 = data.indexOf("\n");  
  if(index0 != -1)
  {
    return 1;  
  }
  return 0;   
}

function macToStr(mac) 
{
  if(mac.indexOf(":") != -1)
  {
    return macToStr(mac.replace(":",""));
  }
  else
  {
    return mac.toUpperCase();
  }
}

function getDevTid(wifi) 
{
  return "ESP_JS_" + macToStr(wifi.getIP().mac);   
}

function getDevToken(flash,address)
{
  var token = "";
  if(flash.read(4,address)[0] != 255)
  {
    token = E.toString(flash.read(32,address));  
  } 
  device.token = token; 
  return token;
}

function setDevToken(flash,address,data)
{
  clearDevToken(flash,address);
  flash.write(data,address);
}

function clearDevToken(flash,address)
{
  flash.erasePage(address);
}

function getProdInfo()
{
  var getInfo_tpl='{"msgId" : "{msgId}","action" : "getProdInfo","params" : {"devTid" : "{devTid}","prodKey" : "{prodKey}"}}\n';
  var getInfo_str=getInfo_tpl.replace('{msgId}',getMsgId()).replace('{devTid}',device.devTid).replace('{prodKey}',device.prodKey);
  device.getProdInfoTCPLink = net.connect(infoServer, function(){
    debugOutput("getProdInfo TCP connected!");
    debugOutput('getProdInfo send : ' + getInfo_str);
    device.getProdInfoTCPLink.write(getInfo_str);
  }); 
  getProdInfoBind(device.getProdInfoTCPLink);
}

function getProdInfoBind(client)
{
  client.on('data', function(data){
    respStrTemp += data;
    if(isRespComplete(respStrTemp) == 1)
    {
      debugOutput('getProdInfo recv : ' + respStrTemp);	
      var jsonData = JSON.parse(respStrTemp);
      if(jsonData.code == 200)
      {
        getProdInfoCallback(jsonData.params); 
      }
      else
      {
        debugOutput("getProdInfo recv : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }   
      respStrTemp = "";       
    } 
  });
  client.on('error', function(e){
    debugOutput("getProdInfo connection error!");
	  debugOutput(e);
    debugOutput("reconnect for getProdInfo");
    setTimeout(getProdInfo,5000);   
  });
  client.on('close', function(){
     debugOutput('getProdInfo connection closed');
  });
}
                                                                                                               
function getProdInfoCallback(obj)
{
  server.host = obj.serviceHost;                   
  server.port = obj.servicePort;
  
  devInfo.mid = obj.mid; 
  devInfo.workMode = obj.workMode;
  devInfo.tokenType = obj.tokenType;
  devInfo.serviceHost = obj.serviceHost;
  devInfo.servicePort = obj.servicePort;
  devInfo.mac = macToStr(wifi.getIP().mac); 
  devInfo.MAC = macToStr(wifi.getIP().mac); 
  devInfo.ssid = wifi.getDetails().ssid;
  devInfo.SSID = wifi.getDetails().ssid;  
  
  login();  
}            
                                
function login()
{
  var login_tpl='{"msgId" : "{msgId}","action" : "devLogin","params" : {"devTid" : "{devTid}","prodKey" : "{prodKey}","token" : "{token}"}}\n'; 
  var login_str=login_tpl.replace('{msgId}',getMsgId()).replace('{devTid}',device.devTid).replace('{prodKey}',device.prodKey).replace('{token}',getDevToken(flash,tokenAddress));  
  device.mainTCPLink = net.connect(server, function(){ 
    debugOutput("main TCP connected!");  
    debugOutput('CONNECTED TO : ' + server.host + ':' + server.port);	
    debugOutput('main send devLogin : ' + login_str);
    device.mainTCPLink.write(login_str);	
  });
  loginBind(device.mainTCPLink);
}

function loginBind(client)
{
  client.on('data', function(data){
    respStrTemp += data;
    if(isRespComplete(respStrTemp) == 1)
    {
      var jsonData = JSON.parse(respStrTemp);
      if(jsonData != undefined)
      { 
        parseData(jsonData);
      }
      respStrTemp = ""; 
     }     
  });

  client.on('error', function(e){
    debugOutput("main connection error!");
	  debugOutput(e);
  });

  client.on('close', function(){
    debugOutput('main connection closed');
    if(device.heartbeatIntervalID != 0)
    {
      clearInterval(device.heartbeatIntervalID);
      device.heartbeatIntervalID = 0;
    }
    device.mainTCPLinkReady = false;
    heartbeatRespFlag = 0;
    debugOutput("reconnect for login");
    setTimeout(login,5000);    
  });  
}

function reportDevInfo(devinfo,tcplink)
{
  var reportDevInfo_tpl='{"msgId" : "{msgId}","action" : "reportDevInfo","params" : {devInfo}}\n'; 
  var reportDevInfo_str=reportDevInfo_tpl.replace('{msgId}',getMsgId()).replace('{devInfo}',JSON.stringify(devinfo));
  debugOutput('main send reportDevInfo : ' + reportDevInfo_str);
  tcplink.write(reportDevInfo_str);
}

function parseData(jsonData)  
{
  switch(jsonData.action){
    case "heartbeatResp":
      if(jsonData.code == 200)
      {
        heartbeatRespFlag = 0;
        debugOutput("main receive : " + jsonData.action + " with msgId " + jsonData.msgId); 
      } 
      else
      {
        debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }
      break;
    case "devLoginResp":
      debugOutput("main receive : " + JSON.stringify(jsonData));
      if(jsonData.code == 200)
      {
        debugOutput("main receive : " + jsonData.action);
        if(jsonData.params.token != getDevToken(flash,tokenAddress))
        {      
          setDevToken(flash,tokenAddress,E.toArrayBuffer(jsonData.params.token));
          device.token = jsonData.params.token;
        }
        device.ctrlKey = jsonData.params.ctrlKey;
        device.bindKey = jsonData.params.bindKey;
        device.mainTCPLinkReady = true;
        reportDevInfo(devInfo,device.mainTCPLink);
        device.heartbeatIntervalID = setInterval(function(){ 
          if(heartbeatRespFlag == 0)
          {
            heartbeatRespFlag = 1;           
            var msgId = getMsgId(); 
            debugOutput("main send : heartbeat with msgId " + msgId);  
            device.mainTCPLink.write('{"msgId" : ' + msgId + ',"action" : "heartbeat"}\n');
          }
          else
          {
            device.mainTCPLinkReady = false;
            debugOutput("no heartbeat response");
            //esp8266.reboot(); //当路由器突然断网的时候，会执行到这里，如果不使用重启，模块10分钟之后才会触发tcp error然后进行tcp重连
          }
        }, 25000);          
      }
      else
      {
        debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }
      break;
    case "devSendResp":
      if(jsonData.code == 200)
      {
        debugOutput("main receive : " + jsonData.action);
      }
      else
      {
        debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }
      break;
    case "reportDevInfoResp":
      debugOutput("main receive : " + JSON.stringify(jsonData));
      if(jsonData.code == 200)
      {
        debugOutput("main receive : " + jsonData.action);
      }    
      else
      {
        debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }      
      break;
    case "errorResp":
      debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");  
      break;
    case "appSend":
      debugOutput("main receive : " + jsonData.action);
      var jsonAppSendResp = jsonData;
      jsonAppSendResp.action = "appSendResp";
      jsonAppSendResp.code = 200;
      jsonAppSendResp.desc = "success"; 
      sendData(JSON.stringify(jsonAppSendResp) + '\n',device.mainTCPLink);
      parseAppSend(jsonData);           
      break;
    default:
      debugOutput("main receive : " + JSON.stringify(jsonData));                
  }   
}

function sendData(data,tcplink)
{
  if(device.mainTCPLinkReady == true)
  {
    debugOutput("sendData : " + data);
    tcplink.write(data);   
  } 
  else
  {
    debugOutput("TCP link is not ready!");  
  }
} 

function sendParamsData(data,tcplink)
{
  var send_tpl='{"msgId" : "{msgId}","action" : "devSend","params" : {"devTid" : "{devTid}","appTid" : [],"data" : {{data}}}}\n'; 
  var send_str=send_tpl.replace('{msgId}',getMsgId()).replace('{devTid}',device.devTid).replace('{data}',data); 
  if(device.mainTCPLinkReady == true)
  {
    debugOutput("sendParamsData : " + send_str);
    tcplink.write(send_str);   
  } 
  else
  {
    debugOutput("TCP link is not ready!");  
  }
} 

function connectWifi(ssid,pwd)
{
  wifi.connect(ssid, {password:pwd}, function(e){
    debugOutput("WiFi connected!");
    device.devTid = getDevTid(wifi);
    devInfo.devTid = getDevTid(wifi);
    devInfo.lanIp = wifi.getIP().ip;    
    getProdInfo();
    });
  wifi.on('disconnected', function(details){
    debugOutput("WiFi disconnected!");
    debugOutput("  details.ssid : " + details.ssid);
    debugOutput("  details.reason : " + details.reason);
    wifi.getDetails(function(e){debugOutput("WiFi status : " + e.status);});
    if(details.reason == "auth_expire")
    {
      wifi.connect(ssid, {password:pwd}, function(e){
      debugOutput("WiFi reconnected!");
      });
    }
    });
  wifi.on('connected', function(details){
    debugOutput("get ip : " + details.ip);
    });    
  wifi.stopAP(); 
}

function debugOutput(content)
{
  if(debugOutputFlag == true)
  console.log(content);
  Serial2.println(content);
}

function logOn()
{
  debugOutputFlag = true;
}

function logOff()
{
  debugOutputFlag = false;
}

function onInit()
{
  deviceInit();
  connectWifi(ssid,pwd);
  deviceFunction();
}

//deviceInit,deviceFunction,parseAppSend,reportStatus这4个函数的内容需要开发者自己完成
function deviceInit() //初始化需要使用的GPIO和接口
{
  //示例: pinMode(D14,"output"); digitalWrite(D14,0);
}

function deviceFunction() //具体的设备功能在此函数中完成
{
  //espruino中常用的操作示例: 读GPIO值 digitalRead(D14), 写GPIO值 digitalWrite(D14,1), 处理按键事件 setWatch(function(e){console.log("Button pressed!");}, D13, {repeat: true, edge: 'rising', debounce: 50});  
}

function parseAppSend(jsonData) //根据产品通信协议，解析从云端下发的协议数据
{
  //jsonData是一个对象，可以从中获得协议数据，示例: jsonData.params.data.cmdId, jsonData.params.data.power
 
}

function reportStatus(tcplink) //根据产品通信协议，上报设备当前状态
{
  //可以使用sendParamsData发送协议数据给云端，示例: sendParamsData("\"cmdId\":1,\"power\":0",tcplink);      
}
