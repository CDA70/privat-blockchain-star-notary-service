const level = require('level');
const starDB = './stardata';
const db = level(starDB);
const bitconMessage = require('bitcoinjs-message')
const validationWindow = 300

class StarValidation {
    constructor (req) {
      this.req = req
    }
    
    async getPendingAddressRequest(address){
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (value === undefined) {
                    // start - Code added after review
                    const timestamp = Date.now()
                    const message = `${address}:${timestamp}:starRegistry`

                    const data = {
                        address: address,
                        message: message,
                        requestTimeStamp: timestamp,
                        validationWindow: validationWindow
                    }
                    db.put(data.address, JSON.stringify(data));
                    return resolve(data);
                    // end - Code added after review

                } else if (error) {
                    return reject(error)
                }

                value = JSON.parse(value)

                const elapsedMinusFiveMinutes = Date.now() - (validationWindow * 1000) //5 * 60 * 1000)
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
                    const timestamp = Date.now()
                    const message = `${address}:${timestamp}:starRegistry`
                    
                    const data = {
                        address: address,
                        message: message,
                        requestTimeStamp: timestamp,
                        validationWindow: validationWindow
                    }
                    console.log(data)
                    db.put(data.address, JSON.stringify(data))
            
                }
            })
        })
    }


    async isMessageSignatureValid(address, signature){
        return new Promise((resolve, reject) => {
            db.get(address, (error, value) => {
                if (value === undefined) {
                    return reject(new Error('address not found'))

                } else if (error) {
                    return reject(error)
                }

                value = JSON.parse(value)
            
                const isValid = bitconMessage.verify(value.message, address, signature)
                if (isValid) {
                    const elapsedMinusFiveMinutes = Date.now() - ( validationWindow * 1000) // 5 * 60 * 1000)
                    const isExpired = value.requestTimeStamp < elapsedMinusFiveMinutes

                    if (isExpired) {
                        value.validationWindow = 0
                        value.messageSignature = 'Validation Window is expired'
                    } else {
                        // start - Code added after review
                        value.validationWindow = Math.floor((value.requestTimeStamp - elapsedMinusFiveMinutes) / 1000);
                        // end - Code added after review
                        db.put(address, JSON.stringify(value))

                        return resolve({
                        registerStar: !isExpired && isValid,
                        status: value
                        })   
                    }
                }
                // start - Code added after review
                else {
                    return reject({
                        status: 400,
                        error: "Signature is invalid!"
                    });
                }
                // end - Code added after review
            })
        })
    }

}

module.exports = StarValidation

