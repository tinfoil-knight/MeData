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
