/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');

module.exports = new Clapp.Command({
	name: "clear",
	desc: "Remove all messages from a room",
	fn: (argv, context) => {
		var count = argv.args.count;
		if (count > 100 || count < 1) count = 100;
		context.msg.channel
			.fetchMessages({ before: context.msg.id, limit: count })
			.then(messages => context.msg.channel.bulkDelete(messages.filter(function(m){ return !m.pinned; })))
			.then(context.msg.delete())
			.then(console.log(`Cleared ${count} channel messages in ${context.msg.channel} on ${context.msg.guild}`));
		return;
	},
	args: [
		{
			name: "count",
			desc: "The number of messages to delete [1-100]",
			type: "number",
			default: 100,
			required: false
		}
	]
});