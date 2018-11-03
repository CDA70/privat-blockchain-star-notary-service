var isAscii = require('is-ascii')
const Blockchain = require('./simpleChain')
const blockchain = new Blockchain()
const Block = require('./block')
const block = new Block()
const StarValidation = require('./validation')

async function requestAddressValidation(req, res){
    const validation = new StarValidation(req)
    const address = req.body.address
    console.log('address is undefined: body: ' + req)
    try {
       console.log('within Try requestAddressValidation ' + address)
       data = await validation.getPendingAddressRequest(address)
       console.log(data)
    }   
    catch (error) {
        res.status(401).json({
            status: 401,
            message: error.message
        })
    }
    res.json(data)
}

async function validateSignature(req, res){

    validation = new StarValidation(req)
    try{
        const address = req.body.address
        const signature = req.body.signature
        console.log(address)
        console.log(signature)
        const response = await validation.isMessageSignatureValid(address, signature)

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
    
}

async function addBlock(req, res) {
    const MAX_BYTES_ALLOWED = 500
    const {star} = req.body
    const {dec,ra,story} = star
    
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
    
   let starBlock = {
       address: req.body.address,
       star: req.body.star
   }
    try{
        // Start code reviewer
        starBlock.star.story = new Buffer(req.body.star.story).toString('hex')
        // end code reviewer 
        await blockchain.addBlock(new Block(starBlock))
        const height = await blockchain.getBlockHeight()
        const response = await blockchain.getBlock(height)

        res.status(201).send(response)
    } catch (error) {
        res.status(401).json({
            status: 401,
            message: error.message
        })
    }
}

async function getBlockByHeight(res, req){
    try {
        const response =  await blockchain.getBlock(req.params.blockHeight)
        res.send(response)

    }
       catch (error) {
           res.status(404).json({
               "status": 404,
               "message": "Not found! Requested Block does not exist!"
           })
       }
}

async function getBlockByAddress(res,req){
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
}

async function getBlockByHash(res,req){
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
}

module.exports = {
    requestAddressValidation,
    validateSignature,
    addBlock,
    getBlockByHeight,
    getBlockByAddress,
    getBlockByHash
};