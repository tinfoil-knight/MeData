const SHA256 = require('crypto-js/sha256')
const mongoose = require('mongoose')
const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const sqlite3 = require('sqlite3').verbose()
const Log = require('./models/log')


// DATA CREATE
app.post('/all', (request, response) => {
    const body = request.body

    const objHash = SHA256(body.requestObj).toString()
    Log.findOne({}, {}, { sort: { 'created_at' : -1 } }).then(result => {
      const log = {
        previousHash: result.hash,
        fromAddress: body.fromAddress,
        toAddress: body.toAddress,
        objHash: objHash,
        timestamp: body.timestamp
      }

      const calculateHash = (val) => {
        return SHA256(result.previousHash + log.fromAddress + log.toAddress + log.objHash + log.timestamp+ val).toString()
      }

      let nonce = 0

      const difficulty = 4
      log.hash = "testhash"
      console.log("Calculating Hash")
      while (log.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
        nonce++
        log.hash = calculateHash(nonce)
      }
      console.log("Hash Calculated")
      console.log("BLOCK MINED: " + log.hash)

      console.log("Connecting to SQL Database...")
      let db = new sqlite3.Database('./db/ehr_main.db', (err) => {
        if (err) {
          console.error(err.message)
        }
        console.log('Connected to SQL database.')
      })

      let query = body.requestObj

      console.log("Processing Queries")
      // REPLACE THIS CODE
      db.serialize(() => {
        // Queries scheduled here will be serialized.
        db.run(query)
      })
      // CODE BLOCK END
      console.log("Queries Processed")

      console.log("Closing SQL database")
      db.close((err) => {
        if (err) {
          console.error(err.message)
        }
        console.log('Close the database connection.')
      })

      console.log(log)

      const mongoLog = new Log(log)

      // Saving the log
      mongoLog.save().then(savedLog => {
        response.json(savedLog.toJSON())
        mongoose.connection.close()
      })
    })
})

app.get('/db', (request, response) => {
  console.log("Connecting to SQL Database...")
  let db = new sqlite3.Database('./db/ehr_main.db', (err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Connected to SQL database.')
  })

  console.log("Processing Queries")


  let query = request.body.requestObj
  db.run(query)
  console.log("Queries Processed")

  console.log("Closing SQL database")
  db.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Close the database connection.')
  })

})

app.get('/api/chain', (request, response) => {
  Log.find({}).then(logs => {
    response.json(logs.map(log => log.toJSON()))
  })
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
