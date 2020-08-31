export let TABLE_SIZE = 200;
export let hash_table = new Array(TABLE_SIZE);
console.log(init_hash_table());

// structure of a user
class user {
	constructor(name, currency, bet, stake, next = null) {
		this.name = name,
		this.currency = currency,
		this.bet = bet,
		this.stake = stake,
		this.next = next
	}
}

//initalize hashtable
function init_hash_table() {
	for (let i = 0; i < TABLE_SIZE; i++) {
		hash_table[i] = null;
	}
	return true;
}

export function init_user(name) {
	if(name == null) return false;
	let newUser = new user(name, '0', 'off', '0', null);
	if(hash_table_insert(newUser)) return true;
	else return false;
}

//insert user into the hash table
export function hash_table_insert(user) {
	if(user == null) return false;
	let index = hash(user.name);
	user.next = hash_table[index];
	hash_table[index] = user;
	return true;
}

//hash username
export function hash(name) {
	let index = name.length;
	let hash_value = 0;
	let charCode = 0;
	for(let i = 0; i < index; i++) {
		charCode += name.charCodeAt(i);
		hash_value = (((hash_value << 5) - hash_value) * name.charCodeAt(0)) + charCode;
		hash_value = (hash_value * name.charCodeAt(i)) % TABLE_SIZE;
	}
	return hash_value;
}

//print array from the hashtable
export function print_array() {
	for(let i = 0; i < TABLE_SIZE; i++) {
		if(hash_table[i] == null) {
			console.log("%d --- ", i);
		} else {
			process.stdout.write(i + ' ');
			let tmp = hash_table[i];
			while(tmp != null) {
				process.stdout.write(tmp.name + ' - ');
				tmp = tmp.next;
			}
			console.log();
		}
	}
}

// create an array of users
export function hash_table_array() {
	let tmpArray = new Array();
	for(let i = 0; i < TABLE_SIZE; i++) {
		if(hash_table[i] != null) {
			let tmp = hash_table[i];
			while(tmp != null) {
				tmpArray.push(tmp);
				tmp = tmp.next;
			}
		}
	}
	return tmpArray;
}

//look up a name
export function hash_table_lookup(name) {
	let index = hash(name);
	let tmp = hash_table[index];
	while(tmp != null && tmp.name != name) {
		tmp = tmp.next;
	}
	return tmp;
}

//delete user from the hashtable
function hash_table_delete(name) {
	let index = hash(name);
	let tmp = hash_table[index];
	let prev = null;
	while(tmp != null && tmp.name != name) {
		prev = tmp;
		tmp = tmp.next;
	}
	if(!tmp) return null;
	if(!prev) {
		hash_table[index] = tmp.next;
	} else {
		prev.next = tmp.next;
	}
	return tmp;
}

export function top_leaderboard(userArray) {
	let topArray = new Array();
	userArray.map(function (s, i) {
		return {
			value1 : userArray[i],
			value2 : userArray[i].currency
		}
	}).sort(function(a, b) {
		return parseInt(b.value2) - parseInt(a.value2);
	}).forEach(function(s, i) {
		topArray[i] = s.value1;
	});
	return topArray;
}