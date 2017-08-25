/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "create",
	desc: "Create a room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var channelName = argv.args.name.replace(/[^\w\d-_]/g, '');

		var time = 0;
		var inputTime = argv.args.time.match(/^(\d{1,2}):(\d\d)$/) || argv.args.time.match(/^(\d{1,3})$/);
		if (!inputTime) return;
		if (inputTime.length === 3)
    		time = (inputTime[1]  * 60 * 60) + (inputTime[1]  * 60);
		else if (inputTime.length === 2)
			time = (inputTime[1]  * 60);
    	else return;

		return bot.CreateChannel(guild, channelName, time)
			.then(response => {
				bot.PostChannel(response, context.msg.channel);
				var minutesLeft = Math.floor((response.expiresAt - Date.now()) / 60 / 1000);
				response.channel.send(`Expires at about ${bot.ConvertTime(response.expiresAt)} (~${minutesLeft} minutes).`)
					.then(m2 => m2.pin());
			});
	},
	args: [
		{
			name: "name",
			desc: "The name of the room",
			type: "string",
			required: true
		},
		{
			name: "time",
			desc: "Number of minutes for the room to exist. This can be entered as either ### for the number of minutes or #:## for the hour:minutes remaining. Example `!create roomname 80` or `!create roomname 1:20`",
			type: "string",
			required: true,
			validations: [
				{
					errorMessage: "Invalid time input. Example `!create roomname 80` or `!create roomname 1:20`.",
					validate: value => { return !!(value.match(/^(\d{1,2}):(\d\d)$/) || value.match(/^(\d{1,3})$/)); }
				}
			]
		}
	]
});
