var time;
var container_select_id = new Array();;
var storage = window.localStorage;
var gateway_list = new Array();
var container_class = null;
var container_list = new Array();
var gateway_data = JSON.parse(localStorage.getItem('gateway_list'));
var send_message = new Array();
var received_message =  new Array();
var current_gateway = null;
var image_list = new Array();
storage.setItem("image_list", JSON.stringify(image_list))

for(var i in gateway_data) {
	gateway_list.push(gateway_data[i])
};
var test_button_status = false;

function datetime() {
	var year = new Date().getFullYear();
	var month =new Date().getMonth() + 1 < 10? "0" + (new Date().getMonth() + 1): new Date().getMonth() + 1;
	var date =new Date().getDate() < 10? "0" + new Date().getDate(): new Date().getDate();
	var hh =new Date().getHours() < 10? "0" + new Date().getHours(): new Date().getHours();
	var mm =new Date().getMinutes() < 10? "0" + new Date().getMinutes(): new Date().getMinutes();
	var ss =new Date().getSeconds() < 10? "0" + new Date().getSeconds(): new Date().getSeconds();
	time = year + "年" + month + "月" + date + "日 " + "星期" + '日一二三四五六'.charAt(new Date().getDay()) + ' ' + hh + ':' + mm + ':' + ss;
	$('#time').html(time);
}

function skip_one(arg) {
	var name = $(arg).parent().attr('id').replace("_id", "");
	current_gateway = name;		//在mosquitto-child.js定义了
	storage.setItem("current_gateway", current_gateway);
	window.location.replace("html/container.html");
}

function skip_two(arg) {
	var name = $(arg).parent().attr('id').replace("_ctn_id", "");
	storage.setItem("current_container", name);
	window.location.replace("./child.html");
}

function goBack_one() {
	window.location.replace("../gateway.html");
}

function goBack_two() {
	current_container = null;
	storage.setItem('current_container', current_container);
	window.location.replace("container.html");
}

function add_gateway() {
	var gateway_name = prompt("请输入创建的网关名:","gateway")
	var gatewayTrue = true
	for(var i = 0; i < gateway_list.length; i++){
		if(gateway_name == gateway_list[i].gateway_name){
			gatewayTrue = false;
			alert('系统已有同名网关，请重新输入名称！');
			return;
		}
	}
	if(gateway_name != null && gatewayTrue){
		var name = gateway_name;
		var gateway_id = gateway_name + '_id';
		var img_id = gateway_name + '_img_id';
		var gateway_checkbox_id = gateway_name + '_checkbox'
		var select = false;
		// var container_status = 'offline';
		var obj = {"gateway_name":name, "gateway_id":gateway_id, "gateway_img_id":img_id, "gateway_checkbox_id":gateway_checkbox_id, "select":select};
		gateway_list.push(obj);
		storage.setItem("gateway_list", JSON.stringify(gateway_list));		//官方推荐使用
		// console.log(storage["container_list"]);
		$('#gateway_frame').append('<div class="gateway_demo" id="' + gateway_id + '"><img src="img/gateway.png" width="200px" height="200px" onclick="skip_one(this)" id="' + img_id + '"/><div style="gateway_bot"><input type="checkbox" class="checkbox" id="' + gateway_checkbox_id + '"></input><span class="gateway_name">' + gateway_name + '</span></div></div>')
	}
}

