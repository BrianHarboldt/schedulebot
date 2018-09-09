/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "untrack",
	desc: "Stop tracking a room (remove from auto cleanup)",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var channelName = argv.args.name.replace('<#', '').replace('>', '').toLowerCase();

		var room = bot.GetRoom(guild, channelName, null);		
		bot.ForgetChannel(room);
		if (room)
			return "Room no longer tracked and will not be auto deleted: " + room.channel;
		return "Room was not found in the list of tracked rooms.";
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