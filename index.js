const {
  Collection,
  ReactionCollector,
} = require('discord.js')
const util = require('util')
const { CollectorError, PageNotFoundError } = require('./error')

exports.ReactionController = class ReactionController {
  constructor(client,options){
    this.client             = client
	this.options            = options
	this.pages              = new Collection()
	this.handlers           = new Collection()
	this._currentPageNumber = 0
	this._collector         = ReactionCollector || null
	this._initReactionHandlers()
  }

  get currentPage() {
    return this._currentPageNumbe
  }

  async nextPage(){
    const pageNumber = this._currentPageNumber + 1
    const page = await this._resolvePage(pageNumber)

    if(!this._collector) throw new CollectorError('Use the "sendTo" method, please register the Collector.')
    await this._collector.message.edit(page)
    this._currentPageNumber = pageNumber
	return new Promise(async function(resolve){
    resolve(pageNumber)
	  })
  }

  async prevPage(){
    const pageNumber = this._currentPageNumber - 1
    const page = await this._resolvePage(pageNumber)

    if(!this._collector) throw new CollectorError('Use the "sendTo" method, please register the Collector.')
    await this._collector.message.edit(page)
    this._currentPageNumber = pageNumber
	return new Promise(async function(resolve){
    resolve(pageNumber)
	  })
  }

  async send(channel,options){
    const firstPageNumber = this.pages.firstKey()

    if (typeof firstPageNumber === "undefined") throw new Error('At least one page must be added using the "addPage" method.')

    const collectorFilter = (reaction, user) => {
      if(!this.handlers.has(reaction.emoji.identifier))return false
      if(Array.isArray(options.sender))return options.sender
	    .map(sender => sender.id)
        .includes(user.id)
      else if(sender)return user.id === sender.id
      else return true
    }

    const onCollect = (reaction, user) => {
      const handler = this.handlers.get(reaction.emoji.identifier)

      if (handler) {
        reaction.users.remove(user)
          .catch(console.error)
        return handler(reaction, user)
      }

      throw new Error('Reaction Handler not found.')
    }
    
    if(this._collector){
    var onEnd = () => this._collector.message.reactions.removeAll().catch(console.error);
    } else {
    var onEnd = () => undefined
    }
	  
    const collector = await this._resolvePage(firstPageNumber)
      .then(embed => channel.send(embed))
      .then(message => message.createReactionCollector(collectorFilter, {
		  max:this.options?.max,
		  maxEmojis:this.options?.maxEmojis,
		  maxUsers:this.options?.maxUsers
	  }))
      .then(collector => collector.on('collect', onCollect))
      .then(collector => collector.on('end', onEnd))
    this._collector = collector

    return Promise.all([...this.handlers.keys()].map(emoji => collector.message.react(emoji)))
  }

  addReactionHandler(emoji,handler){
    const emojiIdentifier = this.client.emojis.resolveIdentifier(emoji)
    if(!emojiIdentifier) throw new Error('It couldn\'t be an emoji identifier.')
    this.handlers.set(emojiIdentifier, handler)
    return this
  }

  addPage(page){
    this.pages.set(this.pages.size, page)
    return this
  }

  addPages(pages){
    pages.forEach(page => this.pages.set(this.pages.size, page))
    return this
  }

  _resolvePage(pageNumber){
    const page = this.pages.get(pageNumber)

	return new Promise(async function(resolve){
    if(!page) throw new PageNotFoundError(pageNumber)
    if(typeof page === "function"){
      const embed = await page()
      this.pages.set(pageNumber, page)
      resolve(embed)
    }
    resolve(page)
	  })
  }

  _initReactionHandlers(){
    this
      .addReactionHandler(this.options?.prevEmoji ?? '◀️', (reaction, user) => {
        this.prevPage()
          .then(() => reaction.users.remove(user))
          .catch(reason => {
            if(reason instanceof PageNotFoundError) reaction.users.remove(user).catch(console.error)
            else console.error(reason)
          })
      })
      .addReactionHandler(this.options?.nextEmoji ?? '▶️', (reaction, user) => {
        this.nextPage()
          .then(() => reaction.users.remove(user))
          .catch(reason => {
            if(reason instanceof PageNotFoundError) reaction.users.remove(user).catch(console.error)
            else console.error(reason)
          })
      })
	  if(this.options?.stopButton!==false){
		  this
		  .addReactionHandler(this.options?.stopEmoji ?? '⏹️', (reaction) => {
			  this._collector?.stop()
			  this._collector = null
			  
			  reaction.message.reactions.removeAll()
          .catch(console.error)
		  })
	  }
  }
}
