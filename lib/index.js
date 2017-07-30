"use strict";

const fs             = require('fs');
const Clapp          = require('./modules/clapp-discord');
const SummaryHandler = require('./modules/summaryhandler');
const db             = require('./modules/dbhandler');
const cfg            = require('../config.js');
const pkg            = require('../package.json');
const Discord        = require('discord.js');
const bot            = new Discord.Client();

let masterChannel, summaryHandler, botAdmins, blacklist = [];

let generalApp = new Clapp.App({
	name: cfg.name,
	desc: pkg.description,
	prefix: cfg.prefix,
	version: pkg.version,
	onReply: (msg, context) => {
		if (!msg) return;
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
	version: pkg.version,
	onReply: (msg, context) => {
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

bot.on('message', msg => {
	//Check if gymbot posted and we need to make a room
	msg.embeds.forEach(embed => {
		if (embed && embed.type === 'rich' && embed.title.indexOf('Raid') > -1)
		{
			
		}
	});

	if (msg.author.id === bot.user.id)
		return;

	try {
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
			if (botAdmins.indexOf(msg.author.id) != -1) {
				adminApp.parseInput(msg.content, {
					msg: msg,
					summaryHandler: summaryHandler,
					botAdmins: botAdmins,
					blacklist: blacklist
				});
			} else {
				msg.delete(7500);
			}
		} else if (cfg.disallow_talking && msg.author.id !== bot.user.id) {
			msg.reply('\n' + "Please talk in a non-protected channel.")
			.then(bot_response => {
				msg.delete();
				bot_response.delete(7500);
			});
		}
	} catch (ex) {
		console.error(ex);
	}
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

Promise.all(
	[getBotTokenPromise, getBotAdminsPromise, getBlacklistPromise,
		getGeneralCommandsPromise, getAdminCommandsPromise]
).then(values => {

	let botToken = values[0];
	botAdmins = values[1];
	blacklist = values[2];

	bot.login(botToken).then(() => {
		masterChannel = bot.channels.get(cfg.master_channel);
		summaryHandler = new SummaryHandler(bot, masterChannel);

		// Execute the update function now and every update_interval milliseconds
		(function update(){
			// Update all active events' summaries
			db.events.getAllActive().then(
				events => {
					for (let i = 0; i < events.length; i++) {
						summaryHandler.updateSummary(events[i]).catch(console.error);
					}
				}
			).catch(console.error);

			setTimeout(update, cfg.update_interval);
		})();

		console.log("Running!");
	});

}).catch(console.error);
