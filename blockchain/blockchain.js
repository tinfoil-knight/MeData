const SHA256 = require('crypto-js/sha256')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const myKey = ec.keyFromPrivate('ee4442373a701cdf97dc60155a008b74377ea849e3386df18b04989c631238ec')
const myWalletAddress = myKey.getPublic('hex')
const otherKey = ec.keyFromPrivate('d1ec6c7bacbe853c57cf9659bae5d871dc6307e3623ef4a89662aa854438dc79')
const otherWalletAddress = otherKey.getPublic('hex')

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
    return new Block(Date.parse('2017-01-01', [], 0))
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1]
  }

  minePendingUpdates(miningRewardAddress) {
    const rewardTx = new Update(null, miningRewardAddress, 'todo' ,this.miningReward)
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

// TESTING
console.log("Initialisation of blockchain")
let EHRChain = new Blockmanager()



// Remember that you have to use the patient key and not the hospital key to sign things
//(Why though? Because only a patient should be allowed to add data)You changed it above.
// Make a update
console.log("Creating Update 1")
const up1 = new Update(myWalletAddress, otherWalletAddress, 'ghf022002be4ea13d279f75ec302b88a2ea467fc85748336', 10)
//signing of update will only be done by Hospital Key and notpatient key because thats idiotic
//too much distrust is what you have
//up1.signUpdate(otherKey)
//sending the update to an array waiting to be mined
EHRChain.addUpdate(up1)
// You'll only be dealing with one patient at a time(But there are multiple receptionists! So.....)
console.log("Creating Update 2")
// log store SQL attempt here
const up2 = new Update(otherWalletAddress, myWalletAddress, 'aa371b46d1dd5234ed46c3d9e9f2e60d44cdd2ee8656bf25', 5)
// no signing of updates will be done
//up2.signUpdate(myKey)
EHRChain.addUpdate(up2)
// log change value of SQL attempt to passed(or shift this to after mining updates)

// Mine block
console.log("Start mining")
EHRChain.minePendingUpdates(myWalletAddress)
console.log("End mining")
console.log(JSON.stringify(EHRChain.chain, null, 4))
module.exports = {
  Update: Update,
  Block: Block,
  Blockchain: Blockmanager
}
