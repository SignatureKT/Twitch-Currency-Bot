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

Once configured, you may start the script by running:
`yarn start`

## Configuration

#### OAUTH_TOKEN
