/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "delete",
	desc: "Delete a room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);

		var rooms = bot.CreatedRooms(guild);
		var channelName = argv.args.name.replace('<#', '').replace('>', '');

		var room = rooms.find(function(room){
			return room.channel.name == channelName || room.channel.id == channelName;
		});
		
		return bot.DeleteChannel(room);
	},
	args: [
		{
			name: "name",
			desc: "The name of the room",
			type: "string",
			required: true
		}
	]
});