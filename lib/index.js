/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const fs             = require('fs');
const Clapp          = require('./modules/clapp-discord');
const SummaryHandler = require('./modules/summaryhandler');
const db             = require('./modules/dbhandler');
const cfg            = require('../config.js');
const pkg            = require('../package.json');
const Discord        = require('discord.js');
const client         = new Discord.Client();
const bot			 = require('./bot/bot');

let masterChannel, summaryHandler, botAdmins, blacklist = [];

let generalApp = new Clapp.App({
	name: cfg.name,
	desc: pkg.description,
	prefix: cfg.prefix,
	separator: '',
	version: pkg.version,
	onReply: (msg, context) => {
		if (!msg || msg.includes('unknown command ')) return;
		context.msg.reply('\n' + msg)
			.then(bot_response => {
				if (cfg.delete_after_reply.enabled) {
					context.msg.delete(cfg.delete_after_reply.time).catch(console.error);
					bot_response.delete(cfg.delete_after_reply.time).catch(console.error);
				}
			});
	}
});

let adminApp = new Clapp.App({
	name: cfg.name + "-admin",
	desc: cfg.admin_app.desc,
	prefix: cfg.admin_app.prefix,
	separator: '',	
	version: pkg.version,
	onReply: (msg, context) => {
		if (!msg || msg.includes('unknown command ')) return;
		context.msg.reply('\n' + msg)
			.then(bot_response => {
				if (cfg.delete_after_reply.enabled) {
					context.msg.delete(cfg.delete_after_reply.time).catch(console.error);
					bot_response.delete(cfg.delete_after_reply.time).catch(console.error);
				}
			});
		botAdmins = context.botAdmins;
		blacklist = context.blacklist;
	}
});

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

client.on('message', msg => {
	try {
		if(msg.channel.type === 'dm') return;

		if (msg.author.id === client.user.id) {
			if (msg.type === 'PINS_ADD')
				try { msg.delete(); } catch (ex) {}
			//return; //don't talk to yourself, don't trigger yourself
		}

		//Check if automation triggered to make a room
		msg.embeds.forEach(embed => {
			if (embed && embed.type === 'rich' && embed.title.indexOf('Raid') > -1) {
				var params = bot.BuildChannelParams(msg.guild, embed);
				var roomCheck = bot.GetRoom(msg.guild, params.channelName, params.coords);
				if (roomCheck) { //Channel already exists
					console.log(`Automatic channel creation tried to make an existing channel ${roomCheck.channel.name} on guild ${roomCheck.channel.guild}. Create request name was ${params.channelName}.`);
					if (roomCheck.channel.name != params.channelName) {
						bot.UpdateClosingTime(msg, roomCheck, params);
						bot.UpdateRoomName(msg.guild, roomCheck, params.channelName);
					} else { //Message origin channel about the existing channel
						msg.channel.send(`Room already exists -> ${roomCheck.channel}.`);
					}
				} else {
					var minutesRemaining = Math.floor(params.time / 60);
					var minAutoCreateTime = bot.AutoCreateMinTime(msg.guild, null);
					if (minutesRemaining >= minAutoCreateTime) { //Spawn new channel
						bot.CreateChannel(msg.guild, params.channelName, params.time, params.coords, null)
							.then(response => { bot.PostChannel(response, msg.channel, params.coords); });
					} else { //Too short to spawn a channel; Message origin channel about not making the channel
						msg.channel.send(`${params.channelName} was not created. Remaining time too short - ${minutesRemaining} minutes.`);
						console.log(`Automatic room not created due to remaining time being too short - ${minutesRemaining} minutes - ${params.channelName} on guild ${msg.guild}. Guild set to ${minAutoCreateTime} minute min.`);
					}
				}
			}
		});

		if (generalApp.isCliSentence(msg.content)) {
			if (blacklist.indexOf(msg.author.id) === -1) {
				generalApp.parseInput(msg.content, {
					msg: msg,
					summaryHandler: summaryHandler
				});
			} else {
				msg.delete(7500);
			}
		} else if (adminApp.isCliSentence(msg.content)) {
			if (botAdmins.indexOf(msg.author.id) != -1 || bot.IsInModRoles(msg.guild, msg.member.roles)) {
				adminApp.parseInput(msg.content, {
					msg: msg,
					summaryHandler: summaryHandler,
					botAdmins: botAdmins,
					blacklist: blacklist,
					botUser: client.user
				});
			}
		} else if (cfg.disallow_talking && msg.author.id !== client.user.id) {
			msg.reply('\n' + "Please talk in a non-protected channel.")
			.then(bot_response => {
				msg.delete();
				bot_response.delete(7500);
			});
		} else { return; }
	} catch (ex) {
		console.error(ex);
	}
});

