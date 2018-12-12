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
		var roles = argv.args.role;
		if (roles)
			roles = roles.split(';');
		
		var guildModRoles = bot.ModRoles(guild, roles);
		
		var r = "";
		guildModRoles.forEach(role => {
			r += "\nMod roles: " + role.name;
		});
		return r;
	},
	args: [
		{
			name: "role",
			desc: "The name of the role(s) which bot mods are assigned to. Semicolon [;] separated.",
			type: "string",
			default: "",
			required: true
		}
	]
});