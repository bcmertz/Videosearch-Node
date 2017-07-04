var express =require('express');
var path =require('path'); //path module in node
const compression = require('compression');
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload');
var routes = require('./routes');
var app = express();

app.get('*.gz', (req, res, next) => {
  res.set('Content-Encoding', 'gzip');
  next();
});  //indicates to the browser how to read gz files

app.use(compression());
app.use(express.static('build'));
app.use(express.static(path.join(__dirname, 'static')));

//middleware configured to use folder 'build' for static? script tags
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/', routes);

var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App running on heroku port ' +process.env.PORT+ '!')
})
