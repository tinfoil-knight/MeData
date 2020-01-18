const SHA256 = require('crypto-js/sha256')

class Update {
  constructor(fromAddress, toAddress, objHash, token) {
    this.fromAddress = fromAddress
    this.toAddress = toAddress
    this.objHash = objHash
    this.token = token
    this.timestamp = Date.now()
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.objHash + this.token + this.timestamp).toString()
  }

  signUpdate(signingKey) {
    if (signingKey.getPublic('hex') !== this.toAddress) {
      throw new Error('You cannot sign update for other patients')
    }

    const hashTx = this.calculateHash()
    const sig = signingKey.sign(hashTx, 'base64')
    this.signature = sig.toDER('hex')
  }
}


class Block {
  constructor(timestamp, updates, previousHash = '') {
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.updates = updates
    this.nonce = 0
    this.hash = this.calculateHash()
  }

  calculateHash() {
    return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.updates) + this.nonce).toString()
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++
      this.hash = this.calculateHash()
    }
    console.log("BLOCK MINED: " + this.hash)
  }
}


class Blockmanager {
  constructor() {
    // DB
    // do this if no blocks in chain else copy the entire chain and then run
    this.chain = [this.createGenesisBlock()]
    this.difficulty = 4

    this.pendingUpdates = []
    this.miningReward = 100
  }

  createGenesisBlock() {
    return // TODO: Enter the manual genesis block here
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1]
  }

  minePendingUpdates(miningRewardAddress) {
    const rewardTx = new Update(null, miningRewardAddress, this.miningReward)
    this.pendingUpdates.push(rewardTx)

    const block = new Block(Date.now(), this.pendingUpdates, this.getLatestBlock().hash)
    block.mineBlock(this.difficulty)

    // DB
    this.chain.push(block)

    this.pendingUpdates = []
  }

  addUpdate(update) {
    if (!update.fromAddress || !update.toAddress) {
      throw new Error('Update must include from and to address')
    }

    this.pendingUpdates.push(update)
  }
}
