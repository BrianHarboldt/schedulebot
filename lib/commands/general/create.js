/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const cfg = require('../../../config.js');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "create",
	desc: "Create a room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var channelName = argv.args.name.replace(/[^\w\d-_]/g, '');

		var time = 0;
		var inputTime = argv.args.time.match(/^(\d{1,2}):(\d\d)$/);
		if (inputTime) time = (inputTime[1]  * 60 * 60) + (inputTime[2]  * 60);
		else {
			inputTime = argv.args.time.match(/^(\d{1,3})$/);
			if (inputTime) time = (inputTime[1] * 60);
		}

		if (time <= 0) return;
		if (time > cfg.create_channel_max_time * 60) { //bot mod can use whatever time
			var modRole = bot.GetModRole(guildId);
			var userRole = context.msg.member.roles.find(function(r){
            	return r.name == modRole;
			});
			if (!userRole) return `Max time is ${cfg.create_channel_max_time * 60} minutes`;
		}

		return bot.CreateChannel(guild, channelName, time)
			.then(response => {
				bot.PostChannel(response, context.msg.channel);
				var minutesLeft = Math.floor((response.expiresAt - Date.now()) / 60 / 1000);
				response.channel.send(`Expires at about ${bot.ConvertTime(response.expiresAt)} (~${minutesLeft} minutes).`)
					.then(m2 => m2.pin());
				response.channel.setTopic(`Created by ${context.msg.member.displayName}`);
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
			desc: `Number of minutes for the room to exist, max of ${cfg.create_channel_max_time * 60} minutes. This can be entered as either ### for the number of minutes or #:## for the hour:minutes remaining.\nExample \`!create roomname 80\` or \`!create roomname 1:20\``,
			type: "string",
			required: true,
			validations: [
				{
					errorMessage: `Invalid time input. Example \`!create roomname 80\` or \`!create roomname 1:20\`. Max time is ${cfg.create_channel_max_time * 60} minutes.`,
					validate: value => { return !!(value.match(/^(\d{1,2}):(\d\d)$/) || value.match(/^(\d{1,3})$/)); }
				}
			]
		}
	]
});
