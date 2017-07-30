"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/channel');

module.exports = new Clapp.Command({
	name: "deleteroom",
	desc: "Delete a room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var channelName = argv.args.name;

		var channel = guild.channels.get(channelName)
					|| guild.channels.find('name', channelName);
		
		if (channel) {
			channel.delete()
			.then(console.log(`Deleting channel ${channel}`))
			.catch(console.error);
		}
			
		return;
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