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

		//Prevent making rooms from inside other rooms
		var originRoom = bot.GetRoom(guild, context.msg.channel.id, null);
		if (originRoom != null) return;

		var time = 0;
		var inputTime = argv.args.time.match(/^(\d{1,2}):(\d\d)$/);
		if (inputTime) time = (inputTime[1]  * 60 * 60) + (inputTime[2]  * 60);
		else {
			inputTime = argv.args.time.match(/^(\d{1,3})$/);
			if (inputTime) time = (inputTime[1] * 60);
		}

		if (time <= 0) return;
		if (time > cfg.create_channel_max_time * 60) { //bot mod can use whatever time
			var modRole = bot.ModRole(guildId, null);
			var userRole = context.msg.member.roles.find(function(r){
            	return r.name == modRole;
			});
			if (!userRole) return `Max time is ${cfg.create_channel_max_time} minutes`;
		}

		var user = context.msg.author.username;

		return bot.CreateChannel(guild, channelName, time, null, user)
			.then(response => { bot.PostChannel(response, context.msg.channel, null); }); //Messages spawning channel and spawned channel
	},
	args: [
		{
			name: "name",
			desc: "The name of the room (without spaces)",
			type: "string",
			required: true
		},
		{
			name: "time",
			desc: `Number of minutes for the room to exist, max of ${cfg.create_channel_max_time} minutes. This can be entered as either ### for the number of minutes or #:## for the hour:minutes remaining.\nExample \`!create roomname 70\` or \`!create roomname 1:10\``,
			type: "string",
			required: true,
			validations: [
				{
					errorMessage: `Invalid command! Room names *cannot* contain spaces. Max time is ${cfg.create_channel_max_time} minutes.\n Example \`!create roomname 70\` or \`!create roomname 1:10\`.`,
					validate: value => { return !!(value.match(/^(\d{1,2}):(\d\d)$/) || value.match(/^(\d{1,3})$/)); }
				}
			]
		}
	]
});
