exports.PageNotFoundError = class PageNotFoundError extends Error {
  constructor(pageNumber){
    super(`${pageNumber} page is not in the collection.`)
    this.name = 'PageNotFoundError'
  }
}

exports.CollectorError = class CollectorError extends Error {
  name = 'CollectorError'
}