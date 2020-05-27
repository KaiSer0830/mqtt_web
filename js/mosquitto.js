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
	mqtt.subscribe(topic, {qos: 0});
	
	//请求系统容器数据
	var order_obj = {"target": "container", "order": "ls", "name": "", "content": ""};
	var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
	message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
	message.qos=0;
	// console.log(message);
	mqtt.send(message);
	
	//请求系统镜像数据
	var order_obj = {"target": "image", "order": "ls", "name": "", "content": ""};
	var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
	message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
	message.qos=0;
	// console.log(message);
	mqtt.send(message);
}

function onConnectionLost(response) {
	setTimeout(MQTTconnect, reconnectTimeout);
	$('#status').val("connection lost: " + response.errorMessage + ". Reconnecting");
	$('#circle_index').attr('src','../img/circle_red.png');
};

function onMessageArrived(message) {		//接收信息函数
	var topic = message.destinationName;
	var message = message.payloadString;
	var current_gateway = storage.getItem('current_gateway');
	var current_container = storage.getItem('current_container');
	var image_list = JSON.parse(storage.getItem("image_list"));		//初始化容器列表
	var arr_topic = topic.split("/");
	
	//防止容器为空
	if(JSON.parse(storage.getItem("container_list")) != null) {	
		container_list = JSON.parse(storage.getItem("container_list"));		//初始化容器列表
	}
	// console.log(message);
	
	if(topic == ("sys/" + current_gateway + "/ack") && message != null) {
		console.log(message);
		var arr_mes = message.split(":");
		// console.log(arr_mes);
		// var rec_ack = message.charAt(message.length-1);
		
		//创建容器操作
		if(arr_mes[0] == "container" && arr_mes[2] == "run" && arr_mes[3] == '1' && storage.getItem("containerIsNew") == 1) {
			console.log("创建容器" + name + "成功！");
			var obj = JSON.parse(storage.getItem("create_ctm_temp_info"));
			var temp_info_obj = JSON.parse(obj.content);
			var container_image = temp_info_obj.image;
			var command = temp_info_obj.command;
			var memory = temp_info_obj.memory;
			var cpuset = temp_info_obj.cpuset;
			var cpushare = temp_info_obj.cpushare;
			var portmapping1 = temp_info_obj.portmapping1;
			var portmapping2 = temp_info_obj.portmapping;
			var content_obj = {"container_name":arr_mes[1], "container_image":container_image, "command":command, "memory":memory, "cpuset":cpuset, "cpushare":cpushare, "portmapping1": portmapping1, "portmapping2": portmapping2, "container_id": arr_mes[1] + "_ctn_id", "container_img_id": arr_mes[1] + "_ctn_img_id", "container_checkbox_id": arr_mes[1] + "_ctn_checkbox_id","container_name_id": arr_mes[1] + "_name_id", "container_status": "online", "send_message": [], "received_message": []};
			var container_exist_flag = false;
			for(var i = 0; i < container_list.length; i++) {
				if(arr_mes[1] == container_list[i].container_name) {
					container_exist_flag = true;
				}
			}
			if(!container_exist_flag) {
				container_list.push(content_obj);
			}
			storage.setItem("container_list", JSON.stringify(container_list));
			$('#container_frame').append('<div class="container_demo" id="' + arr_mes[1] + "_id" + '"><img src="../img/container_blue.png" width="200px" height="200px" onclick="skip_two(this)" id="' + arr_mes[1] + "_img_id" + '"/><div class="container_bot"><input type="checkbox" class="checkbox" id="' + arr_mes[1] + "_ctn_checkbox_id" + '"></input><span class="container_name_online" id="' + arr_mes[1] + "_name_id" + '">' + arr_mes[1] + '</span></div>')
		}
		
		//删除容器操作
		else if(arr_mes[0] == "container" && arr_mes[2] == "remove" && arr_mes[3] == '1'){
			for(var i = container_list.length; i > 0; i--) {
				if(arr_mes[1] == container_list[i-1].container_name) {
					$("#" + container_list[i-1].container_id).remove();
					container_list.splice(i-1, 1);
				}
			}
			storage.setItem("container_list", JSON.stringify(container_list));
		}
		
		//停止容器操作
		else if(arr_mes[0] == "container" && arr_mes[2] == "stop" && arr_mes[3] == '1'){
			for(var i = container_list.length; i > 0; i--) {
				if(arr_mes[1] == container_list[i-1].container_name) {
					container_list[i-1].container_status = "offline";
					$("#" + container_list[i-1].container_name_id).attr("class", "container_name");
				}
			}
			storage.setItem("container_list", JSON.stringify(container_list));
		}
		
		//开启容器操作
		else if(arr_mes[0] == "container" && arr_mes[2] == "run" && arr_mes[3] == '1' && storage.getItem("containerIsNew") == 0){
			for(var i = container_list.length; i > 0; i--) {
				if(arr_mes[1] == container_list[i-1].container_name) {
					container_list[i-1].container_status = "online";
					$("#" + container_list[i-1].container_name_id).attr("class", "container_name_online");
				}
			}
			storage.setItem("container_list", JSON.stringify(container_list));
		}
		
		//打包容器操作
		else if(arr_mes[0] == "container" && arr_mes[2] == "commit" && arr_mes[3] == '1'){
			var img_name = arr_mes[i];
			var img_id = arr_mes[i] + '_img_id';
			var img_checkbox_id = arr_mes[i] + '_img_checkbox_id';
			var content_obj = {"image_name":img_name, "image_id":img_id, "image_checkbox_id":img_checkbox_id};
			for(var i = 0; i < image_list.length; i++) {
				if(arr[i] == image_list[i].image_name) {
					image_list.splice(i, 1);
					$('#' + image_list[i].image_id).remove();
				}
			}
			image_list.push(content_obj);
			$('#image_frame').prepend('<div id="' + img_id + '" style="display: flex; flex-direction: row;align-items: center"><input type="checkbox" class="checkbox" id="' + img_checkbox_id + '"></input><li>' + img_name + '</li></div>'); 
			storage.setItem("image_list", JSON.stringify(image_list));
		}
		
		//删除镜像操作
		else if(arr_mes[0] == "image" && arr_mes[2] == "remove" && arr_mes[3] == '1'){
			for(var i = image_list.length; i > 0; i--) {
				if(arr_mes[1] == image_list[i-1].image_name) {
					$("#" + image_list[i-1].image_id).remove();
					image_list.splice(i-1, 1);
				}
			}
			storage.setItem("image_list", JSON.stringify(image_list));
		}
	}
	
	//获取错误日志操作
	else if(topic == ("sys/" + current_gateway + "/err") && message != null) {
		storage.setItem("err_log", message);
	}
	
	//获取系统镜像列表操作
	else if(topic == ("sys/" + current_gateway + "/imgls") && message != null) {
		image_list = new Array();
		console.log(message);
		var message_obj = JSON.parse(message);
		$('#image_frame').empty();
		for(var i = 0; i < Object.keys(message_obj).length; i++) {
			var image_id = Object.values(message_obj)[i].name + "_img_id";
			var image_name = Object.values(message_obj)[i].name;
			var image_checkbox_id = Object.values(message_obj)[i].name + "_img_checkbox_id";
			
			var content_obj = {"image_name":image_name, "image_id":image_id, "image_checkbox_id":image_checkbox_id};
			image_list.push(content_obj);
			$('#image_frame').prepend('<div id="' + image_id + '" style="display: flex; flex-direction: row;align-items: center"><input type="checkbox" class="checkbox" id="' + image_checkbox_id + '"></input><li>' + image_name + '</li></div>'); 
		}
		storage.setItem("image_list", JSON.stringify(image_list));
	}
	
	//获取系统容器列表操作
	else if(topic == ("sys/" + current_gateway + "/ctnls") && message != null) {
		console.log(message);
		var message_obj = JSON.parse(message);
		container_list = new Array();
		$('#container_frame').empty();
		if(Object.keys(message_obj).length == 0) {
			// container_list.splice(0, container_list.length);  //***********************
			container_list = new Array();
			storage.setItem("container_list", JSON.stringify(container_list));
		}
		for(var i = 0; i < Object.keys(message_obj).length; i++) {
			// console.log(Object.values(message_obj)[i].name);
			var container_id = Object.values(message_obj)[i].name + "_ctn_id";
			var container_img_id = Object.values(message_obj)[i].name + "_ctn_img_id";
			var container_checkbox_id = Object.values(message_obj)[i].name + "_ctn_checkbox_id";
			var container_name_id = Object.values(message_obj)[i].name + "_name_id";
			var create_container_name = Object.values(message_obj)[i].name;
			var container_status =  Object.values(message_obj)[i].status == "running" ? "online" : "offline";
			var content_obj = {"container_name":create_container_name, "container_image":Object.values(message_obj)[i].image, "command":Object.values(message_obj)[i].command, "memory":Object.values(message_obj)[i].memory, "cpuset":Object.values(message_obj)[i].cpuset, "cpushare":Object.values(message_obj)[i].cpushare, "portmapping1": Object.values(message_obj)[i].portmapping1, "portmapping2": Object.values(message_obj)[i].portmapping2, "container_id": container_id, "container_img_id": container_img_id, "container_checkbox_id": container_checkbox_id,"container_name_id": container_name_id, "container_status": container_status, "send_message": [], "received_message": []};
			
			var container_class = null;
			var container_exist_flag = false;
			for(var j = 0; j < container_list.length; j++) {
				if(create_container_name == container_list[j].container_name) {
					container_exist_flag = true;
				}
			}
			if(!container_exist_flag) {
				container_list.push(content_obj);
			}
			
			if(container_status == "online") {
				container_class = "container_name_online";
			}
			else {
				container_class = "container_name";
			}
			$('#container_frame').append('<div class="container_demo" id="' + container_id + '"><img src="../img/container_blue.png" width="200px" height="200px" onclick="skip_two(this)" id="' + container_img_id + '"/><div class="container_bot"><input type="checkbox" class="checkbox" id="' + container_checkbox_id + '"></input><span class="' + container_class + '" id="' + container_name_id + '">' + create_container_name + '</span></div>')
		}
		storage.setItem("container_list", JSON.stringify(container_list));
	}
	
	//获取mqtt上线下线操指令
	else if(arr_topic[0] == 'sys' && arr_topic[1] == current_gateway && arr_topic[3] == 'online') {
		var container_exist = false;
		var container_exist_arrayNum = null;
		var container_exist_id = null;
		for( var i = 0; i < container_list.length; i++) {
			if(arr_topic[2] == container_list[i]) {
				container_exist = true;
				container_exist_arrayNum = i;
				container_exist_id = container_list[i].container_name_id;
			}
		}
		if(container_exist == true && message == 'online'){
			$("#" + container_exist_id).attr('class','container_name_online');
			container_list[container_exist_arrayNum].container_status = 'online';
		}
		else if(container_exist == true && message == 'offline'){
			$("#" + container_exist_id).attr('class','container_name');
			container_list[container_exist_arrayNum].container_status = 'offline';
		}
		localStorage.setItem("container_list", JSON.stringify(container_list));
	}
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
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

