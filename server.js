var http = require('http');
var fs = require('fs');
var clients = [];

var server = http.createServer(function(request, response){ 
	fs.readFile("index.html", function(error, data){
		if (error) throw error;
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write(data);
		response.end();
	});
});

server.listen(420);

var io = require('socket.io').listen(server);
io.set('log level', 1);
io.sockets.on('connection', function(socket){
	socket.username = socket.handshake.address.address;
	var lastMessage;
	var lastMessageTime;
	clients.push(socket.id);
	io.sockets.emit('message', {'message': socket.username + ' connected!'});
	io.sockets.emit('user_count', {'message': clients.length});

	socket.on('client_response', function(data){
		if (data.message.replace(/(<|>|\n|\r|\s|&nbsp;)/g, '') == '') {
			socket.emit('message', {'message': 'You can\'t send an empty message you faglord.'});
			return;
		}

		if (data.message.match(/^\//)) {
			switch(data.message.split(' ') [0]) {
				case '/rickroll':
					io.sockets.emit('message', {'message': socket.username + ' is never gonna give you up.'});
					return;
				case '/name':
					if(typeof data.message.split(' ') [1] != 'string') return;
					io.sockets.emit('message', {'message': socket.username + ' has changed their name to ' + data.message.split(' ') [1].replace(/[<>]/g, '') + '.'});
					socket.username = data.message.split(' ') [1].replace(/[<>]/g, '');
					return;
				case '/join':
					if(typeof data.message.split(' ') [1] != 'string') return;
					socket.emit('message', {'message': 'Joined ' + data.message.split(' ') [1].replace(/[<>]/g, '')});
					socket.join(data.message.split(' ') [1].replace(/[<>]/g, ''));
					return;
				case '/leave':
					if(typeof data.message.split(' ') [1] != 'string') return;
					socket.emit('message', {'message': 'Left ' + data.message.split(' ') [1].replace(/[<>]/g, '')});
					socket.leave(data.message.split(' ') [1].replace(/[<>]/g, ''));
					return;
				case '/kick':
					if(socket.handshake.address.address != "127.0.0.1") {
						socket.emit('message', {'message': 'Insufficient permissions.'});
						return;
					}
					if(typeof data.message.split(' ') [1] != 'string') return;
					io.sockets.emit('message', {'message': io.sockets.socket(data.message.split(' ') [1].replace(/[<>]/g, '')).username + ' has been kicked from the server.'});
					io.sockets.socket(data.message.split(' ') [1].replace(/[<>]/g, '')).disconnect();
					return;
				case '/help':
					socket.emit('message', {'message': '\n/name [name] - Changes your username\n/users - Returns the list of users\n/clear - Clears the chat\n/roll - Rolls a 6 sided die\n/disconnect - Forces a disconnect for the user'});
					return;
				case '/users':
					var message = listClients();
					socket.emit('message', {'message': message})
					return;
				case '/roll':
					io.sockets.emit('message', {'message': socket.username + ' rolled a ' + (Math.floor(Math.random() * 6) + 1) + "."});
					return;
				case '/id':
					socket.emit('message', {'message': socket.id});
					return;
				default: 
					socket.emit('message', {'message': 'Invalid command.'});
					return;
			}
		}

		if (data.message == lastMessage) {
			socket.emit('message', {'message': 'You have already said that.'});
			return;
		}

		if (new Date().getTime() <= lastMessageTime + 300) {
			socket.emit('message', {'message': 'You are talking too fast.'});
			return;
		}

		lastMessage = data.message;
		lastMessageTime = new Date().getTime();

		io.sockets.emit('message', {'message': socket.username + ": " + data.message.replace(/[<>]/g, '')});
	});

	socket.on('disconnect', function(){
		clients.splice(clients.indexOf(socket.id), 1);
		socket.broadcast.emit('message', {'message': socket.username + ' disconnected!'});
		socket.broadcast.emit('user_count', {'message': clients.length});
	})
});

function listClients(){
	var output = '\n';
	for(var i = 0; i < clients.length; i++) {
		output += clients[i] + '-' + io.sockets.socket(clients[i]).handshake.address.address + ': ' + io.sockets.socket(clients[i]).username + '\n';
	}
	return output;
}