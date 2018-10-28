const level = require('level');
const starDB = './stardata';
const db = level(starDB);
const bitconMessage = require('bitcoinjs-message')

class StarValidation {
    constructor (req) {
      this.req = req
    }

    validateAddress(){
      if (!this.req.body.address) {
          throw new Error('address cannot be empty!')
      }  
    }

    validateSignature(){
        if (!this.req.body.signature) {
            throw new Error('signature cannot be empty!')
        }  
    }

    

    invalidate(address){
        db.del(address)
    }

    saveRequestNewStarValidation(address){
        const timestamp = Date.now()
        const message = `${address}:${timestamp}:starRegistry`
        const validationWindow = 300

        const data = {
            address: address,
            message: message,
            requestTimeStamp: timestamp,
            validationWindow: validationWindow
        }
        console.log(data)
        db.put(data.address, JSON.stringify(data))
    }


    async getPendingAddressRequest(address){
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (value === undefined) {
                    return reject(new Error('address not found'))

                } else if (error) {
                    return reject(error)
                }

                value = JSON.parse(value)

                const elapsedMinusFiveMinutes = Date.now() - (5 * 60 * 1000)
                const isExpired = value.requestTimeStamp < elapsedMinusFiveMinutes
                if (!isExpired){
                    const data = {
                        address: address,
                        message: value.message,
                        requestTimeStamp: value.requestTimeStamp,
                        validationWindow: Math.floor((value.requestTimeStamp - elapsedMinusFiveMinutes) / 1000)
                    }
                    resolve(data) 
                } else {
                    resolve(this.saveRequestNewStarValidation(address))
                }
            })
        })
    }
   
    async isMessageSignatureValid(address, signature){
        console.log('start validate message and signature validity, Address: ' + address + ' - signature: ' + signature)
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (value === undefined) {
                    return reject(new Error('address not found'))

                } else if (error) {
                    return reject(error)
                }

                value = JSON.parse(value)
            
                const isValid = bitconMessage.verify(value.message, address, signature)
                console.log('is signature valid by bitcoin: ' + isValid)
            
                if (isValid) {
                    const elapsedMinusFiveMinutes = Date.now() - (5 * 60 * 1000)
                    const isExpired = value.requestTimeStamp < elapsedMinusFiveMinutes

                    if (isExpired) {
                        console.log('val wind is expired')
                        value.validationWindow = 0
                        value.messageSignature = 'Validation Window is expired'
                    } else {
                        db.put(address, JSON.stringify(value))

                        return resolve({
                        registerStar: !isExpired && isValid,
                        status: value
                        })   
                    }
                }
            })
        })
    }

}

module.exports = StarValidation

