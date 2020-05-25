var mqtt;
var reconnectTimeout = 2000;
var host;
var port;
var child_topic;
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
			$('#childstatus').val("Connection failed: " + message.errorMessage + "Retrying");
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
	// Connection succeeded; subscribe to our topic
	// mqtt.subscribe('sys/'+child_topic+'/msg/data', {qos: 0});
	mqtt.subscribe('#', {qos: 0});
}

function onConnectionLost(response) {
	$('#circle_index').attr('src','../img/circle_red.png');
	setTimeout(MQTTconnect, reconnectTimeout);
};

function onMessageArrived(message) {		//接收信息函数
	var topic = message.destinationName;
	var message = message.payloadString;
	
	var container_list = storage.getItem("container_list");
	var image_list = storage.getItem("image_list");
	var current_gateway = storage.getItem('current_gateway');
	var current_container = storage.getItem('current_container');

	var container_exist = false;
	var container_exist_arrayNum = null;
	var container_exist_id = null;
	var container_status = 'offline';
	var containerIsCurrent = false;
	
	var arr = topic.split('/');
	
	if(arr[0] == 'sys' && arr[1] == current_gateway) {
		for(var i = 0; i < container_list.length; i++) {		//获取在线离线状态与获取任意容器上线信息
			if(arr[2]  == container_list[i]) {
				container_exist = true;
				container_exist_arrayNum = i;
				container_exist_id = container_list[i].container_name_id;
				if(arr[2] == current_container) {
					containerIsCurrent = true;
				}
			}
		}
	}
	
	if(arr[3] == 'msg') {
		if(arr[2] == current_container) {
			storage.setItem("query_log", message);
		}
	}
	
	//上线离线功能显示
	if(container_exist == true && arr[0] == 'sys' && arr[3] == "online" && message == "online"){    //当收到上线指令时
		$("#" + container_exist_id).attr('class','container_name_online');
		container_list[container_exist_arrayNum].container_status = 'online';
		container_list[container_exist_arrayNum].received_message.push(topic + "@" + message);
		localStorage.setItem("container_list", JSON.stringify(container_list));
		
		if(containerIsCurrent) {
			document.getElementById('childonline_img').src="../img/online.png";
			$('#childonline_w').css('color', 'green');
			$('#childonline_w').html("在线");
			$('#childreceive').prepend('<li>' + 'Topic: ' + topic + '=====>>>>>' + 'Message: ' + message+ '</li>');
		}
	}
	
	else if(container_exist == true && arr[0] == 'sys' && arr[3] == "online"  && message == "offline"){   //当收到下线指令时
		$("#" + container_exist_id).attr('class','container_name');
		container_list[container_exist_arrayNum].container_status = 'offline';
		container_list[container_exist_arrayNum].send_message = [];
		container_list[container_exist_arrayNum].received_message = [];
		localStorage.setItem("container_list", JSON.stringify(container_list));
		
		if(containerIsCurrent) {
			document.getElementById('childonline_img').src="../img/offline.png";
			$('#childonline_w').css('color', 'red');
			$('#childonline_w').html("离线");
			$('#childsend').empty();
			$('#childreceive').empty();
		}
	}
	
	//非上线离线消息存储
	if(container_exist == true && container_list[container_exist_arrayNum].container_status == "online") {
		
		if(arr[0] == 'sys/' && arr[1] == current_gateway && arr[3] == '/msg/data') {
			if(message != 'online' && message != 'offline' && containerIsCurrent) {
				$('#childreceive').prepend('<li>' + 'Topic: ' + topic + '=====>>>>>' + 'Message: ' + message+ '</li>');
				container_list[container_exist_arrayNum].received_message.push(topic + "@" + message);
			}
			else if(message != 'online' && message != 'offline' && !containerIsCurrent) {
				container_list[container_exist_arrayNum].received_message.push(topic + "@" + message);
			}
		}
	}
	localStorage.setItem("container_list", JSON.stringify(container_list));
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
	//mqtt.publish(tp, 0, val);
	// $('#send').prepend('<li>' + 'Topic: ' + tp + '=====>>>>>' + 'Message: ' + val+ '</li>');
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
	$('#childsend').prepend('<li>' + 'Topic: ' + tp + '=====>>>>>' + 'Message: ' + val+ '</li>');
	for(let i = 0; i < container_list.length; i++) {
		if(tp == ('sys/' + container_list[i].container_name + '/msg/data') || tp == ('sys/' + container_list[i].container_name + '/status/online')) {
			if(tp == ('sys/' + container_list[i].container_name + '/status/online') && val == 'online') {
				container_list[i].send_message.push(tp + "@" + val);
				localStorage.setItem("container_list", JSON.stringify(container_list));
			}
			else if(container_list[i].container_status == 'online') {
				console.log(1);
				container_list[i].send_message.push(tp + "@" + val);
				localStorage.setItem("container_list", JSON.stringify(container_list));
			}
			
		}
	}
};

function keyUp(e) {   
   var currKey=0,e=e||event;   
   currKey=e.keyCode||e.which||e.charCode;   //按键码
   var keyName = String.fromCharCode(currKey);		//按键名 
   // alert("按键码: " + currKey + " 字符: " + keyName);
	if(currKey == 13){
		child_button_onclick();
	}
}   
document.onkeyup = keyUp;