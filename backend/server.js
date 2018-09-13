var express =require('express');
var path =require('path'); //path module in node
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload');
var routes = require('./routes');
var app = express();

app.use(express.static('build'));
app.use(express.static(path.join(__dirname, 'static')));

//middleware configured to use folder 'build' for static? script tags
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use((req,res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
});
app.use('/', routes);

var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App running on heroku port ' +process.env.PORT+ '!')
})
