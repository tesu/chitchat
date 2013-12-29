function getTimestamp() {
	var time = new Date();
	var timestamp = '[';
	if (time.getHours() < 10) {
		timestamp += '0';
	}
	timestamp += time.getHours() + ':'
	if (time.getMinutes() < 10) {
		timestamp += '0';
	}
	timestamp += time.getMinutes() + ':'
	if (time.getSeconds() < 10) {
		timestamp += '0';
	}
	timestamp += time.getSeconds() + '] ';
	return timestamp;
}

var socket = io.connect();

socket.on('message', function(data){
	var timestamp = getTimestamp();
	$('#fuckoff').val($('#fuckoff').val() + timestamp + data.message + "\n");
	$('#fuckoff').scrollTop($('#fuckoff')[0].scrollHeight);
});

socket.on('user_count', function(data){
	$('#usersonline').html(data.message);
});

$(document).ready(function(){
	$('#text').keypress(function(e){
		if(e.charCode == 13 || e.keycode == 13 || e.which == 13) {
			if ($('#text').val().replace(/\n|\r/g, '') == "/clear") {
				$('#fuckoff').val('');
				$('#text').val('');
				return;
			}
			if ($('#text').val().replace(/\n|\r/g, '') == "/disconnect") {
				socket.disconnect();
				var timestamp = getTimestamp();
				$('#fuckoff').val($('#fuckoff').val() + timestamp + "You disconnected.\n");
				return;
			}


			socket.emit('client_response', {'message': $('#text').val().replace(/\n|\r/g, '')});
			$('#text').val('');
		}
	})
});