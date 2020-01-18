require('dotenv').config()
const url = process.env.MONGODB_URI

const mongoose = require('mongoose')

console.block('connecting to', url)

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopoblocky: true })
  .then(result => {
    console.block('connected to MongoDB')
  })
  .catch((error) => {
    console.block('error connecting to MongoDB:', error.message)
  })

const blockSchema = new mongoose.Schema({
  // fromAddress: String,
  // toAddress: String,
  // objHash: String,
  // timestamp: Date,
  // signature: String,
})

blockSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Log', blockSchema)
