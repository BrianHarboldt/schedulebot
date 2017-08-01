/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const cfg = require('../../config.js');
const Discord = require('discord.js');

let createdRooms = [];

module.exports = {
    CreatedRooms: function() {
        return createdRooms;
    },
    CleanupRooms: function() {
        var roomsToDelete = [];
        createdRooms.forEach(function(room, index, object) {
            if (room && room.expiresAt <= Date.now()) {
                roomsToDelete.push(room);
                this.DeleteChannel(room.channel.guild, room.channel.id, room.msg);
            }
        }, this);

        roomsToDelete.forEach(function(room){
            var index = createdRooms.indexOf(room);
            if (index >= 0)
                createdRooms.splice(index, 1);
        });
    },
    BuildChannelParams: function(embed) {
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
            .setImage(embed.image)
            .setColor(embed.color)
            .setTimestamp();

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

                createdRooms.push(response);

				return response;
			})
			.catch(console.error);
    },
    DeleteChannel: function(guild, channelName, msg) {
        var channel = guild.channels.get(channelName) || guild.channels.find('name', channelName);
		
        if (!channel) 
            return;
        
        if (msg && typeof msg === 'object')
            msg.edit(`\Room timer expired. Removed channel for ${channel.name}`);

        channel.delete()
			.then(console.log(`Deleting channel ${channel}`))
			.catch(console.error);
        
        return;
    },
    GenerateMap: function(coords) {
        var map = `https://maps.googleapis.com/maps/api/staticmap?center=${coords}&zoom=14&scale=1&size=600x300&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:1%7C${coords}`;
        var url = `https://www.google.com/maps/dir//${coords}/`;
        var embed = new Discord.RichEmbed()
                    .setTitle(coords)
                    .setURL(url)
                    .setImage(map);
        return embed;
    },
    PostChannel: function(createChannelResponse, targetChannel) {
        if (!createChannelResponse || !createChannelResponse.msg || !targetChannel)
            return createChannelResponse;

        return targetChannel.send(createChannelResponse.msg)
            //replace the message with the one we just posted
            //this way it can be cleaned up when this channel is deleted
            .then(m => { createChannelResponse.msg = m; });
    }
};
