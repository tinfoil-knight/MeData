const SHA256 = require('crypto-js/sha256')
const mongoose = require('mongoose')
const express = require('express')
const app = express()

// For Cross-Origin Requests
const cors = require('cors')
app.use(cors())

// Parses POST Requests
const bodyParser = require('body-parser')
// Just use response.send() now instead of response.json()
app.use(bodyParser.json())

// DB: SQLite + MongoDB
const sqlite3 = require('sqlite3').verbose()
// Connecting to MongoDB
const Log = require('./models/log')


// Handles validation
const { check, validationResult } = require('express-validator');

// POST Request Handler for
// MongoDB Log Generation and Data Storage on SQL DB
app.post('/db', [
  // Validation for POST body
  check('body').isJSON(),
  check('record', 'fromAddress', 'toAddress').exists().notEmpty().isString()
], (req, res) => {

  // Finds the validation errors in request and wraps them in an object
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // req.body contains fromAddress, toAddress, record
  // the record key has the relevant EHR data as value
  const body = req.body

  Log
    // Finds the last block on the blockchain and places it's hash in the new block
    .findOne({}, {}, { sort: { 'created_at': -1 } })
    // Process Everything
    .then(latestBlock => {
      const log = {
        previousHash: latestBlock.blockHash,
        fromAddress: body.fromAddress,
        toAddress: body.toAddress,
        timestamp: Date.now(),
        // This is to preserve integrity of the EHR
        recordHash: SHA256(body.record).toString()
      }

      // Parameter that helps calculates different hashes for the same block
      let nonce = 0

      // Increasing this parameter leads to an increase in
      // time required to mine the block
      const difficulty = 4

      // Just a Random Value 
      log.blockHash = "testhash"

      console.log("Calculating Hash of the Block")
      // Keep changing the nonce until the hash of our block starts with enough zero's.
      while (log.blockHash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
        nonce++
        log.blockHash = SHA256(latestBlock.previousHash + log.fromAddress + log.toAddress + log.recordHash + log.timestamp + nonce).toString()
      }

      console.log("Hash Calculated")
      console.log("BLOCK MINED: " + log.blockHash)

      console.log("Initiating Record Addition on SQL DB")
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
        // Note : Prone to SQL injection errors
        const query = 'INSERT INTO records VALUES(' + Object.values(record).join(,) + ');'
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
          res.send(savedLog.toJSON())
          mongoose.connection.close()
        })
        .catch((err) => {
          console.log("An error has occured while saving the log in MongoDB. Retry?")
          // Create a handler for automatic retrial
          console.log(err)
        })

    })
})

// GET Request Handler for Data API
app.get('/api', [check('q').isString()], (req, res) => {

  // Finds the validation errors in request and wraps them in an object
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  console.log("Connecting to SQL Database...")

  let db = new sqlite3.Database('./db/ehr_main.db', (err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Connected to SQL database.')
  })

  console.log("query received as:")
  console.log(req.query.q)

  const selectedQuery = req.query.q ? req.query.q : '*'

  // Note : Prone to SQL injection errors
  const query = 'SELECT ' + selectedQuery + ' FROM ehr'

  console.log("query passed to db as:")
  console.log(query)
  console.log("Processing Queries")

  db.all(query, (err, rows) => {
    res.send(rows)
    console.log(rows)
    console.log(err)
  })

  console.log("Queries Processed")
  console.log("Closing SQL database")

  db.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('The SQL DB connection has been closed')
  })

})

// GET Request Handler for Blockchain
app.get('/verify', (req, res) => {
  Log.find({}).then(logs => {
    res.json(logs.map(log => log.toJSON()))
  })
})


// Handler for Invalid Endpoints
const unknownEndpoint = (req, res) => {
  console.log("request received on invalid endpoint")
  console.log(req)
  res.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
