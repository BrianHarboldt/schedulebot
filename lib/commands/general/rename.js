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

		var room = bot.GetRoom(guild, context.msg.channel.id, null);
		var roomUpdateResponse = bot.UpdateRoomName(guild, room, channelName);

		if (roomUpdateResponse != null && roomUpdateResponse.channel != null) {
			console.log(`Channel rename requested for ${roomUpdateResponse.channel} updated to be ${roomUpdateResponse.channel.name} from requested name: ${channelName}. Request made by ${context.msg.author.username}.`);
			return "Room has been renamed: " + roomUpdateResponse.channel;
		} else
			return roomUpdateResponse || "Failed to rename room";
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
