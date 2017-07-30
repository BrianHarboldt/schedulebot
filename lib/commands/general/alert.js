"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const Discord = require('discord.js');

module.exports = new Clapp.Command({
	name: "alert",
	desc: "Sample alert",
	fn: (argv, context) => {
        if (argv.args.option === 'gym'){
            context.msg.channel.send({
                embed: new Discord.RichEmbed()
                    .setTitle('Level 3 Raid has started!')
                    .setDescription('**One Community Church.**\nJolteon\nCP: 19883.\n*Raid Ending: 1 hours 48 min 8 sec*')
                    .setURL('https://GymHuntr.com/#33.010702,-96.991658')
                    .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/135.png')
                    .setColor("green")                  
            });
            return;
        }
        if (argv.args.option === 'poke'){
            context.msg.channel.send({
                embed: new Discord.RichEmbed()
                    .setTitle('**A wild Squirtle (7) has appeared!**')
                    .setDescription('Click above to view in the wild.\n\n*Remaining: 8 min 28 sec*')
                    .setURL('https://PokeFetch.com/#32.779288577953196,-96.79905671213879')
                    .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/7.png')
                    .setColor("red")
            });
            return;
        }
        return "invalid option";
	},
	args: [
		{
			name: "option",
			desc: "Type of the alert message [gym|poke]",
            type: "string",
            default: "gym",
			required: false
		}
	]
});
