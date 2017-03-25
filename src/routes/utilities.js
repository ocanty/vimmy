var express = require('express');
var router = express.Router();

var multer = require("multer")
var fs = require("fs")
var mime = require("mime")

var upload = multer({ dest: "uploads/"})

// future use case

module.exports = router;
