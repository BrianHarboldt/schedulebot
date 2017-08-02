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
		var channelName = argv.args.name;

		var rooms = bot.CreatedRooms(guild);

		bot.DeleteChannel(guild, channelName)
			.then(d => {
				var room = rooms.find(function(r){
					return r.channel.id == d.id;
				});
				bot.ForgetChannel(room);
			});
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