/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "changetime",
	desc: "Alter the current room's expiration time",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		
		var time = 0;
		var inputTime = argv.args.time.match(/^(\d{1,2}):(\d\d)$/);
		if (inputTime)
			time = (inputTime[1]  * 60 * 60) + (inputTime[2]  * 60);
		else {
			inputTime = argv.args.time.match(/^(\d{1,3})$/);
			if (inputTime)
				time = (inputTime[1] * 60);
		}

		if (time == null || time <= 0)
			return "Time input must be greater than 0.";

		var room = bot.GetRoom(guild, context.msg.channel.id, null);

		if (room == null)
			return "Room was not found in tracked rooms. Time was not updated.";

		var channelParams = {
            coords: room.coords,
            channelName: room.channel.name,
            time: time,
		};
		
		if (bot.UpdateClosingTime(context.msg, room, channelParams)) {
			console.log(`Channel time update requested for ${room.channel} updated to be ${time / 60} minutes. Request made by ${context.msg.author.username}.`);
			return;
		}
		return "Failed to update room time";
	},
	args: [
		{
			name: "time",
			desc: "The new time (# of minutes from right now) for this room.",
			type: "string",
			default: "",
			required: true
		}
	]
});
