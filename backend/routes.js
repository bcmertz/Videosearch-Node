var express = require('express');
var app = express();
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser')
var PythonShell = require('python-shell');
var fileUpload = require('express-fileupload');
var http = require('http');
var aws = require('aws-sdk')
var mongoose = require('mongoose')
var models = require('../models/models.js')
var Game = models.Game;
var Clarifai = require('clarifai');
var response = require('response')
var querystring = require('querystring');
var request = require('request')

var s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

var clari = new Clarifai.App(
  process.env.id,
  process.env.password
);
clari.getToken();

router.get('/', function(req,res){
  res.sendFile(path.join(__dirname, '../index.html'))
});

router.get('/gameinfo', function(req, res){
  Game.find(function(err, data){
    if(err){
      console.log('Error', err);
    } else{
      res.json(data[data.length-1]);
    }
  })
})

router.post('/predict', function(req, res){
  var allKeys = req.body.source;
  var predictions = [];
  var idx = 0
  var counter = 0;
  // allKeys.forEach(function(item){
  //   clari.models.predict(Clarifai.GENERAL_MODEL, item).then(
  //       function(response) {
  //         counter++;
  //         console.log(counter, allKeys.length);
  //         predictions.push(response.outputs[0].data.concepts[0]);
  //         if (counter === allKeys.length){
  //           var probability = 0;
  //           predictions.forEach(function(item){
  //             probability += item.value;
  //           })
  //           probability /= predictions.length;
  //           var character = 'an unidentifiable character';
  //           if(probability > .95){
  //             character = 'Blitzcrank';
  //           }
  //           var gamedata = Game({
  //             character: character,
  //             probability: probability
  //           })
  //           gamedata.save(function(err){
  //             if(err){
  //               console.log('Error', err);
  //             } else{
  //               console.log('Data was saved')
  //               res.send('success : true') //???????????????maybe delete????????????
  //             }
  //           });
  //         }
  //       },
  //       function(err) {
  //         console.error('Error', err);
  //       }
  //     );
  // })
})

router.post('/stream', function(req,res){
  var source = 's'+req.body.url
  console.log('stream source', source)
  // var options = {
  //   host: 'whatever the heroku is called',
  //   port: 8080,
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     'Content-Length': Buffer.byteLength(source)
  //   }
  // };
  // var httpreq = http.request(options, function (response) {
  //   response.setEncoding('utf8');
  //   response.on('data', function (chunk) {
  //     console.log("body: " + chunk);
  //   }).on('error', function(err) {
  //     res.send('error');
  //   }).on('end', function() {
  //     res.send('ok');
  //   })
  // }).on('error', function(e){
  //   console.log(e)
  // });
  // httpreq.write(source);
  // httpreq.end();
  // console.log('here')
  // res.redirect('/')
  var postData = querystring.stringify({
    "source" : source
  });
  var options = {
    url: 'https://secret-shore-54651.herokuapp.com/parse',
    form: postData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  request.post(options, function(e,r,body){
    if(e) {
      console.log(e);
    } else if (r) {
      console.log(r);
    } else {
      console.log(body);
    }
  })
})

router.post('/uploadurl', function(req, res){
  // var source = req.body.url //this doesn't work yet
  // var source = {"type": "uploadedvideo", "data": req.body.url}
  var source = 'f'+req.body.url
  console.log('uploadurl source',source)
  var postData = querystring.stringify({
    "source" : source
  });
  var options = {
    url: 'https://secret-shore-54651.herokuapp.com/parse',
    form: postData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  request.post(options, function(e,r,body){
    if(e) {
      console.log(e);
    } else if (r) {
      console.log(r);
    } else {
      console.log(body);
    }
  })
  //
  //
  // var options = {
  //   host: 'https://secret-shore-54651.herokuapp.com/parse',
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     'Content-Length': Buffer.byteLength(source)
  //   }
  // };
  // var httpreq = http.request(options, function (response) {
  //   response.setEncoding('utf8');
  //   response.on('data', function (chunk) {
  //     console.log("body: " + chunk);
  //   }).on('error', function(err) {
  //     res.send('error');
  //   }).on('end', function() {
  //     res.send('ok');
  //   })
  // }).on('error', function(e){
  //   console.log(e)
  // });
  // httpreq.write(source);
  // httpreq.end();
  // console.log('here1')
  // res.redirect('/')
})

router.use('/s3', require('react-s3-uploader/s3router')({
    bucket: "mybucket-bennettmertz",
    // region: 'us-west-1', //optional
    // signatureVersion: 'v4', //optional (use for some amazon regions: frankfurt and others)
    headers: {'Access-Control-Allow-Origin': '*'}, // optional
    ACL: 'public-read'
  })
);

module.exports = router;
