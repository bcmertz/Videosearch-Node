
var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser')
var PythonShell = require('python-shell');
var fileUpload = require('express-fileupload');
var http = require('http');
var aws = require('aws-sdk')
var mongoose = require('mongoose')
var models = require('../models/models.js')
var Frame = models.Frame;
var Clarifai = require('clarifai');
var youtubedl = require('youtube-dl')
var fs = require('fs')

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
  res.sendFile(path.join(__dirname, '../index.html'))  //for the mainpage send index.html which has out bundled app as a script inside
});  //get main page

var ready = false  //global variable dictating if the results are ready or not yet, doens't scale to multiple users
var error = false  //handle youtubedl error

router.get('/results', function(req, res){  //send back results if they're ready ,TODO make this server accessible to multiple users
  if (ready) {
    Frame.find(function(err, data){
      if(err){
        console.log('Error', err);
      } else{
        ready = false
        res.send({success: true, data:data[data.length-1]});    //send most recent results
      }
    })
  } else if (error) {
    error = false
    res.send({success : false, error: true})
  }
  else {
    res.send({success : false})  //results not ready keep asking frontend
  }
})

router.post('/predict', function(req, res){  //the python server sends the image urls and their associated times here to be classified and have results saved
  var allKeys = req.body.source;  //
  var url = req.body.url;  //aws s3 video url
  var predictions = [];  //contains classifications and associated time
  var counter = 0;  //allows us to keep track of times and resulting classifications
  var predictionArray = []  //contains urls to send to clarifai
  allKeys.forEach(function(item){  //just send urls to clarifai
    var time = item.time
    var image = item.url
    predictionArray.push({"url": image})
  })
  if(predictionArray.length>120) {    //TODO this section is hit if there are a lot of images
    var superPredictionArray = []
    for(var i = 0; i<predictionArray.length/120; i++){
      superPredictionArray.push([]);
      var j = 0;
      while(j<120){
        if(predictionArray[i*120+j]){
          superPredictionArray[superPredictionArray.length-1].push(predictionArray[i*120+j])
          j++
        } else {
          j=121
        }
      }
    }
    for(var i = 0; i<superPredictionArray.length; i++){
      console.log('superPredictionArray[i].length', superPredictionArray[i].length)
      clari.models.predict(Clarifai.GENERAL_MODEL, superPredictionArray[i]).then(
        function(response) {
          console.log('Number of outputs', response.outputs.length)
          response.outputs.forEach(function(item){
            predictions.push({classification : item.data.concepts[0].name, time: allKeys[counter].time})
            console.log('Classification', item.data.concepts[0].name, 'Time', allKeys[counter].time);
            counter++
          })
        },
        function(err) {
          console.error('Error', err);
          error = true
          res.send('failed')
        }
      );
    };
    var timer = Date.now()
    var results = setInterval(function(){
      if(predictions.length === predictionArray.length) {
        clearInterval(results);
        var videodata = Frame({
          predictions: predictions,
          url: url
        })
        videodata.save(function(err){
          if(err){
            predictionArray = []
            predictions = []
            error = true
            console.log('Error', err);
          } else{
            console.log('Data was saved')
            predictionArray = []
            predictions = []
            ready = true
            // return 'done'
            res.send('success : true')
          }
        });
      } else {
        if(Date.now()-timer > 30000) {
          console.log('clarifai error / timeout');
          clearInterval(results)
          predictionArray = []
          predictions = []
          error = true
        } else {
          console.log('not done yet, waiting for Clarifai');
        }
      }
    }, 1000)
  } else {
    console.log('predictionArray', predictionArray);
    clari.models.predict(Clarifai.GENERAL_MODEL, predictionArray).then(
      function(response) {
        console.log('Number of outputs', response.outputs.length)
        response.outputs.forEach(function(item){
          predictions.push({classification : item.data.concepts[0].name, time: allKeys[counter].time})
          counter++
        })
        var videodata = Frame({
          predictions: predictions,
          url: url
        })
        videodata.save(function(err){
          if(err){
            predictionArray = []
            predictions = []
            error = true
            console.log('Error', err);
          } else{
            console.log('Data was saved')
            predictionArray = []
            predictions = []
            ready = true
            // return 'done'
            res.send('success : true')
          }
        });
      },
      function(err) {
        console.error('Error', err);
        predictionArray = []
        predictions = []
        error = true
        res.send('failed')
      }
    );
  }
})

