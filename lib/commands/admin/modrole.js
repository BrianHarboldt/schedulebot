/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "modrole",
	desc: "Change the role checked by the bot to grant access to admin commands",
	fn: (argv, context) => {
		var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);
		var role = argv.args.role;
		
		if (role && role.length > 0)
			return bot.SetModRole(guild, role);

		return bot.GetModRole(guild);
	},
	args: [
		{
			name: "role",
			desc: "The name of the role which bot mods are assigned to",
			type: "string",
			default: "",
			required: false
		}
	]
});