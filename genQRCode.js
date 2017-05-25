var devTid = "xxxxxx";
var bindKey = "xxxxxx";

var qrString = "http://www.hekr.me?action=bind&devTid=" + devTid + "&bindKey=" + bindKey;
window.onload = function(){
  document.getElementById("image").src="http://qr.topscan.com/api.php?text="+encodeURIComponent(qrString);
};

              
