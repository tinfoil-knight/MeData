require('dotenv').config()
const url = process.env.MONGODB_URI

const mongoose = require('mongoose')

console.log('connecting to', url)

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then( () => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

// The hash of record object has been stored insted of the original Record
// to maintain the efficiency of the Blockchain
const logSchema = new mongoose.Schema({
  previousHash: String,
  fromAddress: String,
  toAddress: String,
  objHash: String,
  timestamp: Date,
  hash: String,
})

logSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Log', logSchema)
