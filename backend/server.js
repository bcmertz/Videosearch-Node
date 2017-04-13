var express =require('express');
var path =require('path'); //path module in node
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload');
var routes = require('./routes');
var app = express();

// var io=require('socket.io').listen(server);

app.use(express.static('build'));

//middleware configured to use folder 'build' for static? script tags
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/', routes);

var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App running on heroku port ' +process.env.PORT+ '!')
})
