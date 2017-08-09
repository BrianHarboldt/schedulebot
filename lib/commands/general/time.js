/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "time",
	desc: "Time remaining for a room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var channelArg = argv.args.name;
		var channelName = channelArg || context.msg.channel.id;

		var closingTime = bot.GetClosingTime(guild, channelName);
		if (closingTime) {
			var minutesLeft = Math.floor((closingTime - Date.now()) / 60 / 1000);
			return `${channelArg||context.msg.channel} ends at about ${bot.ConvertTime(closingTime)} (~${minutesLeft} minutes).`;
		}
		return ;
	},
	args: [
		{
			name: "name",
			desc: "The name of the room. [Defaults to current channel]",
			type: "string",
			default: "",
			required: false
		}
	]
});
