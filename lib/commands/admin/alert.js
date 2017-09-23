/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const Clapp = require('../../modules/clapp-discord/index');
const Discord = require('discord.js');

module.exports = new Clapp.Command({
	name: "alert",
	desc: "Sample alert",
	fn: (argv, context) => {
        var hours = Math.floor(argv.args.minutes / 60);
        var minutes = argv.args.minutes % 60;
        if (argv.args.type === 'pa'){
            if (argv.args.option === 'gym'){
                context.msg.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('**Level 4 Raid is available against Tyranitar!**')
                        .setDescription(`\n**STATS:** Iron Tail / Fire Blast / 34707 CP\!\n\n**LOCATION:** ${argv.args.location}\n**ADDRESS:** ${argv.args.address}\n\n**EXPIRES:** ##:##:##pm (${hours}h ${minutes}m)\n{Map img goes here}`)
                        .setURL('http://maps.google.com/maps?q=33.010933,-97.039777')
                        .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/248.png')
                });
                return;
            }
            if (argv.args.option === 'egg'){
                context.msg.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('**Level 4 Raid is starting soon!**')
                        .setDescription(`**LOCATION:** ${argv.args.location}\n**ADDRESS:** ${argv.args.address}\n\n**Raid Starting:** ##:##:##pm (${hours}h ${minutes}m)\n{Map img goes here}`)
                        .setURL('http://maps.google.com/maps?q=33.010933,-97.039777')
                        .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/248.png')
                });
                return;
            }
            if (argv.args.option === 'poke'){
                context.msg.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('**A wild Unown has appeared**')
                        .setDescription(`**EXPIRES:** ##:##:##pm (${argv.args.minutes}m 8s).\n\n**LOCATION:** ${argv.args.address}\n\n\n{Map img goes here}`)
                        .setURL('http://maps.google.com/maps?q=32.98286574111236,-97.02544057038952')
                        .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/201.png')
                });
                return;
            }
        }
        if (argv.args.type === 'gh'){
            if (argv.args.option === 'gym'){
                context.msg.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('Level 3 Raid has started!')
                        .setDescription(`**${argv.args.location}**\nJolteon\nCP: 19883.\n*Raid Ending: ${hours} hours ${minutes} min 1 sec*`)
                        .setURL('https://GymHuntr.com/#33.010702,-96.991658')
                        .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/135.png')
                        .setColor("green")
                });
                return;
            }
            if (argv.args.option === 'egg'){
                context.msg.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('Level 3 Raid is starting soon!')
                        .setDescription(`**${argv.args.location}**\n*Raid Starting: ${hours} hours ${minutes} min 1 sec*`)
                        .setURL('https://GymHuntr.com/#33.010702,-96.991658')
                        .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/135.png')
                        .setColor("green")
                });
                return;
            }
            if (argv.args.option === 'poke'){
                context.msg.channel.send({
                    embed: new Discord.RichEmbed()
                        .setTitle('**A wild Unown (201) has appeared!**')
                        .setDescription(`Click above to view in the wild.\n\n*Remaining: ${argv.args.minutes} min 28 sec*`)
                        .setURL('https://PokeFetch.com/#32.779288577953196,-96.79905671213879')
                        .setThumbnail('https://raw.githubusercontent.com/kvangent/PokeAlarm/master/icons/201.png')
                        .setColor("red")
                });
                return;
            }
        }
        return "invalid option";
	},
	args: [
        {
			name: "type",
			desc: "Format of alert message [gh|pa]",
            type: "string",
            default: "pa",
			required: false
        },
		{
			name: "option",
			desc: "Type of the alert message [gym|poke|egg]",
            type: "string",
            default: "gym",
			required: false
        },
        {
			name: "minutes",
			desc: "Number of minutes in description",
            type: "number",
            default: 35,
			required: false
        },
        {
			name: "location",
			desc: "Name of the location",
            type: "string",
            default: "unknown",
			required: false
		},
        {
			name: "address",
			desc: "Name of the address",
            type: "string",
            default: "unknown",
			required: false
		}
	]
});
