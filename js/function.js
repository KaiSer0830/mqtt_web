var time;
var container_select_id = new Array();;
var storage = window.localStorage;
var gateway_list = new Array();
var container_list = new Array();
var gateway_data = JSON.parse(localStorage.getItem('gateway_list'));
var container_data = JSON.parse(localStorage.getItem('container_list'));
var send_message = new Array();
var received_message =  new Array();
var current_gateway = null;
var image_list = new Array("kaiser", "qi", "bird", "ubuntu");

for(var i in gateway_data) {
	gateway_list.push(gateway_data[i])
};
for(var i in container_data) {
	container_list.push(container_data[i])
};
var test_button_status = false;
// console.log(typeof container_list);

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
	var name = $(arg).parent().attr('id').replace("_id", "");
	child_topic = name;		//在mosquitto-child.js定义了
	storage.setItem("current_container", child_topic);
	window.location.replace("./child.html");
}

function goBack_one() {
	window.location.replace("../gateway.html");
}

function goBack_two() {
	current_container = null;
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
		var select = container_list[i].select;
		var container_class = null;
		// console.log(container_list[i]);
		$('#gateway_frame').append('<div class="gateway_demo" id="' + gateway_id + '"><img src="img/gateway.png" width="200px" height="200px" onclick="skip_one(this)" id="' + img_id + '"/><div style="gateway_bot"><input type="checkbox" class="checkbox" id="' + gateway_checkbox_id + '"></input><span class="gateway_name">' + gateway_name + '</span></div></div>')
	}
}

function container_main_init() {
	var current_gateway = storage.getItem("current_gateway");
	$("#container_title").html(current_gateway + "容器列表:");
	for(var i = 0; i < image_list.length; i++) {
		var imag_id = image_list[i] + "_id";
		$('#image_frame').prepend('<div id="' + imag_id + '" style="display: flex; flex-direction: row;align-items: center"><input type="checkbox" class="checkbox"></input><li>' + image_list[i] + '</li></div>');
	}
	for(let i = 0; i < container_list.length; i++){
		var container_name = container_list[i].container_name;
		var container_id = container_list[i].container_id;
		var img_id = container_list[i].container_img_id;
		var name_id = container_list[i].container_name_id;
		var container_checkbox_id = container_list[i].container_checkbox_id;
		if(container_list[i].container_status == 'online') {
			container_class = "container_name_online";
		}
		else if(container_list[i].container_status == 'offline') {
			container_class = "container_name";
		}
		// console.log(container_list[i]);
		$('#container_frame').append('<div class="container_demo" color="" id="' + container_id + '"><img src="../img/container_blue.png" width="200px" height="200px" onclick="skip_two(this)" id="' + img_id + '"/><div class="container_bot"><input type="checkbox" class="checkbox" id="' + container_checkbox_id + '"></input><span class="' + container_class + '" id="' + name_id + '">' + container_name + '</span></div>')
	}
}

function container_child_init() {
	var current_container = storage.getItem("current_container");
	$("#current_container_title").html("当前容器：" + current_container);
	// console.log(child_topic);
	for(var i = 0; i < container_list.length; i++) {
		if(child_topic == container_list[i].container_name) {
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
	var create_port1 = $("#create_port1").val();
	var create_port2 = $("#create_port2").val();
	var portmapping = create_port1 + "-" + create_port2;
	if(create_container_name == "" || create_image_name == "" || create_order == "" || create_storage_limit == "" || create_cpu_core == "" || create_time_splice == "" || create_port1 == "" || create_port2 == "") {
		alert("请将创建容器信息填写完整！");
		return;
	}
	var content_obj = {"name":create_container_name, "image":create_image_name, "command":create_order, "memory":create_storage_limit, "cpuset":create_cpu_core, "cpushare":create_time_splice, "portmapping": portmapping};
	var content_obj_str = JSON.stringify(content_obj);
	// console.log(typeof(content_obj_str));
	var message_obj = {"target":"container", order: "run", name: "bird", content: content_obj_str};
	var message = new Paho.MQTT.Message(JSON.stringify(message_obj));
	message.destinationName = 'sys/' + storage.getItem('current_gateway') + '/order';
	message.qos=0;
	mqtt.send(message);
	console.log('Topic:' + message.destinationName + '\n' + JSON.stringify(message_obj));
	// var container_name = prompt("请输入创建的容器名:","container")
	// var containerIsTure = true
	// for(var i = 0; i < container_list.length; i++){
	// 	if(container_name == container_list[i].container_name){
	// 		containerIsTure = false;
	// 		alert('系统已有同名容器，请重新输入名称！');
	// 		return;
	// 	}
	// }
	// if(container_name != null && containerIsTure){
	// 	var container_id = container_name + '_id';
	// 	var img_id = container_name + '_img_id';
	// 	var name_id = container_name + '_name_id';
	// 	var container_status = 'offline';
	// 	var container_checkbox_id = container_name + '_checkbox_id';
	// 	var obj = {"container_name":container_name, "container_id":container_id, "container_img_id":img_id, "container_status":container_status, "container_checkbox_id":container_checkbox_id, "send_message":[], "received_message": []};
	// 	container_list.push(obj);
	// 	storage.setItem("container_list", JSON.stringify(container_list));		//官方推荐使用
	// 	// console.log(storage["container_list"]);
	// 	$('#container_frame').append('<div class="container_demo" id="' + container_id + '"><img src="../img/container_blue.png" width="200px" height="200px" onclick="skip_two(this)" id="' + img_id + '"/><div class="container_bot"><input type="checkbox" class="checkbox" id="' + container_checkbox_id + '"></input><span class="' + container_class + '" id="' + name_id + '">' + container_name + '</span></div>')
	// }

}

function delete_container() {
	var len = container_list.length;
	for(var j = len; j > 0; j--){
		var box=document.getElementById(container_list[j-1].container_checkbox_id);
		// 判断是否被拒选中，选中返回true，未选中返回false
		if(box.checked == true) {
			$("#" + container_list[j-1].container_id).remove();
			container_list.splice(j-1, 1);
		}
	}
	localStorage.setItem("container_list", JSON.stringify(container_list));
}

function stop_container() {
	var topic = 'sys/' + storage.getItem('current_container') + '/sys/{CN}/status/stop';
	var message = new Paho.MQTT.Message('stop');
	message.destinationName = topic;
	message.qos=0;
	mqtt.send(message);
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
	for (var i = 0; i < container_list.length; i++) {
		$("#" + container_list[i].container_id).remove();
	}
	container_list = new Array();
	storage.removeItem("container_list");		//移除container_list列表
	storage.setItem("container_list", JSON.stringify(container_list));
	storage.setItem("current_container", null);
	window.location.replace("container.html");
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
