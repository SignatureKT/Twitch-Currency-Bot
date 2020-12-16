const hashtable = require('./hashtable');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const request = require('request');
const fs = require('fs');
const ini = require('ini');
const BOT = [ 'moobot', 'nightbot', 'streamelements', 'poppy_jalopy_bot' ];
import { CURRENCY_INCREMENT, CURRENCY_NAME, USER_DATABASE, AT_SYMBOL, DUEL_COOLDOWN_TIMER } from './constants/variable';
import { GET_CURRENT_VIEWER_URL } from './constants/bot';
import { userInfo } from 'os';
import { writer } from 'repl';

const config = ini.parse(fs.readFileSync('./src/config.ini', 'utf-8'));

export let switches = {
	bet: config.bet.bet,
	inGame: config.bet.inGame,
	duel: 'off',
	accept: false
};

//writes new users to csv files once the program ends
//process.on('SIGINT', function() {
//	write_to_csv();
//});

export function write_to_csv() {
	let userArray = hashtable.hash_table_array();
	const csvWriter = createCsvWriter({
		path: USER_DATABASE,
		header: [
			{id: 'name', title: 'name'},
			{id: 'currency', title: 'currency'},
			{id: 'bet', title: 'bet'},
			{id: 'stake', title: 'stake'}
		]
	});
	csvWriter.writeRecords(userArray).then(() => console.log('The CSV file was written successfully'));
	config.bet.bet = switches.bet;
	config.bet.inGame = switches.inGame;
	fs.writeFileSync('./src/config.ini', ini.stringify(config, { whitespace: '' }));
}

// Function called when the "dice" command is issued
export function roll_dice () {
	const sides = 6;
	return Math.floor(Math.random() * sides) + 1;
}

// Remove unwanted @ symbol
export function remove_at_symbols(command) {
	let newCommand = '';
	for(let i = 0; i < command.length; i++) {
		if(command[i] != AT_SYMBOL) {
			newCommand += command[i];
		}
	}
	return newCommand;
}

//give currency to all users
export function give_currency(viewers) {
	viewers = remove_bot(viewers);
	//loops through all the chatters in the room
	for(let i = 0; i < viewers.length; i++) {
		// check if username is in the data structure
		let tmp = hashtable.hash_table_lookup(viewers[i]);
		if (!tmp && !check_bot(viewers[i])) {
			// create and insert user into hash table
			hashtable.init_user(viewers[i]);
			console.log(`${viewers[i]} has been assigned to the ${CURRENCY_NAME} system.`);
			tmp = hashtable.hash_table_lookup(viewers[i]);
		}
		add_currency(tmp, CURRENCY_INCREMENT);
	}
	write_to_csv();
	console.log(`${CURRENCY_INCREMENT} ${CURRENCY_NAME} has been given!`);
}

//parse url and retrieve chatters
export function get_current_viewers(callback) {
	request({
		url: GET_CURRENT_VIEWER_URL,
		json: true
	}, function (err, response, viewers) {
		if(!err && response.statusCode === 200) {
			let currentViewers = viewers.chatters.viewers
			.concat(viewers.chatters.moderators)
			.concat(viewers.chatters.vips)
			.concat(viewers.chatters.broadcaster);
			callback(currentViewers);
		}
	});
}

export function get_current_moderators(callback) {
	request({
		url: GET_CURRENT_VIEWER_URL,
		json: true
	}, function (err, response, moderators) {
		if(!err && response.statusCode === 200) {
			let currentModerators = moderators.chatters.moderators
			.concat(moderators.chatters.broadcaster);
			callback(currentModerators);
		}
	});
}

export function add_currency(tmp, currency) {
	if(!check_bot(tmp.name)) {
		// assign user and increments the user's currency
		let totalCurrency = parseInt(tmp.currency);
		totalCurrency += parseInt(currency);
		tmp.currency = totalCurrency.toString();
	}
}

export function remove_currency(tmp, currency) {
	if(!check_bot(tmp.name)) {
		// assign user and increments the user's currency
		let totalCurrency = parseInt(tmp.currency);
		totalCurrency -= parseInt(currency);
		tmp.currency = totalCurrency.toString();
	}
}

export function is_int(value) {
	let x = parseFloat(value);
	return !isNaN(value) && (x | 0) === x;
}

export function random_zero_or_one() {
	return (Math.random() > 0.6) ? 1 : 0;
}

export function check_bot(name) {
	for(let i = 0; i < BOT.length; i++) {
		if(name === BOT[i]) {
			return true;
		}
	}
	return false;
}

function remove_bot(nameArray) {
	let tmpNewArray = new Array();
	for(let i = 0; i < nameArray.length; i++) {
		if(!check_bot(nameArray[i])) {
			tmpNewArray.push(nameArray[i]);
		}
	}
	return tmpNewArray;
}

export function turn_bets_off(client, target) {
    switches.bet = false;
	switches.inGame = true;
	client.say(target, `Bets are off!`);  
}

export function turn_bet_switches_off() {
	switches.bet = false;
	switches.inGame = false;
}

export function bet_result(won, lost) {
	for(let i = 0; i < hashtable.TABLE_SIZE; i++) {
		if(hashtable.hash_table[i] != null) {
			let tmp = hashtable.hash_table[i];
			while(tmp != null) {
				if(tmp.bet === won) {
					add_currency(tmp, tmp.stake * 2);
					tmp.bet = 'off';
					tmp.stake = 0;
				}
				else if(tmp.bet === lost) {
					tmp.bet = 'off';
					tmp.stake = 0;
				}
				tmp = tmp.next;
			}
		}
	}
	write_to_csv();
}

export function refund_bets() {
	for(let i = 0; i < hashtable.TABLE_SIZE; i++) {
		if(hashtable.hash_table[i] != null) {
			let tmp = hashtable.hash_table[i];
			while(tmp != null) {
				if(tmp.bet !== 'off') {
					add_currency(tmp, tmp.stake);
					tmp.bet = 'off';
					tmp.stake = 0;
				}
				tmp = tmp.next;
			}
		}
	}
	write_to_csv();
}

export function add_stake(bet, stake) {
	tmp.bet = bet;
	tmp.stake = stake;
	tmp.currency -= tmp.stake;
}

export function duel(challenger, challenged, stake, client, target) {
	if(switches.accept === true) {
		let oneOrZero = Math.random() > 0.5 ? 1 : 0;
		if(oneOrZero === 1) {
			if(stake >= 5000) {
				add_currency(challenger, stake);
				remove_currency(challenged, stake);
				client.say(target, `@${challenger.name} has slain ${challenged.name} for a whopping ${stake} ${CURRENCY_NAME}!`);
			}
			else {
				add_currency(challenger, stake);
				remove_currency(challenged, stake);
				client.say(target, `@${challenger.name} has easily slain ${challenged.name} in cold blood for a mere amount of ${stake} ${CURRENCY_NAME}.`);
			}
		} else {
			add_currency(challenged, stake);
			remove_currency(challenger,stake);
			client.say(target, `@${challenged.name} has successful killed ${challenger.name} in a tough duel and recieved ${stake} ${CURRENCY_NAME}`);
		}
	} else client.say(target, `@${challenged.name}... you ran away with your tail between your legs...`);
	write_to_csv();
	setTimeout(function () { turn_duel_off(client, target) }, DUEL_COOLDOWN_TIMER);
}

export function turn_duel_off(client, target) {
	switches.duel = 'off';
	switches.accept = false;
    client.say(target, `Duel is back up! !duel to duel.`);
}