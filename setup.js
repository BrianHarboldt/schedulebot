/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

const fs       = require("fs");
const inquirer = require("inquirer");
const pg       = require("pg");
var cfg        = require("./config");


// So that we don't get a "can't read property of undefined" error
cfg.db = cfg.db || {};

inquirer.prompt([
	{
		type: "input",
		name: "db_host",
		message: "Host",
		default: cfg.db.host || null
	},
	{
		type: "input",
		name: "db_database",
		message: "Database",
		default: cfg.db.database || null
	},
	{
		type: "input",
		name: "db_user",
		message: "User",
		default: cfg.db.user || null
	},
	{
		type: "password",
		name: "db_password",
		message: "Password",
		default: cfg.db.password || null
	},
	{
		type: "confirm",
		name: "db_ssl",
		message: "Use SSL?",
		default: true
	}
])
.then(answers => {
	pg.defaults.ssl = answers.db_ssl;
	var conStr = "postgres://" + answers.db_user + ":" + answers.db_password + "@" + answers.db_host + "/" + answers.db_database;
	var client = new pg.Client(conStr);
	client.connect(err => {
		if (err) throw err;
		client.query("select * from information_schema.tables where table_schema = 'public'", (err, result) =>
		{
			if (err) throw err;
			if (result.rowCount !== 0) throw new Error("Sorry, but your database is not empty. You'll need to either empty it or modify whant you need manually.");
			createDbStructure(client)
			.then(() => {
				inquirer.prompt({
					type: "text",
					name: "bot_token",
					message: "Enter Discord bot's token (https://discordapp.com/developers/applications/me)"
				})
				.then(answers => {
					client.query("INSERT INTO public.config (id, value) VALUES ($1, $2);", ["bot_token", answers.bot_token], (err) =>
					{
						if (err) throw err;
						inquirer.prompt([{
							type: "text",
							name: "admin_id",
							message: "Admin's discord user ID (use Discord's Developer Mode)"
						}, {
							type: "text",
							name: "admin_name",
							message: "Admin's discord user name (used to label the database entry)"
						}])
						.then(answers => {
							client.query("INSERT INTO public.admins (userid, name) VALUES ($1, $2)", [answers.admin_id, answers.admin_name], err =>
							{
								if (err) throw err;
								process.exit();
							});
						});
					});
				});
			});
		});
	});
})
.catch(function (error) {
	console.error(error);
	process.exit();
});

function createDbStructure(client) {
	return new Promise((fulfill, reject) => {
		try {
			var sql = fs.readFileSync("./db_setup.pgsql", {encoding: "utf-8"});
			client.query(sql, err => {
				if (err) throw err;
				fulfill();
			});			
		} catch (err) {
			reject(err);
		}
	});
}