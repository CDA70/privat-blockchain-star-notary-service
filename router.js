var isAscii = require('is-ascii')
const Blockchain = require('./simpleChain')
const blockchain = new Blockchain()
const Block = require('./block')
const block = new Block()
const StarValidation = require('./validation')


async function requestAddressValidation(req, res){
    const validation = new StarValidation(req)
    const address = req.body.address
    if (!address) 
       return res.status(400).send({message: 'the address is required, please fill in address!'})
    
    try {
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
        return res.status(400).send({message: 'the address is required, please fill in address!'})
    }  

    if (!req.body.star) {
        return res.status(400).send({message: 'Star parameter cannot be empty!'})
    } 

    if (typeof dec   !== 'string' || 
        typeof ra    !== 'string' || 
        typeof story !== 'string' ||
        !dec.length               || 
        !ra.length                || 
        !story.length) {
                return res.status(400).send({message: 'Fill in proper star information!'})
    }
    
    if (new Buffer(story).length > MAX_BYTES_ALLOWED) {
        return res.status(400).send({message: 'your star story is too long, shorten it to MAX 500 bytes!'})
    }

    // npm install is-ascii save
    if (!isAscii(story)){
        return res.status(400).send({message: 'Only ASCII charaters are allowed!'})
    }

    validation = new StarValidation(req)
    const isValidKey = await validation.validKey(req.body.address)
    if ( isValidKey === 'invalidKey') {
        return res.status(400).send({message: 'signature is not valid!'})
    }
    
    
   let starBlock = {
       address: req.body.address,
       star: req.body.star
   }
    try{ 
        starBlock.star.story = new Buffer(req.body.star.story).toString('hex')
        await blockchain.addBlock(new Block(starBlock))
        const height = await blockchain.getBlockHeight()
        const response = await blockchain.getBlock(height)
        await validation.deleteAddress(req.body.address)
        

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
        console.log('req.params.blockhieght: ' + req.params.blockHeight)
        const response =  await blockchain.getBlockByHeight(req.params.blockHeight)
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