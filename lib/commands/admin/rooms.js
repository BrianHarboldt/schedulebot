/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const cfg = require('../../../config.js');
const bot = require('../../bot/bot');

module.exports = new Clapp.Command({
	name: "rooms",
	desc: "List all rooms for this guild",
	fn: (argv, context) => {
        var guildId = context.msg.channel.guild.id;
		var guild = context.summaryHandler.bot.guilds.get(guildId);

        var botCreatedOnly = argv.args.botCreatedOnly;

        var output = "ROOMS:";

        if (botCreatedOnly === "true") {
            var options = {
                timeZone: cfg.default_timezone,
                timeZoneName: 'short'
            };
            var rooms = bot.CreatedRooms(guild);
            rooms.forEach(function(room) {
                var minutesLeft = Math.floor((room.expiresAt - Date.now()) / 60 / 1000);
                output = `${output}\n${room.channel} - ${new Date(room.expiresAt).toLocaleString('en-US', options)} (~${minutesLeft} minutes).`;
            });    
        }
        else {
            guild.channels.forEach(function(room){
                output = `${output}\n${room.name} - ${room.id} - ${room.type} - ${room.parent}.`;
            });
        }
        return output;
	},
	args: [
		{
			name: "botCreatedOnly",
			desc: "Only display channels created by the bot",
			type: "string",
			default: "true",
			required: false
		}
	]
});
