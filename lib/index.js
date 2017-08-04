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
				var params = bot.BuildChannelParams(embed);
				bot.CreateChannel(msg.guild, params.channelName, params.time)
					.then(response => {
						//Message creation channel
						bot.PostChannel(response, msg.channel);

						//post the triggering message in new channel
						//var clone = bot.CloneEmbed(embed);
						//response.channel.send({ embed: clone });
						//	.then(m2 => m2.pin());

						//Create map in new channel
						var channelMap = bot.GenerateMap(params.coords)
							.setTitle(params.channelName);						
						response.channel.send({ embed: channelMap })
							.then(m2 => m2.pin());
						response.channel.send(`Expires at about ${bot.ConvertTime(response.expiresAt)}`)
							.then(m2 => m2.pin());
					});
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
			var modRole = bot.GetModRole(msg.guild);
			if (botAdmins.indexOf(msg.author.id) != -1 ||
				msg.member.roles.find(function(r) {return r.name == modRole;})) {
				adminApp.parseInput(msg.content, {
					msg: msg,
					summaryHandler: summaryHandler,
					botAdmins: botAdmins,
					blacklist: blacklist
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
	//every 30s do cleanup
	setInterval(function() { bot.CleanupRooms(); }, 30000);
});

client.on('error', function(message) {
    console.log('error recieved', message);
});

client.on('channelDelete', function(channel) {
	var rooms = bot.CreatedRooms();
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
