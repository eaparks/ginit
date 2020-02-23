#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const files = require('./lib/files');
const github = require('./lib/github');
const repo = require('./lib/repo');

clear();

console.log(
	chalk.yellow(
		figlet.textSync('Ginit', {horizontalLayout: 'full'})
	)
);

if (files.directoryExists('.git')) {
	console.log(chalk.red('Already a Git repository!'));
	process.exit();
}

const getGithubToken = async () => {
	// Fetch token from config store
	let token = github.getStoredGithubToken();
	if (token) {
		return token;
	}

	// No token found, use credentials to access GitHub account
	token = await github.getPersonalAccessToken();

	return token;
};

const run = async () => {
	try {
		// Retrieve & Set Authentication token
		const token = await getGithubToken();
		github.githubAuth(token);

		// Create remote repo
		const url = await repo.createRemoteRepo();

		// Create .gitignore file
		await repo.createGitignore();

		// Set up local repo and push to remote
		await repo.setUpRepo(url);

		console.log(chalk.green('All done!'));

	} catch (err) {
		if (err) {
			switch (err.status) {
				case 401:
					console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials/token.'));
					break;
				case 422:
					console.log(chalk.red('There is already a remote repository or token with the same name. err is: ' + err));
					break;
				default:
					console.log(chalk.red(err));
			}
		}
	}
};

run();

