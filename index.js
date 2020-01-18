const SHA256 = require('crypto-js/sha256')

const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const sqlite3 = require('sqlite3').verbose()

let imports = require('./blockchain/blockchain')
const Update = imports.Update
const Block = imports.Block
const Blockmanager = imports.Blockmanager

const Log = require('./models/log')

app.post('/all', (request, response) => {
    const body = request.body

    const objHash = SHA256(body.requestObj).toString()

    console.log("Log is created")
    const log = new Log({
      previousHash: Log.find({}),
      fromAddress: body.fromAddress,
      toAddress: body.toAddress,
      objHash: body.objHash,
      token: body.token,
      timestamp: body.timestamp,
      
    })




    //
    // let EHRChain = new Blockmanager()
    // const update = new Update(body.fromAddress, body.toAddress, objHash, body.token)
    // EHRChain.addUpdate()
    // // Mine block
    // console.log("Start mining")
    // EHRChain.minePendingUpdates(body.fromAddress)
    // console.log("End mining")




    console.log("Connecting to SQL Database...")
    let db = new sqlite3.Database('./db/ehr_main.db', (err) => {
      if (err) {
        console.error(err.message)
      }
      console.log('Connected to SQL database.')
    })

    // let query = 'CREATE TABLE greetings(message text)'


    console.log("Processing Queries")
    // REPLACE THIS CODE
    db.run(query)
      .run(`INSERT INTO greetings(message)
            VALUES('Hi'),
                  ('Hello'),
                  ('Welcome')`)
      .each(`SELECT message FROM greetings`, (err, row) => {
        if (err){
          throw err;
        }
        console.log(row.message);
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

    // Saving the log
    log.save().then(savedLog => {
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
  let query = request.body.
  db.run(query)
    .run(`INSERT INTO greetings(message)
          VALUES('Hi'),
                ('Hello'),
                ('Welcome')`)
    .each(`SELECT message FROM greetings`, (err, row) => {
      if (err){
        throw err;
      }
      console.log(row.message);
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

})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
