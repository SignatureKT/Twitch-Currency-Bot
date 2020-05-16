import tmi from 'tmi.js';
import fs, { readFile } from 'fs';
import { BOT_USERNAME, OAUTH_TOKEN, CHANNEL_NAME, FILES_USERNAMES, FILES_CURRENCY, FILES_ERROR, FILES_DUEL, FILES_WIN_USERS, FILES_LOSE_USERS, FILES_WIN_GOLD, FILES_LOSE_GOLD, GET_CURRENT_VIEWER_URL } from './constants';
import { INITIAL_CURRENCY, CURRENCY_NAME, INCREMENT_CURRENCY, GIVE_TIME, TOPFOUR, BET_WINDOW_TIMER, DUELING_WINDOW_TIMER, DUEL_COOLDOWN_TIMER } from './variables';
import { COMMAND_CURRENCY, DISPLAY_HELLO, DISPLAY_DICE, COMMAND_GAMBLE, COM, COMMAND_TOP, COMMAND_DUEL, COMMAND_ACCEPT, COMMAND_BET } from './commands';
import { setInterval } from 'timers';
import { loadavg } from 'os';
import { isString } from 'util';
var request = require("request")
const options = {
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: BOT_USERNAME,
		password: OAUTH_TOKEN
	},
	channels: [ CHANNEL_NAME ]
}

const client = new tmi.Client(options);

//event handlers
client.on('message', onMessageHandler);
//client.on('connected', onConnectedHandler);

client.connect();


setInterval(function () { giveCoins() }, parseInt(GIVE_TIME, 10));