client.on('ready', (event) => {
	//Register the category_channel for each guild
	client.guilds.array().forEach(guild => {
		var categoryChannel = bot.CategoryChannel(guild, client.user, null);
		bot.CategoryChannel(guild, client.user, categoryChannel);
		console.log(bot.CategoryChannel(guild, client.user, null) + ` set as category channel for ${guild}`);
	});

	//attempt to re-add all created channels for watching
	client.channels.array().forEach(channel => {
		bot.ReregisterChannel(channel);

		//message to re-activate gymhuntr
		if (channel.topic != null && channel.topic.startsWith("!{gymhuntr}")){
			//fire off now
			channel.send("!activate"); 
			//repeat every three days
			setInterval(function() { channel.send("!activate"); }, 259200000);
		}
	});

	//every 30s do cleanup
	setInterval(function() { bot.CleanupRooms(); }, 30000);
});

client.on('error', function(message) {
    console.log('error recieved', message);
});

client.on('channelDelete', function(channel) {
	if (!channel.guild) return;
	var rooms = bot.CreatedRooms(channel.guild);
	var room = rooms.find(function(r){
		return r.channel.id == channel.id;
	});

	bot.ForgetChannel(room);
});

// Startup tasks
console.log("Loading...");

let getBotTokenPromise = db.config.token.get();
let getBotAdminsPromise = db.config.admins.getAll();
let getBlacklistPromise = db.config.blacklist.getAll();
let getGeneralCommandsPromise = new Promise((fulfill, reject) => {
	fs.readdir("./lib/commands/general", {encoding: "utf-8"}, (err, files) => {
		if (!err) {
			files.forEach(file => {
				if (file.match(/(?:.+).js/)) {
					generalApp.addCommand(require("./commands/general/" + file));
				}
			});
			fulfill();
		} else {
			reject(err);
		}
	});
});
let getAdminCommandsPromise = new Promise((fulfill, reject) => {
	fs.readdir("./lib/commands/admin", {encoding: "utf-8"}, (err, files) => {
		if (!err) {
			files.forEach(file => {
				if (file.match(/(?:.+).js/)) {
					adminApp.addCommand(require("./commands/admin/" + file));
				}
			});
			fulfill();
		} else {
			reject(err);
		}
	});
});

Promise.all([getBotTokenPromise, getBotAdminsPromise, getBlacklistPromise, getGeneralCommandsPromise, getAdminCommandsPromise])
	.then(values => {
		let botToken = values[0];
		botAdmins = values[1];
		blacklist = values[2];

		client.login(botToken).then(() => {
			masterChannel = client.channels.get(cfg.master_channel);
			summaryHandler = new SummaryHandler(client, masterChannel);

			// Execute the update function now and every update_interval milliseconds
			(function update(){
				// Update all active events' summaries
				db.events.getAllActive()
					.then(
						events => {
							for (let i = 0; i < events.length; i++) {
								summaryHandler
									.updateSummary(events[i])
									.catch(console.error);
							}
					})
					.catch(console.error);

				setTimeout(update, cfg.update_interval);
			})();

			console.log("Running!");
		});
	})
	.catch(console.error);
	