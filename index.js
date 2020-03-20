const SHA256 = require('crypto-js/sha256')
const mongoose = require('mongoose')
const express = require('express')
const app = express()

// For Cross-Origin Requests
const cors = require('cors')
app.use(cors())

// Parses POST Requests
const bodyParser = require('body-parser')
app.use(bodyParser.json())

// DB: SQLite + MongoDB
const sqlite3 = require('sqlite3').verbose()
// Connecting to MongoDB
const Log = require('./models/log')


app.post('/db', (req, res) => {
  // req.body contains fromAddress, toAddress, record
  // the record key has the relevant medical data as value
  const body = req.body

  Log
    // Finds the last block on the blockchain and places it's hash in the new block
    .findOne({}, {}, { sort: { 'created_at': -1 } })
    // Process Everything
    .then(latestBlock => {
      const log = {
        previousHash: latestBlock.hash,
        fromAddress: body.fromAddress,
        toAddress: body.toAddress,
        timestamp: Date.now(),
        // This is to preserve integrity of the Medical Record
        recordHash: SHA256(body.record).toString()
      }

      // For calculating the hash of the block


      // Parameter that helps calculates different hashes for the same block
      let nonce = 0

      // Increasing this parameter leads to an increase in time required to mine the value
      const difficulty = 4

      // Just a Random Value
      log.hash = "testhash"

      console.log("Calculating Hash of the Block")
      // Keep changing the nonce until the hash of our block starts with enough zero's.
      while (log.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
        nonce++
        log.hash = SHA256(latestBlock.previousHash + log.fromAddress + log.toAddress + log.recordHash + log.timestamp + nonce).toString()
      }

      console.log("Hash Calculated")
      console.log("BLOCK MINED: " + log.hash)

      console.log("Initiating BLock Addition on DB")
      console.log("Connecting to SQL DB ...")

      // OPEN_READWRITE | OPEN_CREATE is Default
      let db = new sqlite3.Database('./main.db', (err) => {
        if (err) {
          console.log("Error in SQL DB connection")
          console.error(err.message)
        }
        console.log('Connected to SQL DB.')
      })

      console.log("Processing Queries")
      // Statements here execute sequentially
      db.serialize(() => {
        // UnSafe
        // Assuming name of table is records

        let query = 'INSERT INTO records VALUES(' + Object.values(record).join() + ');'
        db.run(query)
      })

      console.log("Queries Processed")

      console.log("Closing SQL database")

      db.close((err) => {
        if (err) {
          console.error(err.message)
        }
        console.log('The SQL DB connection has been closed')
      })

      console.log(log)

      // Initiates a new log in MongoDB with the specified schema in models
      const mongoLog = new Log(log)

      // Saves the log in the remote MongoDB
      mongoLog.save()
        .then(savedLog => {
          res.json(savedLog.toJSON())
          mongoose.connection.close()
        })
        .catch((err) => {
          // Send all the data that was received back as a JSON object so it can be reviewed and resent
          console.log("An error has occured while saving the log in MongoDB. Retry?")
          console.log(err)
        })

    })
})

app.get('/db', (req, res) => {

  console.log("Connecting to SQL Database...")

  let db = new sqlite3.Database('./main.db', (err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Connected to SQL database.')
  })

  console.log("Processing Queries")

  // Requests as /db?q=... get processed
  // Handle Query here
  let query = req.body.q

  db.run(query)

  console.log("Queries Processed")
  console.log("Closing SQL database")

  db.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('The SQL DB connection has been closed')
  })

})

// app.get('/verify', (req, res) => {
//   Log.find({}).then(logs => {
//     res.json(logs.map(log => log.toJSON()))
//   })
// })


// Handler for Invalid Endpoints
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