// router.post('/stream', function(req,res){  //in case someone gives a stream url
//   var source = 's'+req.body.url
//   console.log('source', source)
//   var options = {
//     // host: 'whatever the heroku is called',
//     port: 8080,
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded',
//       'Content-Length': Buffer.byteLength(source)
//     }
//   };
//   var httpreq = http.request(options, function (response) {
//     response.setEncoding('utf8');
//     response.on('data', function (chunk) {
//       console.log("body: " + chunk);
//     }).on('error', function(err) {
//       res.send('error');
//     }).on('end', function() {
//       res.send('ok');
//     })
//   }).on('error', function(e){
//     console.log(e)
//   });
//   httpreq.write(source);
//   httpreq.end();
//   res.redirect('/')
// })    //not currently in sue

router.post('/uploadurl', function(req, res){   //hit after frontend aws upload occurs for video uplad
  var source = 'f'+req.body.url  //so python knows its file not a stream
  console.log('source',source)
  var options = {   //options to post to python
    host: '34.210.45.244',
    port: 8080,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(source)
    }
  };
  var httpreq = http.request(options, function (response) {   //manual ass http post to python
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      console.log("body: " + chunk);
    }).on('error', function(err) {
      error = true
      res.send('error');
    }).on('end', function() {
      res.send('ok');
    })
  }).on('error', function(e){
    error = true
    console.log(e)
  });
  httpreq.write(source);
  httpreq.end();
  res.redirect('/')
})

router.post('/youtube', function(req, res){   //route for youtube link submissions, we download video, upload to aws, then send that link to python
  //TODO unique file names on aws, get around buffer size limits
  console.log('in youtubedl, url:', req.body.url);
  var postToPython = function (url) {  //post request to python containing url
    var source = 'f'+url;
    console.log('source',source);
    var options = {
      host: '34.210.45.244',
      port: 8080,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(source)
      }
    };
    var httpreq = http.request(options, function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        console.log("body: " + chunk);
      }).on('error', function(err) {
        error = true
        res.send('error');
      }).on('end', function() {
        res.send('ok');
      })
    }).on('error', function(e){
      console.log(e)
    });
    httpreq.write(source);
    httpreq.end();
    console.log('~~~~~~~~~~~~~~~~here~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    res.send('done')
  };
  var uploadVideo = function () {  //upload video to aws by reading the downloaded file (youtubedl) and turning its data into a buffer
    console.log('uploading video');
    fs.readFile('myvideo.mp4', function(err, data){   //read the video file
      if (err) {
        error = true
        res.send('error')
      }
      var base64data = new Buffer(data, 'binary')   //turn the reading file into a buffer
      var params = {    //parameters to upload to aws
        Bucket: 'mybucket-bennettmertz', Key: 'myvideo.mp4', Body: base64data, ACL:"public-read-write"
      };
      s3.putObject(params, function(resp){    //put the object in the mybucket-bennettmertz bucket with public access
        var url = 'https://s3-us-west-1.amazonaws.com/'+'mybucket-bennettmertz'+'/'+'myvideo.mp4'
        postToPython(url)   //post the aws url to python so it can parse it apart
      })
    })
  }

  var video = youtubedl(req.body.url,   //boilerplate to download the specified url
    ['--format=18'],
    { cwd: __dirname }
  );
  // Will be called when the download starts.
  video.on('info', function(info) {  //youtubedl
    console.log('Download started');
    console.log('filename: ' + info._filename);
    console.log('size: ' + info.size);
  });
  video.pipe(fs.createWriteStream('myvideo.mp4'));  //youtubedl
  video.on('end', function() {  //youtubedl
    console.log('finished downloading, uploading to aws-s3');
    uploadVideo()
  });
  video.on('error', function(){
    console.log('error');
    error = true
    res.send('err')
  })
})

router.use('/s3', require('react-s3-uploader/s3router')({  //backend route needed for react-s3-uploader, lets us get the signed url back
    bucket: "mybucket-bennettmertz",    //default bucket
    // region: 'us-west-1', //optional
    // signatureVersion: 'v4', //optional (use for some amazon regions: frankfurt and others)
    headers: {'Access-Control-Allow-Origin': '*'}, // optional
    ACL: 'public-read'
  })
);

module.exports = router;  //exports to server.js
