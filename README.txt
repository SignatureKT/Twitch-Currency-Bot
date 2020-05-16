Variables such as currency's name and times of current command actions are commands.js and variables.js.

BEFORE you run this program, go into constants.js and edit channel name, oauth_token, bot_username, and the channel name of GET_CURRENT_VIEWER_URL.

To run this program, 'yarn start', build it into an executable using nexe, or whichever program you prefer.

For viewers to use currency functions, typing in chat will automatically assign them. 

The commands available are:
NEUTRAL COMMANDS:
!hello - says hello to the user.
!dice - randomized number of 6.

THE FOLLOWING COMMANDS USES CURRENCY:

CURRENCY COMMANDS:
!currency - displays the amount of currency the user has.
!currency share [user] [amount] - removes currency from the giver, and adds currency to the receiver.

GAMBLE COMMANDS:
!gamble [amount/all] - removes currency from user and a randomizer determines if the user recieves double or nothing.

DUEL COMMANDS:
!duel [user] [amount] - request the challenged for a duel
!accept - accepts the challenger's request for a duel
NOTE: The amount that is bet is taken from both of the users. A randomizer determines whether the challenger or the challenged wins the duel. The winner will recieve the bet that both users wager.

BET COMMANDS:
[MODERATORS and BROADCASTER COMMAND: !bet on - turns on a window timer for users to enter a bet whether win or lose]
!bet [win/lose] [amount/all] - bet whether 'win' or 'lose', and the amount of currency to wager or all
[MODERATORS and BROADCASTER COMMAND: !bet result [win/lose] - determines whether 'win' gains double the amount bet, or 'lose' gains double the amount bet.
