let express = require('express')
let router = express.Router()

let multer = require('multer')
let fs = require('fs')
let mime = require('mime')

let upload = multer({ dest: 'uploads/'})

// future use case

module.exports = router
