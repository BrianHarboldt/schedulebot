/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "categorychannel",
	desc: "Change the category_channel config",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var categoryChannel = argv.args.categoryChannel;
		var botUser = context.botUser;

		if (categoryChannel){
			bot.SetCategoryChannel(guild, categoryChannel, botUser);
		}

		return bot.GetCategoryChannel(guild) + " set as category channel";
	},
	args: [
		{
			name: "categoryChannel",
			desc: "The channel which will be used for created rooms to spawn under",
			type: "string",
			default: "",
			required: false
		}
	]
});