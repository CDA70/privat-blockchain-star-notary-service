const express = require('express')
const app = express()
const server = "http://www.expressjs.com"
const port = 8000
const parser = require('body-parser')
const Blockchain = require('./simpleChain')
const blockchain = new Blockchain()
const Block = require('./block')
const block = new Block()


app.use(parser.json())

app.listen(port, () => console.log(`Private Blockchain API app build on ${server} is listening on port ${port}!`))

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

// POST endpoint
app.post('/block', async (req, res) => {
    //const {body} = req.body.body
    if (req.body.body === undefined || req.body.body === '') {
        res.status(400).json({
            "status": 400,
            "message": 'The server returned a bad request! Block data cannot be empty, please fill out block!'})

    } else {
       await blockchain.addBlock(new Block(req.body.body)) 
         .then(block => res.status(201).json(req.body.body))
         .catch ((error) => {
             res.status(500).json({
                 "status": 500,
                 "message": 'internal server error! The server has encountered a situation it does not know how to handle.'})
         })
    }
    
})


//curl http://localhost:8000/block/1
//curl -X "POST" "http://localhost:8000/block" -H 'Content-Type: application/json' -d $'{"body":"content added to the blockchain"}'