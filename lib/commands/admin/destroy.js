/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "destroy",
	desc: "Delete all temp rooms",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		
		var rooms = bot.CreatedRooms(guild);
		var roomsToDelete = [];

		while(rooms.length > 0){
			var room = rooms.shift();
			roomsToDelete.push(room);
			bot.DeleteChannel(room.channel.guild, room.channel.id, room.msg);
		}

		bot.ForgetChannels(roomsToDelete);

		return;
	}
});