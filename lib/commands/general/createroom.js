"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/channel');

module.exports = new Clapp.Command({
	name: "createroom",
	desc: "Create a room",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var channelName = argv.args.name;
		
		return bot.CreateChannel(guild, guildId, channelName, argv.args.time)
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
			desc: "Amount of minutes to create the room for",
			type: "number",
			default: 150,
			required: false
		}
	]
});
