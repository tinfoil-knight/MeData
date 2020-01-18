const SHA256 = require('crypto-js/sha256')

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

    // const getPreviousHash = () => {
    //   // return Log.find().limit(1).({$natural:-1}).then(log => {
    //   // response.json(log.toJSON()).hash})
    //   return "ManualHash"
    // }
console.log("Initiating Log")
    const log = {
      previousHash: "aghhjdbbkskbdkkksksbdb",
      fromAddress: body.fromAddress,
      toAddress: body.toAddress,
      objHash: objHash,
      timestamp: body.timestamp
    }
    console.log("Running calculateHash")

    const calculateHash = (val) => {
      return SHA256(log.previousHash + log.fromAddress + log.toAddress + log.objHash + log.timestamp+ val).toString()
    }
    console.log("calculateHash")
    let nonce = 0

    const difficulty = 4
    log.hash = "abcdef"

    while (log.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      nonce++
      log.hash = calculateHash(nonce)
    }
    console.log("BLOCK MINED: " + log.hash)


    console.log("Connecting to SQL Database...")
    let db = new sqlite3.Database('./db/ehr_main.db', (err) => {
      if (err) {
        console.error(err.message)
      }
      console.log('Connected to SQL database.')
    })

    let query = body.requestObject

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
    })


})

app.get('/api/logs', (request, response) => {
  Log.find({}).then(logs => {
    response.json(logs.map(log => log.toJSON()))
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

  // REPLACE THIS CODE
  let query = request.body.requestObj
  db.run(query)
  // CODE BLOCK END
  console.log("Queries Processed")

  console.log("Closing SQL database")
  db.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Close the database connection.')
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
