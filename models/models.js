var mongoose = require('mongoose')
var connect = process.env.MONGODB_URI
mongoose.connect(connect, {useMongoClient: true});

var Frame = new mongoose.Schema({
  predictions: Array,
  url : String
});


module.exports = {
  Frame : mongoose.model('Frame', Frame)
}
