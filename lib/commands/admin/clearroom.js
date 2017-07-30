"use strict";

const Clapp  = require('../../modules/clapp-discord/index');

module.exports = new Clapp.Command({
	name: "clearroom",
	desc: "Remove all messages from a room",
	fn: (argv, context) => {
		context.msg.channel
			.fetchMessages({ before: context.msg.id })
			.then(messages => context.msg.channel.bulkDelete(messages))
			.then(context.msg.delete())
			.then(console.log(`Cleared all channel messages in ${context.msg.channel}`));
		return;
	}
});