const express = require('express')
const app = express()
const routers = require('./router')
const bodyParser = require('body-parser')
const server = "http://www.expressjs.com"
const port = 8000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded( {extended: true} ));
app.listen(port, () => console.log(`Private Blockchain API app build on ${server} is listening on port ${port}!`))

// call API end points
app.post('/requestValidation', routers.requestAddressValidation)
app.post('/message-signature/validate', routers.validateSignature)
app.post('/block', routers.addBlock)
app.get('/block/:blockHeight', async( req, res ) => {routers.getBlockByHeight (res, req)})
app.get('/stars/address:address', async( req, res ) => {routers.getBlockByAddress(res, req)})
app.get('/stars/hash:hash', async( req, res ) => {routers.getBlockByHash(res,req)})
