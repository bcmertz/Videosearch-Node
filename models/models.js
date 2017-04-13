var mongoose = require('mongoose')
var connect = process.env.MONGODB_URI
mongoose.connect(connect);

var Game = new mongoose.Schema({
  character: String,
  probability: Number
});


module.exports = {
  Game: mongoose.model('Game', Game)
}
