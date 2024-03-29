/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const constants = require('./constants.js');

module.exports = {
	// Your bot name. Typically, this is your bot's username without the discriminator.
	// i.e: if your bot's username is MemeBot#0420, then this option would be MemeBot.
	name: "RoomBot",

	// The bot's command prefix. The bot will recognize as command any message that begins with it.
	// i.e: "-schedulebot foo" will trigger the command "foo",
	//      whereas "ScheduleBot foo" will do nothing at all.
	prefix:  "!", // Tip: If you use "<@YOUR_BOT_USER_ID>", you can have the prefix

	// This is a readable version of the prefix. Generally, this is the same as prefix, but if
	// you set prefix to be in the form of "<@YOUR_BOT_USER_ID>", you'd need to set readable_prefix
	// to be "@ScheduleBot" (or however your bot user is named).
	//
	// This is because when you use the characters `` in Discord (to highlight a command, in
	// ScheduleBot's case), the string "<@YOUR_BOT_USER_ID>" doesn't get parsed as a mention.
	// So in order not to mislead the user, we have a separate option for a readable version of
	// our prefix.
	readable_prefix: "!",

	// Admin app settings
	admin_app: {
		desc: "RoomBot admin commands",
		prefix: "~",
		roles: "Moderator;RaidLeader"
	},

	//Amount of time required for a channel to be automatically spawned
	auto_create_channel_min_time: 20,

	//[{type:config.MessagePart,element:config.ParserPart,value:string}]
	auto_create_channel_parser: [
		{type:constants.MessagePart.Title, element:constants.ParserPart.Title, value:/against\s(.+)!/i},
		{type:constants.MessagePart.Title, element:constants.ParserPart.Description, value:/(?:\*{0,2}(?:LOCATION|ADDRESS):\*{0,2}\s((?!unknown).+))/i},
		{type:constants.MessagePart.Time, element:constants.ParserPart.Description, value:/(?:(\d+)\s{0,1}(?:hours?|h))?\s*(?:(\d+)\s{0,1}(?:min|m))\s*(?:(\d+)\s{0,1}(?:secs?|s))?/},
		{type:constants.MessagePart.Coords, element:constants.ParserPart.Url, value:/(-?\d+\.?\d*,-?\d+\.?\d*)/},
	],

	//Amount of time allowed to create a channel for
	create_channel_max_time: 120,

	//channel used as default for bot created channels to spawn under
	category_channel: "raids",

	// TODO: Remove
	master_channel: "poke-bot",

	// Events are considered "happening" for a margin of time, where users can see that the event
	// is happening right now. During that time, the event is not considered expired yet.+
	// This config determines for how long.
	happening_margin: 60000 * 5, // In milliseconds

	// Update interval
	// Every X milliseconds, ScheduleBot will update all active summaries.
	update_interval: 60000, // In milliseconds

	// List of accepted timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
	default_timezone: "America/Chicago",

	// If this option is enabled, the bot will delete the message that triggered it, and its own
	// response, after the specified amount of time has passed.
	// Enable this if you don't want your channel to be flooded with bot messages.
	// ATTENTION! In order for this to work, you need to give your bot the following permission:
	// MANAGE_MESSAGES - 	0x00002000
	// More info: https://discordapp.com/developers/docs/topics/permissions
	delete_after_reply: {
		enabled: false,
		time: 60000, // In milliseconds
	},

	// If true, it will delete any message that is not a command from the master channel.
	// Leave this on to keep your master channel tidy.
	// This also requires the "manage messages" permission
	disallow_talking: false
};

// "Add to server" link:
// https://discordapp.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=0x00002000
