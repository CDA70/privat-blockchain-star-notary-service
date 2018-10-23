var isAscii = require('is-ascii')
const Blockchain = require('./simpleChain')
const blockchain = new Blockchain()
const Block = require('./block')
const block = new Block()


const StarValidation = require('./validation')

const validationWindow = 300

async function addBlock(req, res) {
    const MAX_BYTES_ALLOWED = 500
    const {star} = this.req.body
    const {dec,ra,story} = star
    
    if (!this.req.body.address) {
        throw new Error('address cannot be empty!')
    } 

    if (!this.req.body.star) {
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

}





module.exports = {
    addBlock,
};