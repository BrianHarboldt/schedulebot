/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const cfg = require('../../config.js');
const Discord = require('discord.js');

let createdRooms = []; // [{msg,channel,time,createdAt,expiresAt,warningTime,coords}]
let modRoles = [];
let configOverrides = []; // [{guild,Discord.Role,minutes}]

module.exports = {
    CreatedRooms: function(guild) {
        if (guild)
            return createdRooms.filter(function(room){
                return room.channel.guild.id == guild.id;
            });

        return createdRooms;
    },
    GetConfig: function(guild){
        var config = configOverrides.find(function(c) {
            return c.guild.id == guild.id;
        });
        return config;
    },
    CleanupRooms: function() {
        createdRooms.forEach(function(room, index, object) {
            if (room){
                if (room.expiresAt <= Date.now()) {
                    this.DeleteChannel(room);
                }
                else if (room.expiresAt - Date.now() <= room.warningTime) {
                    var endTime = this.ConvertTime(room.expiresAt);
                    room.channel.send(`Reminder: This room ends around ${endTime}.`);
                    room.warningTime -= 240000; //Take 4 minute until the next warning
                }
            }
        }, this);
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
            channelName: `${poke}-${loc}`.replace(/[^\w\d-]/g, ''),
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
    ConvertTime: function(date) {
        var options = {
            timeZone: cfg.default_timezone,
            timeZoneName: 'short'
        };
        return new Date(date).toLocaleString('en-US', options);
    },
    CreateChannel: function(guild, channelName, time, coords) {
        return guild.createChannel(channelName, "text")
			.then(channel => {
                var createdAt = Date.now();
                var expiresAt = Date.now() + time * 1000;
                var minutesLeft = Math.floor((expiresAt - Date.now()) / 60 / 1000);
                var response = {
                    msg: `Channel created ${channel}. Expires at about ${this.ConvertTime(expiresAt)} (~${minutesLeft} minutes).`,
                    channel: channel,
                    time: time,
                    createdAt: createdAt,
                    expiresAt: expiresAt,
                    warningTime: 300000, //5 minutes
                    coords: coords
                };

                createdRooms.push(response);
				console.log(`Created new channel ${channel} on guild ${guild} for ${minutesLeft} minutes.`);

				return response;
			})
			.catch(console.error);
    },
    DeleteChannel: function(room) {
        if (!room) return;
        
        var guild = room.channel.guild;
        var channelId = room.channel.id;
        channelId = channelId.replace('<#', '').replace('>', '');
        var channel = guild.channels.get(channelId) || guild.channels.find('name', channelId);
        if (!channel) {
            console.log(`Delete: guild room not found for delete - ${channelId} on ${guild}. May have been manually deleted.`);
            return;
        }

        return channel.delete()
			.then(console.log(`Delete: deleted channel ${channel} on ${guild}`))
			.catch(console.error);
    },
    ForgetChannel: function(room) {
        if (!room) return;

        if (room.msg && typeof room.msg === 'object')
            room.msg.edit(`\Room timer expired. Removed channel ${room.channel.name}`);

        var index = createdRooms.indexOf(room);
        if (index >= 0)
            createdRooms.splice(index, 1);
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
    GetClosingTime: function(guild, channelName){
        var room = this.GetRoom(guild, channelName, null);
        if (!room) return;
        return room.expiresAt;
    },
    GetRoom: function(guild, channelName, coords){
        channelName = channelName.replace('<#', '').replace('>', '');
        var channel = guild.channels.get(channelName) || guild.channels.find('name', channelName);
        var rooms = this.CreatedRooms(guild);
        var room = rooms.find(function(r){
            var idMatch = r.channel.id == channel.id;
            var coordMatch = (!coords || r.coords == coords) || (coords && !r.coords);
            return idMatch && coordMatch;
        });

        return room;
    },
    SetModRole: function(guild, role) {
        var modRole = guild.roles.find(function(r){
            return r.name == role;
        });
        if (!modRole) return; //Entered role does not exist for this guild

        var config = this.GetConfig(guild);
        if (config) {
            config.modRole = modRole;
        } else {
            configOverrides.push({guild:guild, modRole:modRole});
        }        
    },
    SetAutoCreateMinTime: function(guild, minutes) {
        var config = this.GetConfig(guild);
        if (config) {
            config.minutes = minutes;
        } else {
            configOverrides.push({guild:guild, minutes:minutes});
        }        
    },
    GetAutoCreateMinTime: function(guild) {
        var config = this.GetConfig(guild);
        if (config)
            return config.minutes || cfg.auto_create_channel_min_time;
        else
            return cfg.auto_create_channel_min_time;
    },
    GetModRole: function(guild) {
        var config = this.GetConfig(guild);
        if (config)
            return (config.modRole ? config.modRole.name : cfg.admin_app.role);
        else
            return cfg.admin_app.role;
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
