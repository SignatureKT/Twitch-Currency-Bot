const tmi = require('tmi.js');
const hashtable = require('./hashtable');
const functions = require('./functions');
const csv = require('csv-parser');
const fs = require('fs');
import { CHANNEL_NAME, OAUTH_TOKEN, BOT_USERNAME } from './constants/bot';
import { COMMAND_DICE, COMMAND_LOOKUP, EXTENSION_SHARE, COMMAND_CURRENCY, COMMAND_GAMBLE, COMMAND_TOP, COMMAND_BET, COMMAND_DUEL, COMMAND_ACCEPT } from './constants/command';
import { CURRENCY_NAME, USER_DATABASE, GIVE_TIME, BET_WINDOW_TIMER, DUELING_WINDOW_TIMER } from './constants/variable';
const options = {
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: BOT_USERNAME,
		password: OAUTH_TOKEN,
	},
	channels: [ CHANNEL_NAME ]
}

// Create a client with our options
const client = new tmi.client(options);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// execute function at repeatedly intervals
setInterval(function() {
	// retrieve viewers from twitch-api and run function within the callback function
	functions.get_current_viewers(function (viewers) { functions.give_currency(viewers) });
}, GIVE_TIME);

// Reads and Parse CSV file into hashtable
fs.createReadStream(USER_DATABASE).pipe(csv()).on('data', (user) => {
	hashtable.hash_table_insert(user);
}).on('end', () => {
	console.log('CSV file successfully processed');
});