function delete_gateway() {
	var len = gateway_list.length;
	for(var j = len; j > 0; j--){
		var box=document.getElementById(gateway_list[j-1].gateway_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		if(box.checked == true) {
			$("#" + gateway_list[j-1].gateway_id).remove();
			gateway_list.splice(j-1, 1);
		}
	}
	localStorage.setItem("gateway_list", JSON.stringify(gateway_list));
}

function gateway_init() {
	for(let i = 0; i < gateway_list.length; i++){
		var gateway_name = gateway_list[i].gateway_name;
		var gateway_id = gateway_list[i].gateway_id;
		var img_id = gateway_list[i].gateway_img_id;
		var gateway_checkbox_id = gateway_list[i].gateway_checkbox_id; 
		// console.log(container_list[i]);
		$('#gateway_frame').append('<div class="gateway_demo" id="' + gateway_id + '"><img src="img/gateway.png" width="200px" height="200px" onclick="skip_one(this)" id="' + img_id + '"/><div style="gateway_bot"><input type="checkbox" class="checkbox" id="' + gateway_checkbox_id + '"></input><span class="gateway_name">' + gateway_name + '</span></div></div>')
	}
}

function container_main_init() {
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

function container_child_init() {
	var container_list = JSON.parse(storage.getItem("container_list"));
	var current_container = storage.getItem("current_container");		//获取当前容器信息
	$("#current_container_title").html("当前容器：" + current_container);	//显示容器框标题
	
	for(var i = 0; i < container_list.length; i++) {
		if(current_container == container_list[i].container_name) {
			if(container_list[i].container_status == 'online') {
				document.getElementById('childonline_img').src="../img/online.png";
				$('#childonline_w').css('color', 'green');
				$('#childonline_w').html("在线");
			}
			else if(container_list[i].container_status == 'offline') {
				document.getElementById('childonline_img').src="../img/offline.png";
				$('#childonline_w').css('color', 'red');
				$('#childonline_w').html("离线");
			}
			for(var j = 0; j < container_list[i].send_message.length; j++) {
				var temp_arr = container_list[i].send_message[j].split('@');
				$('#childsend').prepend('<li>' + 'Topic: ' + temp_arr[0] + '=====>>>>>' + 'Message: ' + temp_arr[1]+ '</li>');
			}
			for(var k = 0; k < container_list[i].received_message.length; k++) {
				var temp_arr = container_list[i].received_message[k].split('@');
				$('#childreceive').prepend('<li>' + 'Topic: ' + temp_arr[0] + '=====>>>>>' + 'Message: ' + temp_arr[1]+ '</li>');
			}
		}
	}
}

function add_container() {
	var create_container_name = $("#create_container_name").val();
	var create_image_name = $("#create_image_name").val();
	var create_order = $("#create_order").val();
	var create_storage_limit = $("#create_storage_limit").val();
	var create_cpu_core = $("#create_cpu_core").val();
	var create_time_splice = $("#create_time_splice").val();
	var portmapping1 = $("#create_port1").val();
	var portmapping2 = $("#create_port2").val();
	var container_id = create_container_name + "_id";
	var container_img_id = create_container_name + "_ctn_img_id";
	var container_checkbox_id = create_container_name + "_ctn_checkbox_id";
	var container_name_id = create_container_name + "_name_id";
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
	
	container_list = JSON.parse(localStorage.getItem('container_list'));
	if(create_container_name == "" || create_image_name == "" || create_order == "" || create_storage_limit == "" || create_cpu_core == "" || create_time_splice == "" || portmapping1 == "" || portmapping2 == "") {
		alert("请将创建容器信息填写完整！");
		return;
	}
	for(var i = 0; i < container_list.length; i++) {
		if(create_container_name == container_list[i].container_name) {
			alert("系统已有同名容器，请更换容器名称！");
			return;
		}
	}
	var content_obj = {"name":create_container_name, "image":create_image_name, "command":create_order, "memory":create_storage_limit, "cpuset":create_cpu_core, "cpushare":create_time_splice, "portmapping1": portmapping1, "portmapping2": portmapping2};
	var content_obj_str = JSON.stringify(content_obj);
	var order_obj = {"target":"container", "order": "run", "name": create_container_name, "content": content_obj_str};
	storage.setItem("create_ctm_temp_info", JSON.stringify(order_obj));
	
	var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
	message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
	message.qos=0;
	mqtt.send(message);
	console.log("发送创建" + create_container_name + "容器信息请求！")
	storage.setItem("containerIsNew", 1);
	
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

function delete_container() {
	container_list = JSON.parse(localStorage.getItem('container_list'));
	var len = container_list.length;
	for(var j = len; j > 0; j--){
		var box=document.getElementById(container_list[j-1].container_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		// console.log(box.checked);
		if(box.checked == true) {
			var order_obj = {"target":"container", "order": "remove", "name": container_list[j-1].container_name, "content": ""};
			var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
			message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
			message.qos=0;
			mqtt.send(message);
			console.log("发送删除" + container_list[j-1].container_name + "容器信息请求！")
		}
	}
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

function stop_container() {
	container_list = JSON.parse(localStorage.getItem('container_list'));
	var len = container_list.length;
	console.log(len);
	for(var j = len; j > 0; j--){
		var box=document.getElementById(container_list[j-1].container_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		if(box.checked == true) {
			var order_obj = {"target":"container", "order": "stop", "name": container_list[j-1].container_name, "content": ""};
			var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
			message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
			message.qos=0;
			mqtt.send(message);
			console.log("发送停止" + container_list[j-1].container_name + "容器信息请求！")
		}
	}
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

function start_container() {
	container_list = JSON.parse(localStorage.getItem('container_list'));
	var len = container_list.length;
	for(var j = len; j > 0; j--){
		var box=document.getElementById(container_list[j-1].container_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		if(box.checked == true) {
			var content_obj = {"name":container_list[j-1].container_name, "image":container_list[j-1].image, "command":container_list[j-1].command, "memory":container_list[j-1].memory, "cpuset":container_list[j-1].cpuset, "cpushare":container_list[j-1].cpushare, "portmapping1": container_list[j-1].portmapping1, "portmapping2": container_list[j-1].portmapping2};
			var content_obj_str = JSON.stringify(content_obj);
			var order_obj = {"target":"container", "order": "run", "name": container_list[j-1].container_name, "content": content_obj_str};
			var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
			message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
			message.qos=0;
			mqtt.send(message);
			console.log("发送开启" + container_list[j-1].container_name + "容器信息请求！")
			storage.setItem("containerIsNew", 0);
		}
	}
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

//打包容器
function package_container() {	
	container_list = JSON.parse(localStorage.getItem('container_list'));
	
	var len = container_list.length;
	for(var j = len; j > 0; j--){
		var box=document.getElementById(container_list[j-1].container_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		if(box.checked == true) {
			var content_obj = {};
			var content_obj_str = JSON.stringify(content_obj);
			var order_obj = {"target":"container", "order": "commit", "name": container_list[j-1].container_name, "content": content_obj_str};
			var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
			message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
			message.qos=0;
			mqtt.send(message);
			console.log("发送打包" + container_list[j-1].container_name + "容器信息请求！")
		}
	}
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

function delete_image() {
	image_list = JSON.parse(storage.getItem("image_list"));
	var len = image_list.length;
	for(var j = len; j > 0; j--){
		var box=document.getElementById(image_list[j-1].image_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		if(box.checked == true) {
			var order_obj = {"target":"image", "order": "remove", "name": image_list[j-1].image_name, "content": ""};
			var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
			message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
			message.qos=0;
			mqtt.send(message);
			console.log("发送删除" + image_list[j-1].image_name + "镜像信息请求！")
		}
	}
	$('#log_frame').empty();
	$('#log_frame').prepend('<li>' + storage.getItem("err_log") + '</li>');
}

function gateway_clear() {
	for (var i = 0; i < gateway_list.length; i++) {
		$("#" + gateway_list[i].gateway_id).remove();
	}
	gateway_list = new Array();
	storage.removeItem("gateway_list");		//移除container_list列表
	storage.setItem("gateway_list", JSON.stringify(gateway_list));
	window.location.replace("gateway.html");
}

function container_clear() {
	storage.removeItem("container_list");		//移除container_list列表
	storage.setItem("container_list", JSON.stringify(container_list));
}

function query_log() {
	var current_container = storage.getItem("current_container");
	var current_gateway = storage.getItem("current_gateway");
	var order_obj = {"target":"container", order: "logs", name: current_container, "content": ""};
	var message = new Paho.MQTT.Message(JSON.stringify(order_obj));
	message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
	message.qos=0;
	mqtt.send(message);
	console.log("发送查询" + current_container + "日志信息请求！")
	
	for(var i = 0; i < container_list.length; i++) {
		if(current_container == container_list[i].container_name) {
			container_list[i].received_message.push('sys/' + current_gateway + '/' + current_container + '/msg' + '@' + 'logs');
		}
	}
	$('#childsend').prepend('<li>' + 'Topic: ' + 'sys/' + current_gateway + '/' + current_container + '/msg' + '=====>>>>>' + 'Message: ' + 'logs' + '</li>');
}

function test_button() {
	if(test_button_status == false) { 
		test_button_status = true;
		$('#test').append('Publish Topic: <input type="text" id="childsendtopic" class="pub_topic"/> ')
	}
} 					

function test() {
	$('#circle_index').attr('src','../img/circle_green.png');
}
