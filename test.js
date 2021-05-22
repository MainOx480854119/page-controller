const { ReactionController } = require("./index")
const discord = require("discord.js")
const client = new discord.Client({
	intents: discord.Intents.ALL,
	restTimeOffset: 0
	});
client
    .on("ready", () => {
		console.log("READY!")
	})
	.on('message', message => {
      if (message.content.startsWith('>pagination')){
        const controller = new ReactionController(client)
    
        controller
          .addReactionHandler('🤔', (reaction) => {
            reaction.message.channel.send('thinking')
              .catch(console.error)
          })
    
        controller.addPage(
			new discord.MessageEmbed({
				title:"Hello!"
			})
		)
    
        controller.sendTo(message.channel, message.author)
          .catch(console.error)
      }
    })
	.login(process.env.DISCORD_BOT_TOKEN)