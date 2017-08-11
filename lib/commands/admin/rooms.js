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

        var rooms = bot.CreatedRooms(guild);

        var options = {
            timeZone: cfg.default_timezone,
            timeZoneName: 'short'
        };

        var output = "ROOMS:";
        rooms.forEach(function(room) {
            var minutesLeft = Math.floor((room.expiresAt - Date.now()) / 60 / 1000);
            output = `${output}\n${room.channel} - ${new Date(room.expiresAt).toLocaleString('en-US', options)} (~${minutesLeft} minutes).`;
        });

        return output;
	}
});
