const express = require('express')
const app = express()
const routers = require('./router').default
const parser = require('body-parser')
const server = "http://www.expressjs.com"
const port = 8000

app.use(parser.json())
app.use(parser.urlencoded( {extended: true} ));
app.listen(port, () => console.log(`Private Blockchain API app build on ${server} is listening on port ${port}!`))

// call end points
//app.post('/block', routers.addBlock)

const Blockchain = require('./simpleChain')
const blockchain = new Blockchain()
const Block = require('./block')
const block = new Block()

const StarValidation = require('./validation')

const validationWindow = 300

const decodeBlock = block => {
    block.body.star.storyDecoded = Buffer.from(block.body.star.story, 'base64').toString('ascii');
    return block;
}


// valdation rules
// address is required
addressIsValid = async (req, res, next) => {
    try {
        const validation = new StarValidation(req)
        validation.validateAddress()
        next()
    } catch (error) {
        res.status(400).json({
            status: 400,
            message: error.message
        })
    }
}

// signature is required
signatureIsValid = async (req, res, next) => {
    try {
        const validation = new StarValidation(req)
        validation.validateSignature()
        next()
    } catch (error) {
        res.status(400).json({
            status: 400,
            message: error.message
        })
    }
}

starRequestIsValid = async (req, res, next) => {
    try {
        const validation = new StarValidation(req)
        validation.validateNewStarRequest()
        next()
    } catch (error) {
        res.status(400).json({
            status: 400,
            message: error.message
        })
    }
}


app.post('/requestValidation', [addressIsValid], async(req,res) => {
    const validation = new StarValidation(req)
    const address = req.body.address
   try {
      data = await validation.getPendingAddressRequest(address)
   }   
   catch (error) {
      data = await validation.saveRequestNewValidation(address)
   }
   
   res.json(data)
   }
) 

app.post('/message-signature/validate', [addressIsValid, signatureIsValid], async(req, res) => {
    const valdation = new StarValidation(req)
    try{
        const {address, signature} = req.body
        const response = await validation.isMessageSignatureValid(addres, signature)

        if (response.registerStar){
            res.json(response)
        } else {
            res.status(401).json(response)
            
        }
    } catch (error){
         res.status(404).json({
             status: 404,
            message: error.message
         })
    }
})

/*
app.post('/block', async (req, res) => {
    try{
        const MAX_BYTES_ALLOWED = 500
        const {star} = this.req.body
        const {dec,ra,story} = star
        const body = {address, star} = req.body
        //const story = star.story

        body.star = {
            dec: star.dec,
            ra: star.ra,
            story: new Buffer(story).toString('hex'),
            mag: star.mag,
            con: star.con
        }
        
        if (!req.body.address) {
            throw new Error('address cannot be empty!')
        } 
    
        if (!req.body.star) {
            throw new Error('star parameters cannot be empty!')
        } 
    
        if (typeof dec   !== 'string' || 
            typeof ra    !== 'string' || 
            typeof story !== 'string' ||
            !dec.length               || 
            !ra.length                || 
            !story.length) {
            throw new Error ('Fill in proper star information')
        }
        
        if (new Buffer(story).length > MAX_BYTES_ALLOWED) {
            throw new Error('your star story is too long, shorten it to MAX 500 bytes')
        }
    
        // npm install is-ascii save
        if (!isAscii(story)){
            throw new Error('Only ASCII charaters are allowed!')
        }
        
    } catch (error){
        res.status(401).json({
            status:401,
            message: error.message
        })
    }
    
    await blockchain.addBlock(new Block(body))
    const height = await blockchain.getBlockHeight()
    const response = await blockchain.getBlock(height)

    validation.invalidate(address)

    res.status(201).send(response) 
})
*/

app.post('/block', [starRequestIsValid], async (req, res) => {
    const validation = new StarValidation(req)

    try{
        const isValid = await StarValidation.isValid()

        if (!isValid) {
            throw new Error('Signature is not valid!')
        }
        
        }
    catch (error){
        res.status(401).json({
            status: 401,
            message: error.message
        })
        return
    }
    
    const body = {address, star} = req.body
    const story = star.story

    body.star = {
        dec: star.dec,
        ra: star.ra,
        story: new Buffer(story).toString('hex'),
        mag: star.mag,
        con: star.con
    }
    
    await blockchain.addBlock(new Block(body))
    const height = await blockchain.getBlockHeight()
    const response = await blockchain.getBlock(height)

    validation.invalidate(address)

    res.status(201).send(response) 
    
})


// GET endpoint
app.get('/block/:blockHeight', async( req, res ) => {
    try {
        const response = await blockchain.getBlock(req.params.blockHeight)
        res.send(response)

    }
       catch (error) {
           res.status(404).json({
               "status": 404,
               "message": "Not found! Requested Block does not exist!"
           })
       }

})

app.get('/stars/address:address', async( req, res ) => {
    try {
        const address = req.params.address.slice(1)
        const response = await blockchain.getBlockByAddress(address)
        res.send(response)

    }
       catch (error) {
           res.status(404).json({
               "status": 404,
               "message": "Not found! Requested Block does not exist!"
           })
       }

})

app.get('/stars/hash:hash', async( req, res ) => {
    try {
        const hash = req.params.hash.slice(1)
        const response = await blockchain.getBlockByHash(hash)
        res.send(response)

    }
       catch (error) {
           res.status(404).json({
               "status": 404,
               "message": "Not found! Requested Block does not exist!"
           })
       }

})

// GET endpoint
app.get('/height', async( req, res) => {
    try {
        const response = await blockchain.getBlockHeight()
        res.send(response)
    }
    catch (error) {
        res.status(404).json({
            "status": 404,
            "message": "Not found! There are no blocks in the chain"
        })
    }
})

