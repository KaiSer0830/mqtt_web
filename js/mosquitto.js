var mqtt;
var reconnectTimeout = 2000;
var host;
var port;
var topic;
var username;
var password;
var useTLS;
var cleansession;
function MQTTconnect() {
	mqtt = new Paho.MQTT.Client(
					host,
					port,
					"web_" + parseInt(Math.random() * 100,
					10));
	var options = {
		timeout: 3,
		useSSL: useTLS,
		cleanSession: cleansession,
		onSuccess: onConnect,
		onFailure: function (message) {
			$('#circle_index').attr('src','../img/circle_red.png');
			$('#status').val("Connection failed: " + message.errorMessage + "Retrying");
			setTimeout(MQTTconnect, reconnectTimeout);
		}
	};

	mqtt.onConnectionLost = onConnectionLost;
	mqtt.onMessageArrived = onMessageArrived;

	if (username != null) {
		options.userName = username;
		options.password = password;
	}
	console.log("Host="+ host + ", port=" + port + " TLS = " + useTLS + " username=" + username + " password=" + password);
	mqtt.connect(options);
}

function onConnect() {
	$('#circle_index').attr('src','../img/circle_green.png');
	$('#status').val('Connected to ' + host + ':' + port);
	// Connection succeeded; subscribe to our topic
	mqtt.subscribe(topic, {qos: 0});
	$('#topic').val(topic);
}

function onConnectionLost(response) {
	setTimeout(MQTTconnect, reconnectTimeout);
	$('#status').val("connection lost: " + response.errorMessage + ". Reconnecting");
	$('#circle_index').attr('src','../img/circle_red.png');
};

function onMessageArrived(message) {		//接收信息函数
	var topic = message.destinationName;
	var message = message.payloadString;
	var container_exist = false;
	var container_exist_arrayNum = 0;
	var container_exist_id = null;
	for(var i=0; i<container_list.length; i++) {
		if(topic == ('sys/' + container_list[i].container_name + '/status/online') || topic == ('sys/' + topic + '/status/online')) {
			container_exist = true;
			container_exist_arrayNum = i;
			container_exist_id = container_list[i].container_name_id;
		}
	}
	$('#receivedtopic').val(topic);
	$('#receivedtext').val(message);
	if(container_exist == true && topic == ('sys/' + container_list[container_exist_arrayNum].container_name + '/status/online') && message == 'online'){
		$("#" + container_exist_id).attr('class','container_name_online');
		container_list[container_exist_arrayNum].container_status = 'online';
		localStorage.setItem("container_list", JSON.stringify(container_list));
	}
	else if(container_exist == true && topic == ('sys/' + container_list[container_exist_arrayNum].container_name + '/status/online') && message == 'offline'){
		$("#" + container_exist_id).attr('class','container_name');
		container_list[container_exist_arrayNum].container_status = 'offline';
		localStorage.setItem("container_list", JSON.stringify(container_list));
	}
};

function button_onclick() {
	var tp = $('#sendtopic').val();
	var val = $('#textsend').val();
	if(tp==''||val=='')
	{
		alert("未设置发送信息！");
		return;
	}
	var message = new Paho.MQTT.Message(val);
	message.destinationName = tp;
	message.qos=0;
	mqtt.send(message);
};

function child_button_onclick() {
	var tp = $('#childsendtopic').val();
	var val = $('#childtextsend').val();
	if(tp==''||val=='')
	{
		alert("未设置发送信息！");
		return;
	}
	var message = new Paho.MQTT.Message(val);
	message.destinationName = tp;
	message.qos=0;
	mqtt.send(message);
	//mqtt.publish(tp, 0, val);
	$('#childsend').prepend('<li>' + 'Topic: ' + tp + '=========>>>>>' + 'Message: ' + val+ '</li>');
};

function keyUp(e) {   
   var currKey=0,e=e||event;   
   currKey=e.keyCode||e.which||e.charCode;   //按键码
   var keyName = String.fromCharCode(currKey);		//按键名 
   // alert("按键码: " + currKey + " 字符: " + keyName);
	if(currKey == 13){
		button_onclick();
	}
}   
document.onkeyup = keyUp;

