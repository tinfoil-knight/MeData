const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const Log = require('./models/log')

app.get('/logs', (request, response) => {
  Log.find({}).then(logs => {
    response.json(logs.map(log => log.toJSON()))
  })
})

app.post('/logs', (request, response) => {
  const body = request.body

  const log = new Log({
    fromAddress: body.fromAddress,
    toAddress: body.toAddress,
    objHash: body.objHash,
    token: body.token,
    timestamp: body.timestamp,
    signature: body.signature
  })

  log.save().then(savedLog => {
    response.json(savedLog.toJSON())
  })
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