function onMessageHandler(target, context, msg, self) {
  if (self) { return; } //bot ignore itself

  // takes users input and splits them into array
  const commandName = msg.split(" "[0]);
  console.log(commandName);

  // reading and assigning database of the text files to variables
  let twitchUsersDB = ReadFile(FILES_USERNAMES);
  let coinsDB = ReadFile(FILES_CURRENCY);
  let duelDB = ReadFile(FILES_DUEL);
  let winUsersDB = ReadFile(FILES_WIN_USERS);
  let loseUsersDB = ReadFile(FILES_LOSE_USERS);
  let winGoldDB = ReadFile(FILES_WIN_GOLD);
  let loseGoldDB = ReadFile(FILES_LOSE_GOLD);

  // takes the variables assigned with database and makes then an array
  let twitchUserArray = twitchUsersDB.split(',');
  let coinsArray = coinsDB.split(',');
  let duelArray = duelDB.split(',');
  let winUsersArray = winUsersDB.split(',');
  let loseUsersArray = loseUsersDB.split(',');
  let winGoldArray = winGoldDB.split(',');
  let loseGoldArray = loseGoldDB.split(',');

  //HELLO COMMAND=======================================================================================================================================================
  if (commandName[0] === DISPLAY_HELLO) {
    client.say(target, `Ayy what's up @${context.username}!`);
    console.log(`* Executed ${commandName} command`);
  }

  //DICE COMMAND========================================================================================================================================================
  if (commandName[0] === DISPLAY_DICE) {
    const num = rollDice();
    client.say(target, `You rolled a ${num}`);
    console.log(`* Executed ${commandName} command`);
  }

  let creation = true;
  //if the user is not found, creates the user in the text file=========================================================================================================
  twitchUserArray.forEach(function (user) {
    if (context.username === user) {
      creation = false;
    }
  });
  if (creation === true) {
    // appends a new user to the userdatabase
    fs.appendFileSync(FILES_USERNAMES, context.username + ',', "UTF-8", { 'flags': 'a+' });
    // appends a currency to userdatabase
    fs.appendFileSync(FILES_CURRENCY, INITIAL_CURRENCY + ',', 'UTF-8', { 'flags': 'a+' });
    console.log(target, `${context.username} has been assigned to my ${CURRENCY_NAME} system`);
  };
  //DISPLAY CURRENCY COMMAND=============================================================================================================================================
  if (commandName[0] === COMMAND_CURRENCY && commandName[1] !== 'share') {
    twitchUserArray.forEach(function (user, index) {
      if (context.username === user) {
        client.say(target, `@${context.username} has ${coinsArray[index]} ${CURRENCY_NAME}!`);
      }
    });
  }
  //SHARE CURRENCY=======================================================================================================================================================
  if (commandName[0] === COMMAND_CURRENCY && commandName[1] === 'share') {
    twitchUserArray.forEach(function (userReceiver, indexReceiver) {
      let name = commandName[2].toLowerCase();
      if (name.replace('@', '') === userReceiver) {
        if (Is_Int(commandName[3])) {
          twitchUserArray.forEach(function (userGiver, indexGiver) {
            if (context.username === userGiver) {
              let intCoinsGiver = parseInt(coinsArray[indexGiver], 10);
              let intCoinsReceiver = parseInt(coinsArray[indexReceiver], 10);
              let shareAmount = parseInt(commandName[3], 10);
              // subtract from giver, add to receiver, then covert back to string and assign to respective index
              intCoinsGiver -= shareAmount;
              intCoinsReceiver += shareAmount;
              coinsArray[indexGiver] = intCoinsGiver.toString();
              coinsArray[indexReceiver] = intCoinsReceiver.toString();
              client.say(target, `@${context.username}, you have given ${shareAmount} to ${commandName[2]}!`);
            }
          });
        }
      }
    });
    fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
      if (err) return err;
    });
  }

  //GAMBLE COMMAND=======================================================================================================================================================
  if (commandName[0] === COMMAND_GAMBLE) {
    if (Is_Int(commandName[1])) {
      twitchUserArray.forEach(function (user, index) {
        if (context.username === user) {
          let intCoins = parseInt(coinsArray[index], 10);
          let betAmount = parseInt(commandName[1], 10);
          if (intCoins >= betAmount) {
            intCoins -= betAmount;
            let oneOrZero = RandomOneOrZero();
            if (oneOrZero > 0) {
              betAmount *= 2;
              client.say(target, `@${context.username} won ${betAmount} ${CURRENCY_NAME} and now have ${intCoins + betAmount} ${CURRENCY_NAME}!`);
            } else {
              if (intCoins === 0) {
                client.say(target, `@${context.username}, you have lost all your ${CURRENCY_NAME}!`);
              } else {
                client.say(target, `@${context.username} lost ${betAmount} ${CURRENCY_NAME} and now have ${intCoins} ${CURRENCY_NAME}!`);
              }
              betAmount = 0;
            }
            intCoins += betAmount;
            coinsArray[index] = intCoins.toString();
          } else { client.say(target, `@${context.username}, you don't have enough ${CURRENCY_NAME}!`) }
        }
      });
      fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
        if (err) return err;
      });
    } else if (commandName[1] === 'all') {
      twitchUserArray.forEach(function (user, index) {
        if (context.username === user) {
          let betAmount = parseInt(coinsArray[index], 10);
          let oneOrZero = RandomOneOrZero();
          if (oneOrZero) {
            betAmount *= 2;
            client.say(target, `@${context.username}, you won ${betAmount} ${CURRENCY_NAME}!`);
          } else {
            client.say(target, `@${context.username}, you have lost all your ${CURRENCY_NAME}!`);
            betAmount = 0;
          }
          coinsArray[index] = betAmount.toString();
        }
      });
      fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
        if (err) return err;
      });
    } else { client.say(target, `@${context.username}, the command is '${GAMBLE} [number].'`); }
  }

  //DISPLAY COMMANDS=====================================================================================================================================================
  if (commandName[0] === COM) {
    client.say(target, `Hey @${context.username}, my commands are ${DISPLAY_HELLO}, ${DISPLAY_DICE}, ${COMMAND_CURRENCY}, ${COMMAND_CURRENCY} share [user] [amount], ${COMMAND_DUEL} [user] [amount], ${COMMAND_ACCEPT} (when challenged to a duel), ${COMMAND_BET} [win/lose] [amount],and ${COMMAND_GAMBLE} [amount]! :D`);
  }

  if (commandName[0] === '!modcom') {
    client.say(target, `Moderator commands are '${COMMAND_BET} on' and ${COMMAND_BET} result [win/lost]`);
  }

  if (commandName[0] === '!test') {
    console.log(myVariables.isBetOn);
  }

  //TOP LEADERBOARD COMMAND==============================================================================================================================================
  if (commandName[0] === COMMAND_TOP) {
    let coinsArrayTop = coinsArray;
    let twitchUserArrayTop = twitchUserArray;

    twitchUserArrayTop.map(function (s, i) {
      return {
        value1: s,
        value2: coinsArrayTop[i]
      }
    }).sort(function (a, b) {
      return parseInt(b.value2) - parseInt(a.value2);
    }).forEach(function (s, i) {
      twitchUserArrayTop[i] = s.value1;
      coinsArrayTop[i] = s.value2;
    });
    console.log(twitchUserArrayTop);

    client.say(target,
      `1. [${twitchUserArrayTop[0]}] : [${coinsArrayTop[0]}]
       2. [${twitchUserArrayTop[1]}] : [${coinsArrayTop[1]}]
       3. [${twitchUserArrayTop[2]}] : [${coinsArrayTop[2]}]
       4. [${twitchUserArrayTop[3]}] : [${coinsArrayTop[3]}]
       5. [${twitchUserArrayTop[4]}] : [${coinsArrayTop[4]}]`);
  };

  //DUEL COMMAND=========================================================================================================================================================
  if (commandName[0] === COMMAND_ACCEPT && duelArray[0] === "off" && duelArray[1] === "acceptOff") {
    twitchUserArray.forEach(function (user) {
      if (duelArray[2] === context.username) {
        duelArray[1] = "acceptOn";
        fs.writeFile(FILES_DUEL, duelArray, 'UTF-8', function (err) {
          if (err) return err;
        });
      }
    });
  }


  if (commandName[0] === COMMAND_DUEL && Is_Int(commandName[2]) && duelArray[0] === "off") {
    twitchUserArray.forEach(function (userChallenger, indexChallenger) {
      if (context.username === userChallenger) {
        let betAmount = parseInt(commandName[2]);
        if (coinsArray[indexChallenger] >= betAmount) {
          twitchUserArray.forEach(function (userChallenged, indexChallenged) {
            let name = commandName[1].toLowerCase();
            if (name.replace('@', '') === userChallenged.toLowerCase()) {
              if (coinsArray[indexChallenged] >= betAmount) {
                fs.appendFileSync(FILES_DUEL, 'acceptOff,' + userChallenged, 'UTF-8', { 'flags': 'a+' });
                client.say(target, `@${userChallenged}, you have been challenged by @${userChallenger}! '!accept' to duel.`);
                setTimeout(function () { Duel(indexChallenger, indexChallenged, betAmount, userChallenger, userChallenged) }, DUELING_WINDOW_TIMER);
              } else { client.say(target, `${context.user} does not have enough ${CURRENCY_NAME}.`) };
            }
          });
        } else { client.say(target, `You do not have enough ${CURRENCY_NAME}!`) };
      }
    });
  }

  //BET COMMANDS=========================================================================================================================================================
  // fyi: gold is used for bets
  if (commandName[0] === COMMAND_BET && myVariables.isBetOn !== 'on' && commandName[1] === 'on' && myVariables.inGame !== 'on') {
    GetCurrentModerators(function (currentModerators) {
      currentModerators.forEach(function (moderator) {
        if (moderator === context.username) {
          myVariables.isBetOn = 'on';
          console.log(myVariables.isBetOn);
          client.say(target, `Bets are on! You have one minute to place your bets, '!bet [win/lose] [amount].`);
          setTimeout(function () { TurnBetsOff() }, BET_WINDOW_TIMER);
        }
      });
    });
  }

  if (commandName[0] === COMMAND_BET && myVariables.isBetOn === 'on' && myVariables.inGame !== 'on') {
    let userEntered = hasUserEntered();
    console.log(userEntered);
    if (userEntered === false) {
      twitchUserArray.forEach(function (user, index) {
        if (context.username === user) {
          if (Is_Int(commandName[2])) {
            let betAmount = parseInt(commandName[2], 10);
            if (coinsArray[index] >= betAmount) {
              if (commandName[1] === 'win') {
                winUsersArray.push(user);
                fs.writeFile(FILES_WIN_USERS, winUsersArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                coinsArray[index] -= betAmount;
                winGoldArray.push(betAmount);
                fs.writeFile(FILES_WIN_GOLD, winGoldArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
              } else if (commandName[1] === 'lose') {
                loseUsersArray.push(user);
                fs.writeFile(FILES_LOSE_USERS, loseUsersArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                coinsArray[index] -= betAmount;
                loseGoldArray.push(betAmount);
                fs.writeFile(FILES_LOSE_GOLD, loseGoldArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
              } else { client.say(target, `@${context.username}, the command is !bet [win/lose] [amount]`); }
            } else { client.say(target, `@${context.username}, you don't have enough ${CURRENCY_NAME}`); }
          } else if (commandName[2] === 'all') {
            if (coinsArray[index] !== 0) {
              let betAmount = coinsArray[index];
              if (commandName[1] === 'win') {
                winUsersArray.push(user);
                fs.writeFile(FILES_WIN_USERS, winUsersArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                coinsArray[index] -= betAmount;
                winGoldArray.push(betAmount);
                fs.writeFile(FILES_WIN_GOLD, winGoldArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
              } else if (commandName[1] === 'lose') {
                loseUsersArray.push(user);
                fs.writeFile(FILES_LOSE_USERS, loseUsersArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                coinsArray[index] -= betAmount;
                loseGoldArray.push(betAmount);
                fs.writeFile(FILES_LOSE_GOLD, loseGoldArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
                fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
              } else { client.say(target, `@${context.username}, the command is !bet [win/lose] [amount]`); }
            } else { client.say(target, `@${context.username}, you have nothing to bet.`); }
          } else { client.say(target, `@${context.username}, the command is !bet [win/lose] [amount]`); }
        }
      });
    } else { client.say(target, `@${context.username}, you have already entered!`);}
  }

  if (commandName[0] === COMMAND_BET && commandName[1] === 'refund' && myVariables.inGame === 'on') {
    GetCurrentModerators(function (currentModerators) {
      currentModerators.forEach(function (moderator) {
        if (moderator === context.username) {
          winGoldArray.forEach(function (winUser, winIndex) {
            let tempGold = parseInt(winGoldArray[winIndex], 10);
            winGoldArray[winIndex] = tempGold.toString();
          });
          winUsersArray.forEach(function (winUser, winIndex) {
            twitchUserArray.forEach(function (twitchUser, twitchIndex) {
              if (twitchUser === winUser && winUser !== '') {
                let coins = parseInt(coinsArray[twitchIndex], 10);
                coins += parseInt(winGoldArray[winIndex], 10);
                coinsArray[twitchIndex] = coins.toString();
                fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
              }
            });
          });
          loseGoldArray.forEach(function (loseUser, loseIndex) {
            let tempGold = parseInt(loseGoldArray[loseIndex], 10);
            loseGoldArray[loseIndex] = tempGold.toString();
          });
          loseUsersArray.forEach(function (loseUser, loseIndex) {
            twitchUserArray.forEach(function (twitchUser, twitchIndex) {
              if (twitchUser === loseUser && loseUser !== '') {
                let coins = parseInt(coinsArray[twitchIndex], 10);
                coins += parseInt(loseGoldArray[loseIndex], 10);
                coinsArray[twitchIndex] = coins.toString();
                console.log(coinsArray);
                fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                  if (err) return err;
                });
              }
            });
          });
        }
      });
    });
    fs.writeFile(FILES_WIN_GOLD, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    fs.writeFile(FILES_LOSE_GOLD, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    fs.writeFile(FILES_WIN_USERS, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    fs.writeFile(FILES_LOSE_USERS, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    myVariables.inGame = 'off';
    client.say(target, `Bets are refuned!`);
  }

  if (commandName[0] === COMMAND_BET && commandName[1] === 'result' && myVariables.inGame === 'on') {
    GetCurrentModerators(function (currentModerators) {
      currentModerators.forEach(function (moderator) {
        if (moderator === context.username) {
          if (commandName[2] === 'win') {
            winGoldArray.forEach(function (winGold, winIndex) {
              let tempGold = parseInt(winGoldArray[winIndex], 10);
              tempGold *= 2;
              winGoldArray[winIndex] = tempGold.toString();
            });
            winUsersArray.forEach(function (winUser, winIndex) {
              twitchUserArray.forEach(function (twitchUser, twitchIndex) {
                if (twitchUser === winUser && winUser !== '') {
                  let coins = parseInt(coinsArray[twitchIndex], 10);
                  coins += parseInt(winGoldArray[winIndex], 10);
                  coinsArray[twitchIndex] = coins.toString();
                  fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                    if (err) return err;
                  });
                }
              });
            });
            client.say(target, `Bets on win recieved ${CURRENCY_NAME}!`);
          } else if (commandName[2] === 'lose') {
            loseGoldArray.forEach(function (loseGold, loseIndex) {
              let tempGold = parseInt(loseGoldArray[loseIndex], 10);
              tempGold *= 2;
              loseGoldArray[loseIndex] = tempGold.toString();
            });
            loseUsersArray.forEach(function (loseUser, loseIndex) {
              twitchUserArray.forEach(function (twitchUser, twitchIndex) {
                if (twitchUser === loseUser && loseUser !== '') {
                  let coins = parseInt(coinsArray[twitchIndex], 10);
                  coins += parseInt(loseGoldArray[loseIndex], 10);
                  coinsArray[twitchIndex] = coins.toString();
                  console.log(coinsArray);
                  fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
                    if (err) return err;
                  });
                }
              });
            });
            client.say(target, `Bets on lose recieved ${CURRENCY_NAME}.`);
          } else { client.say(target, `!bet result [win/lose]`)}
        }
      });
    });
    fs.writeFile(FILES_WIN_GOLD, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    fs.writeFile(FILES_LOSE_GOLD, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    fs.writeFile(FILES_WIN_USERS, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    fs.writeFile(FILES_LOSE_USERS, '', 'UTF-8', function (err) {
      if (err) return err;
    });
    myVariables.inGame = 'off';
  }

  function hasUserEntered() {
    let winUsersDB = ReadFile(FILES_WIN_USERS);
    let loseUsersDB = ReadFile(FILES_LOSE_USERS);
    let winUsersArray = winUsersDB.split(',');
    let loseUsersArray = loseUsersDB.split(',');
    let userCheck = false;
    winUsersArray.forEach(function (winUser) {
      if (context.username === winUser) {
        userCheck = true;
      }
    });
    loseUsersArray.forEach(function (loseUser) {
      if (context.username === loseUser) {
        userCheck = true;
      }
    });
    if (userCheck === true) {
      return true;
    } else {
      return false;
    }
  }
  
  function TurnBetsOff() {
    myVariables.isBetOn = 'off';
    myVariables.inGame = 'on';
    client.say(target, `Bets are off! `)
  }

  function TurnDuelOn() {
    fs.writeFile(FILES_DUEL, 'off,', 'UTF-8', function (err) {
      if (err) return err;
    });
    client.say(target, `Duel is back up! !duel to duel.`);
  }

  function Is_Int(value) {
    let x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
  }

  function CheckString(string) {
    return (string.prototype.toString.call(string) === '[object String]');
  }

  function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
  }
  //randomized dice
  function rollDice() {
    const sides = 6;
    return Math.floor(Math.random() * sides) + 1;
  }

  function RandomOneOrZero() {
    return (Math.random() > 0.6) ? 1 : 0;
  }

  function Multiplication(value) {
    if (Is_Int(value)) {
      return value;
    } else {
      fs.appendFileSync(ERROR_FILE, 'Multiplication Function Error', "UTF-8", { 'flags': 'a+' });
      return 0;
    }
  }

  function wait(ms) {
    let start = new Date().getTime();
    let end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }

  function Duel(indexChallenger, indexChallenged, betAmount, userChallenger, userChallenged) {
    console.log(duelArray[1]);
    let duelDB = ReadFile(FILES_DUEL);
    let duelCheck = duelDB.split(',');
    if (duelCheck[1] === "acceptOn") {
      let coinsChallenger = parseInt(coinsArray[indexChallenger], 10);
      let coinsChallenged = parseInt(coinsArray[indexChallenged], 10);
      coinsChallenger -= betAmount;
      coinsChallenged -= betAmount;
      betAmount *= 2;
      let oneOrZero = Math.random() > 0.5 ? 1 : 0;
      if (oneOrZero === 1) {
        if (betAmount < 5000) {
          client.say(target, `@${userChallenger} has easily killed @${userChallenged} in cold blood for a mere amount of ${betAmount / 2} ${CURRENCY_NAME}.`);
        }
        else
          client.say(target, `@${userChallenger} has easily slain @${userChallenged} for a whopping ${betAmount / 2} ${CURRENCY_NAME}!`);
        coinsChallenger += betAmount;
      }
      else {
        client.say(target, `@${userChallenged} has successful killed @${userChallenger} in a tough duel and recieved ${betAmount / 2} ${CURRENCY_NAME}`);
        coinsChallenged += betAmount;
      }
      coinsArray[indexChallenger] = coinsChallenger;
      coinsArray[indexChallenged] = coinsChallenged;
      fs.writeFile(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
        if (err)
          return err;
      });
    }
    else {
      client.say(target, `@${userChallenged}... you ran away with your tail between your legs...`);
      fs.writeFile(FILES_DUEL, 'on,', 'UTF-8', function (err) {
        if (err) return err;
      });
    } setTimeout(function () { TurnDuelOn() }, DUEL_COOLDOWN_TIMER);
  }
}


function giveCoins() {
  let twitchUsersDB = ReadFile(FILES_USERNAMES);
  let coinsDB = ReadFile(FILES_CURRENCY);
  let twitchUserArray = twitchUsersDB.split(',');
  let coinsArray = coinsDB.split(',');
  GetCurrentViewers(function (currentViewers) {
    currentViewers.forEach(function (currentUser) {
      twitchUserArray.forEach(function (userFile, index) {
        if (currentUser === userFile) {
          let coins = parseInt(coinsArray[index], 10);
          coins += parseInt(INCREMENT_CURRENCY, 10);
          coinsArray[index] = coins.toString();
        }
      });
    });
    console.log(coinsArray);
    fs.writeFileSync(FILES_CURRENCY, coinsArray, 'UTF-8', function (err) {
      if (err) return err;
    });
    console.log(`${INCREMENT_CURRENCY} is given to everyone!`);
  });
}

function ReadFile(text_file) {
  return fs.readFileSync(text_file).toString('UTF-8');
}

function GetCurrentViewers(callback) {
  let url = GET_CURRENT_VIEWER_URL;
  request({
    url: url,
    json: true
  }, function (err, response, currentViewersDB) {
    if (!err && response.statusCode === 200) {
      let currentViewers = currentViewersDB.chatters.viewers
        .concat(currentViewersDB.chatters.moderators)
        .concat(currentViewersDB.chatters.vips)
        .concat(currentViewersDB.chatters.broadcaster);
      callback(currentViewers);
    }
  });
}
  
function GetCurrentModerators(callback) {
  let url = GET_CURRENT_VIEWER_URL;
  request({
    url: url,
    json: true
  }, function (err, response, currentViewersDB) {
      if (!err && response.statusCode === 200) {
        let currentViewers = currentViewersDB.chatters.moderators
          .concat(currentViewersDB.chatters.broadcaster);
        callback(currentViewers);
      }
  });
}

var myVariables = {
  isBetOn: 'off',
  inGame: 'off',
};