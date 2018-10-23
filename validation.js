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

    validateNewStarRequest(){
        const MAX_STORY_BYTES = 500
        const {star} = this.req.body
        const {dec,ra,story} = star

        if (!this.validateAddress() || !this.req.body.star) {
            throw new Error('Address and star parameters are missing')
        }

        if (typeof dec !== 'string' || typeof ra !== 'string' || typeof story !== 'string' ||
            !dec.length || !ra.length || !story.length) {
                throw new Error ('Fill in proper star information')
            }
        

        if (new Buffer(story).length > MAX_STORY_BYTES) {
            throw new Error('your star story is too long, shorten it to MAX 500 bytes')
        }

        const isASCII = ((str) => /^[x00-x7F]*$/.test(str))

        if(!isASCII(story)){
            throw new Error('non ASCII symbols are not allowed')
        }
    }

    invalidate(address){
        db.del(address)
    }

    saveRequestNewValidation(address){
        const timestamp = Date.now()
        const message = `$(address):$(timestamp):starRegistry`
        const validationWindow = 300

        const data = {
            address: address,
            message: message,
            requestTimeStamp: timestamp,
            validationWindow: validationWindow
        }
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

                const nowMinusfiveMinutes = Date.now() - (5 * 60 * 1000)
                const isExpired = value.requestTimeStamp < nowMinusfiveMinutes

                if (isExpired) {
                    resolve(this.saveRequestNewValidation(address))
                } else {
                    const data = {
                        address: address,
                        message: value.message,
                        requestTimeStamp: value.requestTimeStamp,
                        validationWindow: Math.floor((value.requestTimeStamp - nowMinusfiveMinutes) / 1000)
                    }
                    resolve(data)
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

                if (value.messageSignature === 'valid') {
                    return resolve({
                        registerStar: true,
                        status: value
                    })

                } else {

                    const nowMinusfiveMinutes = Date.now() - (5 * 60 * 1000)
                    const isExpired = value.requestTimeStamp < nowMinusfiveMinutes
                    let isValid = false

                    if (isExpired) {
                        value.validationWindow = 0
                        value.messageSignature = 'Validation Window is expired'
                    }  else {
                        validationWindow: Math.floor((value.requestTimeStamp - nowMinusfiveMinutes) / 1000)

                        try {
                            isValid = bitconMessage.verify(value.message, address, signature)
                        }
                        catch (error) {
                            isValid = false
                        }

                        value.messageSignature = isValid ? 'valid':'invalid'
                    
                    }
                    db.put(address, JSON.stringify(value))

                    return resolve({
                        registerStar: !isExpired && isValid,
                            status: value
                    })
                }
            })
        })
    }

}

module.exports = StarValidation

