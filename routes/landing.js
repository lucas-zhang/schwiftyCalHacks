var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongo://localhost:27017/main';


/* GET Landing page. */

router.get('/', function(req, res, next) {
  res.render('landing.html', { title: 'Landing' });
});


module.exports = router;