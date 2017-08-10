/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "minroomtime",
	desc: "Change the auto_create_channel_min_time config",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var minutes = argv.args.minutes;
				
		if (minutes >= 0)
			bot.SetAutoCreateMinTime(guild, minutes);

		return bot.GetAutoCreateMinTime(guild) + " minutes";
	},
	args: [
		{
			name: "minutes",
			desc: "The number of minutes that are required to be remaining for a room to auto generate",
			type: "number",
			default: -1,
			required: false
		}
	]
});