# Twitch-Currency-Bot
Twitch-Currency-Bot is a currency bot to suit your gambling needs. 

## Using Twitch-Currency-Bot
### Prerequisites
⋅ Node.js  
⋅ npm  
⋅ yarn  
⋅ [Twitch Developer Account](https://dev.twitch.tv/)  
⋅ [OAUTH_TOKEN](#oauth_token)

## Installation
Install the required packages with the following command:  
`$ npm install csv-parser csv-writer esm ini tmi.js`  

Before you run the application, you must configure the bot.js in src/constants/

**bot.js**
```
export const CHANNEL_NAME = '[Channel Name]'; // the channel the bot goes  
export const OAUTH_TOKEN = '[Authentication Token]'; // key of your bot  
export const BOT_USERNAME = '[Bot Username]'; // name of bot  
export const GET_CURRENT_VIEWER_URL = 'https://tmi.twitch.tv/group/user/[channel]/chatters'; // To get the viewers of the channel
```  
`CHANNEL_NAME` is where your bot will be directed to  
`OAUTH_TOKEN` is your bot's token  
`BOT_USERNAME` is your bot application's name  
`GET_CURRENT_VIEWER_URL` retrieve list of viewers in the channel  

I recommend you should edit the commands and variables in [constants files](#configuration). Once configured, you may start the script by running  
`yarn start`

## Configuration
You can edit the bot's command by editing command.js in src/constants

**command.js**
```
export const COMMAND_DICE = '!dice'; // roll a six sided dice
export const COMMAND_LOOKUP = '!look'; // (NOT AVAILABLE) look up another user
export const COMMAND_HASH = '!hash'; // (NOT AVAILABLE/ FOR DEVOLOPMENT PURPOSES)
export const COMMAND_CURRENCY = '!currency' // look up the user's currency
export const COMMAND_GAMBLE = '!gamble'; // enter the ammount 
export const COMMAND_TOP = '!top'; // leaderboard of the top 5 currency
export const COMMAND_BET = '!bet'; // bet on win or lose
export const COMMAND_DUEL = '!duel'; // challenge another user to a duel
export const COMMAND_ACCEPT = '!accept'; // accepts a challenged duel

export const EXTENSION_SHARE = 'share' // used in conjunction with COMMAND_CURRENCY to share to a user
```

You can also edit variables.js in src/constants

**variable.js**
```
export const CURRENCY_NAME = 'currency';
export const AT_SYMBOL = '@';
export const CURRENCY_INCREMENT = 100;
export const USER_DATABASE = 'src/database/users.csv';
export const GIVE_TIME = 4 * 60 * 1000; // minute-second-millisecond
export const BET_WINDOW_TIMER = 2 * 60 * 1000; //minute-second-millisecond
export const DUELING_WINDOW_TIMER = 1 * 60 * 1000;
export const DUEL_COOLDOWN_TIMER = 1 * 60 * 1000; // timer for duel cooldown
```

#### OAUTH_TOKEN
You must have a token to be able to use this script. To request a token, we will use the [OAuth implicit code flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-implicit-code-flow) from the twitch dev webiste.

```
https://id.twitch.tv/oauth2/authorize
    ?client_id=<your client ID>
    &redirect_uri=<your registered redirect URI>
    &response_type=<type>
    &scope=<space-separated list of scopes>
```
`<your client ID>`
