/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const constants = require('../../constants.js');
const cfg = require('../../config.js');
const Discord = require('discord.js');

let createdRooms = []; // [{msgs,channel,time,createdAt,expiresAt,coords}]
let modRoles = [];
let configOverrides = []; // [{guild:Discord.Guild,modRole:Discord.Role,minutes:int,parser:[{type:config.MessagePart,element:config.ParserPart,value:string}]}]

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
            if (room && room.expiresAt <= Date.now()){
                this.DeleteChannel(room);
            }
        }, this);
    },
    GetEmbedPart: function(section, embed){
        var content = '';
        switch (section.element) {
            case constants.ParserPart.Title:
                content = embed.title;
                break;
            case constants.ParserPart.Url:
                content = embed.url;
                break;
            case constants.ParserPart.Description:
                content = embed.description;
                break;
            default:
                content = embed.description;
                break;
        }
        return content.match(section.value);
    },
    BuildChannelParams: function(guild, embed) {
        var parser = this.GetAutoCreateParser(guild);
        var parts = (embed.description||'').split('\n');
        var preTimer = embed.title.indexOf('starting soon') > -1;

        var coords = '';
        var channelName = '';
        var time = 0;
        try {
            parser.forEach(function(section) {
                var content = this.GetEmbedPart(section, embed);
                if (content && content.length > 1){
                    switch (section.type) {
                        case constants.MessagePart.Title:
                            channelName += '-' + content[1];
                            break;
                        case constants.MessagePart.Coords:
                            coords = content[1];
                            break;
                        case constants.MessagePart.Time:
                            var hour = (content[1] || 0) * 60 * 60;
                            var minute = (content[2] || 0) * 60;
                            var second = (content[3] || 0) * 1;
                            time = hour + minute + second;
                            if (preTimer)
                                time += 3600;
                            break;
                        default:
                            break;
                    }
                }
            }, this);

            if (channelName.length <= 0) {
                if (!preTimer) channelName = '-' + parts[1] + '-' + parts[0];
                else if (parts[0].indexOf('LOCATION:') <= 0) channelName = '-' + embed.title.substring(0, 8) + '-' + parts[0];
                else channelName = '-' + embed.title.substring(0, 8) + '-' + coords;
            }

            if (channelName.indexOf('-', 1) < 0) {
                if (!preTimer) channelName += '-' + coords;
                else channelName = '-' + embed.title.substring(0, 8) + channelName;
            }

            return {
                coords: coords,
                channelName: channelName.replace(/[^\w\d-_]/g, '').slice(1),
                time: time,
            };
        } catch (error) {
            console.error("Error building channel params, using fallback", error);
        }

        //fallback
        coords = /(-?\d+\.?\d*,-?\d+\.?\d*)/.exec(embed.url)[1];

        var loc;
        var l = /(?:\*{0,2}(?:LOCATION|ADDRESS):\*{0,2}\s((?!unknown).+))/ig.exec(embed.description);
        if (l && l.length > 1) loc = l[1];
        else loc = coords.replace(',', '_') || parts[0];
        var poke;
        var p = /against\s(.+)!/.exec(embed.title);
        if (p) poke = p[1];
        else poke = parts[1];
        channelName = `${poke}-${loc}`;

        var timeMatch = /(\d+)\s*(?:hours|h)\s*(\d+)\s*(?:min|m)\s*(?:(\d+)\s*(?:sec|s))?/.exec(embed.description);
        time = ((timeMatch[1] || 0) * 60 * 60) + (timeMatch[2] || 0) * 60 + (timeMatch[3] || 0) * 1;
        return {
            coords: coords,
            channelName: channelName.replace(/[^\w\d-_]/g, ''),
            time: time,
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
        channelName = channelName.toLowerCase();
        return guild.createChannel(channelName, "text")
			.then(channel => {
                var createdAt = Date.now();
                var expiresAt = Date.now() + time * 1000;
                var minutesLeft = Math.floor((expiresAt - Date.now()) / 60 / 1000);
                var response = {
                    msgs: [`Channel created ${channel}. Expires at about ${this.ConvertTime(expiresAt)} (~${minutesLeft} minutes).`],
                    channel: channel,
                    time: time,
                    createdAt: createdAt,
                    expiresAt: expiresAt,
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
        channelId = channelId.replace('<#', '').replace('>', '').toLowerCase();
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

        if (room.msgs)
            room.msgs.forEach(function (msg){
                if (typeof msg === 'object')
                    msg.edit(`\Room timer expired. Removed channel ${room.channel.name}`);
            });

        var index = createdRooms.indexOf(room);
        if (index >= 0)
            createdRooms.splice(index, 1);
    },
    GenerateMap: function(coords) {
        var map = `https://maps.googleapis.com/maps/api/staticmap?center=${coords}&zoom=14&scale=1&size=600x300&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:1%7C${coords}`;
        var url = `https://www.google.com/maps/dir/Current%20Location/${coords}/`;
        var embed = new Discord.RichEmbed()
                    .setTitle(coords)
                    .setURL(url)
                    .setImage(map);
        return embed;
    },
    GetClosingTime: function(guild, channelName) {
        var room = this.GetRoom(guild, channelName, null);
        if (!room) return;
        return room.expiresAt;
    },
    UpdateClosingTime: function(guild, channelParams){ //channelParams==BuildChannelParams()
        var room = this.GetRoom(guild, channelParams.channelName, channelParams.coords);
        if (!room) return;
        
        room.time = channelParams.time;
        room.expiresAt = Date.now() + channelParams.time * 1000;
        room.msgs[0] = `Room updated -> ${room.channel}. Expires at about ${this.ConvertTime(room.expiresAt)} (~${Math.floor(channelParams.time / 60)} minutes)`;        
        console.log(`Updated closing time for channel ${channelParams.channelName} on guild ${guild} to expire at ${this.ConvertTime(room.expiresAt)}.`);                
        return room;
    },
    GetRoom: function(guild, channelName, coords) {
        channelName = channelName.replace('<#', '').replace('>', '').toLowerCase();
        var channel = guild.channels.get(channelName) || guild.channels.find('name', channelName);
        if (!channel && !coords) return null;
        var rooms = this.CreatedRooms(guild);
        var room = rooms.find(function(r){
            if (channel){
                var idMatch = r.channel.id == channel.id;
                var coordMatch = (!coords || r.coords == coords) || (coords && !r.coords);
                return idMatch && coordMatch;    
            } else {
                return coords && r.coords == coords;
            }
        });

        return room;
    },
    SetAutoCreateMinTime: function(guild, minutes) {
        var config = this.GetConfig(guild);
        if (config) {
            config.minutes = minutes;
        } else {
            configOverrides.push({guild:guild, minutes:minutes});
        }        
    },
    SetAutoCreateParser: function(guild, params) {
        //params:[{type:config.MessagePart,element:config.ParserPart,value:string}]
        var config = this.GetConfig(guild);
        if (config) {
            config.parser = params;
        } else {
            configOverrides.push({guild:guild, parser:params});
        }
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
    GetAutoCreateMinTime: function(guild) {
        var config = this.GetConfig(guild);
        if (config)
            return config.minutes || cfg.auto_create_channel_min_time;
        else
            return cfg.auto_create_channel_min_time;
    },
    GetAutoCreateParser: function(guild) {
        var config = this.GetConfig(guild);
        if (config)
            return config.parser || cfg.auto_create_channel_parser;
        else
            return cfg.auto_create_channel_parser;
    },
    GetModRole: function(guild) {
        var config = this.GetConfig(guild);
        if (config)
            return (config.modRole ? config.modRole.name : cfg.admin_app.role);
        else
            return cfg.admin_app.role;
    },
    PostChannel: function(createChannelResponse, targetChannel) {
        if (!createChannelResponse || !createChannelResponse.msgs || !targetChannel)
            return createChannelResponse;

        return targetChannel.send(createChannelResponse.msgs[0])
            //replace the message with the one we just posted
            //this way it can be cleaned up when this channel is deleted
            .then(m => { createChannelResponse.msgs.push(m); });
    }
};
