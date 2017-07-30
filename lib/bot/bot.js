/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const cfg = require('../../config.js');
const Discord = require('discord.js');

module.exports = {
    CleanupRooms: function(createdRooms){
        createdRooms.forEach(function(room) {
            if (room && room.expiresAt <= Date.now()) {
                this.DeleteChannel(room.channel.guild, room.channel.id, room.msg);
            }
        }, this);
    },
    BuildChannelParams: function(embed){
        var parts = embed.description.split('\n');
        var loc = parts[0];
        var poke = parts[1];

        var timeMatch = /(?:(\d+)\s*hours)?\s(?:(\d+)\s*min)?\s(?:(\d+)\s*sec)?/.exec(parts[3]);
        var hour = (timeMatch[1] || 0) * 60 *60;
        var minute = (timeMatch[2] || 0) * 60;
        var second = (timeMatch[3] || 0) * 1;

        var coords = /\/#(-?\d+\.?\d*,-?\d+\.?\d*)/.exec(embed.url)[1];

        return {
            coords: coords,
            channelName: `${poke}-${loc}`,
            time: hour + minute + second
        };
    },
    CloneEmbed: function(embed) {
        var richEmbed = new Discord.RichEmbed()
            .setTitle(embed.title)
            .setDescription(embed.description)
            .setURL(embed.url)
            .setThumbnail(embed.thumbnail)
            .setColor(embed.color);

        if (embed.fields && embed.fields.lengh > 0) {
            embed.fields.foreach(field => {
                richEmbed = richEmbed.addField(field);
            });
        }

        return richEmbed;
    },
    CreateChannel: function(guild, channelName, time) {
        channelName = channelName.replace(/[^\w\d-]/g, '');
        return guild.createChannel(channelName, "text")
			.then(channel => {
				console.log(`Created new channel ${channel} on guild ${guild}`);
                
                var createdAt = Date.now();
                var expiresAt = Date.now() + time * 1000;
                var options = {
                    timeZone: cfg.default_timezone,
                    timeZoneName: 'short'
                };
                var response = {
                    msg: `Channel created ${channel}.\n` +
                         `Expires at about ${new Date(expiresAt).toLocaleString('en-US', options)}`,
                    channel: channel,
                    time: time,
                    createdAt: createdAt,
                    expiresAt: expiresAt
                };

				return response;
			})
			.catch(console.error);
    },
    DeleteChannel: function(guild, channelName, msg) {
        var channel = guild.channels.get(channelName) || guild.channels.find('name', channelName);
		
        if (!channel) 
            return;
        
        if (msg)
            msg.edit(`\nRaid timer expired. Removed channel for ${channel.name}`);

        channel.delete()
			.then(console.log(`Deleting channel ${channel}`))
			.catch(console.error);
        
        return;
    },
    GenerateMap: function(coords){
        return {
            map: `https://maps.googleapis.com/maps/api/staticmap?center=${coords}&zoom=14&scale=1&size=600x300&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:1%7C${coords}`,
            url: `https://www.google.com/maps/dir//${coords}/`
        };
    }
};