// Called every time a message comes in the chat
function onMessageHandler (target, context, msg, self) {
	if (self) { return; } // Ignore messages from the bot
  
	// Simplify to user
	let username = context.username;

	// Check if username is in the data structure
	if (!hashtable.hash_table_lookup(username) && !functions.check_bot(username)) {
		// create and insert user into hash table
		hashtable.init_user(username);
	}

  
	// Split command whitespaces into an array and remove symbols
	const commandInput = functions.remove_at_symbols(msg).split(" "[0]);
	console.log(commandInput);

	// COMMAND: Dice Command
	// If the command is known, let's execute it
	if (commandInput[0] === COMMAND_DICE) {
		const num = functions.roll_dice();
		client.say(target, `You rolled a ${num}`);
	}

	// COMMAND: !currency command
	// look at your currency
	if(commandInput[0] === COMMAND_CURRENCY && commandInput[1] !== EXTENSION_SHARE) {
		let tmp = hashtable.hash_table_lookup(`${username}`);
		// if null
		if(!tmp) client.say(target, `person does not exist!`);
		else client.say(target, `${tmp.name} has ${tmp.currency} ${CURRENCY_NAME}!`);
	}

	if(commandInput[0] === COMMAND_CURRENCY && commandInput[1] === EXTENSION_SHARE && functions.is_int(commandInput[3])) {
		let sharedTmp = hashtable.hash_table_lookup(`${commandInput[2]}`);
		let sharingTmp = hashtable.hash_table_lookup(`${username}`);
		if(!sharedTmp) client.say(target, `${commandInput[2]} does not exist`);
		else if (parseInt(sharingTmp.currency, 10) < parseInt(commandInput[3], 10)) client.say(target,`You do not have enough ${CURRENCY_NAME}`);
		else {
			functions.remove_currency(sharingTmp, commandInput[3]);
			functions.add_currency(sharedTmp, commandInput[3]);
			client.say(target, `${sharingTmp.name} shared ${commandInput[3]} ${CURRENCY_NAME} to ${sharedTmp.name}!`);
		}
		functions.write_to_csv();
	}

	// COMMAND :!gamble [amount]
	// A randomizer is used to determine whether the user win or loses currency
	if(commandInput[0] === COMMAND_GAMBLE) {
		let tmp = hashtable.hash_table_lookup(`${username}`);
		if(functions.is_int(commandInput[1]) && parseInt(tmp.currency, 10) >= parseInt(commandInput[1], 10)) {
			if(functions.random_zero_or_one()) {
				functions.add_currency(tmp, commandInput[1]);
				client.say(target,`${tmp.name} has won ${commandInput[1]}!`);
			} else {
				functions.remove_currency(tmp, commandInput[1]);
				client.say(target, `${tmp.name} lost ${commandInput[1]} ${CURRENCY_NAME}`);
			}
		} else if(commandInput[1] === 'all' && parseInt(tmp.currency, 10) != 0) {
			if(functions.random_zero_or_one()) {
				client.say(target,`${tmp.name} has won ${tmp.currency/2}`);
				functions.add_currency(tmp, tmp.currency);
			} else {
				functions.remove_currency(tmp, tmp.currency);
				client.say(target, `${tmp.name}, you have lost all your ${CURRENCY_NAME}`);
			}
		} else client.say(target, `usage: '${COMMAND_GAMBLE} [amount]', and enough ${CURRENCY_NAME}`);
		functions.write_to_csv();
	}

	// COMMAND: !top
	// display the top 5 in the leader board
	if(commandInput[0] === COMMAND_TOP) {
		let userArray = hashtable.hash_table_array();
		let topArray = hashtable.top_leaderboard(userArray);

		client.say(target, `
		1. ${topArray[0].name} : ${topArray[0].currency}
		2. ${topArray[1].name} : ${topArray[1].currency}
		3. ${topArray[2].name} : ${topArray[2].currency}
		4. ${topArray[3].name} : ${topArray[3].currency}
		5. ${topArray[4].name} : ${topArray[4].currency}
		`);
	}

	// COMMAND: !bet on
	// command to allow users to place in bets until a specified amount of time
	if(commandInput[0] === COMMAND_BET && !functions.switches.bet && !functions.switches.inGame && commandInput[1] === 'on') {
		functions.get_current_moderators(function (moderators) {
			for(let i = 0; i < moderators.length; i++) {
				if(username === moderators[i]) {
					functions.switches.bet = true;
					client.say(target, `Bets are on! You have ${BET_WINDOW_TIMER/(60*1000)} minute to place your bets. To bet enter '!bet [win/lose] [amount]'`);
					setTimeout(function () { functions.turn_bets_off(client, target) }, BET_WINDOW_TIMER);
				}
			}
		});
	}

	// COMMAND !bet [win/lose] [amount]
	// allows users to place in bets and amount at stake
	if(commandInput[0] === COMMAND_BET && functions.switches.bet && !functions.switches.inGame && commandInput[1] !== 'refund') {
		let tmp = hashtable.hash_table_lookup(`${username}`);
		if(commandInput[1] === 'win' && tmp.bet === 'off' && parseInt(tmp.currency, 10) >= parseInt(commandInput[2], 10)) {
			if(functions.is_int(commandInput[2])) functions.add_stake(commandInput[1], commandInput[2]);
			else if(commandInput[2] === 'all') functions.add_stake(commandInput[1], tmp.currency);
			else client.say(target, `usage: ${COMMAND_BET} [win/lose] [amount]`);
		} else if(commandInput[1] === 'lose' && tmp.bet === 'off' && parseInt(tmp.currency, 10) >= parseInt(commandInput[2], 10)) {
			if(functions.is_int(commandInput[2])) functions.add_stake(commandInput[1], commandInput[2]);
			else if(commandInput[2] === 'all') functions.add_stake(commandInput[1], tmp.currency);
			else client.say(target, `usage: ${COMMAND_BET} [win/lose] [amount]`);
		}
	}

	// COMMAND !bet result [win/lose]
	// command to give currency to the user who won the bet
	if(commandInput[0] === COMMAND_BET && !functions.switches.bet && functions.switches.inGame && commandInput[1] === 'result') {
		if(commandInput[2] === 'win') {
			functions.bet_result(commandInput[2], 'lose');
			functions.turn_bet_switches_off();
			client.say(target, `Bets on win recieved ${CURRENCY_NAME}!`);
		} else if(commandInput[2] === 'lose') {
			functions.bet_result(commandInput[2], 'win');
			functions.turn_bet_switches_off();
			client.say(target, `Bets on lose recieved ${CURRENCY_NAME}!`);
		} else client.say(target, `usage: !bet result [win/lose]`);
	}

	// COMMAND: !bet refund
	// command to refund bets
	if(commandInput[0] === COMMAND_BET && commandInput[1] === 'refund') {
		functions.refund_bets();
		turn_bet_switches_off();
		client.say(target, `Bets are refunded!`);
	}

	// COMMAND: !duel [user] [amount]
	// command to duel a user
	if(commandInput[0] === COMMAND_DUEL && functions.is_int(commandInput[2]) && functions.switches.duel === 'off') {
		let challengedTmp = hashtable.hash_table_lookup(`${commandInput[1]}`);
		let challengerTmp = hashtable.hash_table_lookup(`${username}`);
		if(!challengedTmp) client.say(target, `${commandInput[1]} does not exist`);
		else if (parseInt(challengedTmp.currency, 10) < parseInt(commandInput[2], 10)) client.say(target,`${challengedTmp.name} does not have enough ${CURRENCY_NAME}`);
		else if (parseInt(challengerTmp.currency, 10) < parseInt(commandInput[2], 10)) client.say(target,`You do not have enough ${CURRENCY_NAME}`);
		else {
			functions.switches.duel = challengedTmp.name;
			client.say(target, `@${challengedTmp.name}, you have been challenged by ${challengerTmp.name}! '!accept' to duel.`);
			setTimeout(function () { functions.duel(challengerTmp, challengedTmp, commandInput[2], client, target) }, DUELING_WINDOW_TIMER);
		}
	}

	// COMMAND: !duel accept
	// accept a duel challange
	if(commandInput[0] === COMMAND_ACCEPT && !functions.switches.accept && username === functions.switches.duel) {
		functions.switches.accept = true;
	}

	if(commandInput[0] === '!test') {
		let tmp = hashtable.hash_table_lookup(`${username}`);
		console.log(`user bet: ${tmp.bet} user stake: ${tmp.stake}`);
		console.log(`bet: ${functions.switches.bet} inGame: ${functions.switches.inGame}`);
		client.say(target, `user challenged: ${functions.switches.duel} accept: ${functions.switches.accept}`);
		client.say(target, `${functions.switches.accept} + ${username === functions.switches.duel}`);
	}

	if(commandInput[0] === '!printusers') {
		hashtable.print_array()
	}
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}