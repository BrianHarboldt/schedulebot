/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "rename",
	desc: "Rename the current room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		
		var channelName = argv.args.name.replace(/[^\w\d-_]/g, '').toLowerCase();
		if (channelName.length <= 0) return "Channel name not valid.";

		var room = bot.UpdateRoomName(guild, context.msg.channel.id, channelName);

		if (room != null && room.channel != null) {
			console.log(`Channel rename requested for ${room.channel} updated to be ${room.channel.name} from requested name: ${channelName}.`);
			return "Room has been renamed: " + room.channel;
		} else
			return room || "Failed to rename room";
	},
	args: [
		{
			name: "name",
			desc: "The new name of the room.",
			type: "string",
			default: "",
			required: true
		}
	]
});
