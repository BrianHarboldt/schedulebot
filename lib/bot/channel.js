"use strict";

module.exports = {
    CreateChannel: function(guild, guildId, channelName, time) {
        return guild.createChannel(channelName, "text")
			.then(channel => {
				console.log(`Created new channel ${channel} on guild ${guildId}`);
				//TODO: queue for delete
				return `Channel created ${channel} for ${time} minutes`;
			})
			.catch(console.error);
    }
};
