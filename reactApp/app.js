
import React, {Component} from 'react'
import css from '../styles.css'
import ReactDOM from 'react-dom'
var ReactS3Uploader = require('react-s3-uploader');

// const io = require('socket.io-client')
// const socket = io()

class Main extends React.Component {
  constructor() {
    super();
    this.getResult = this.getResult.bind(this)
    this.state = {
      character: '',
      probability: 0,
      url: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  }
  stream(evt) {
    evt.preventDefault();
    var self = this
    console.log('stream', self.state.url)
    fetch('http://localhost:3000/stream',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: self.state.url
      })
    })
  }
  getResult(evt){
    evt.preventDefault();
    var self = this;
    fetch('http://localhost:3000/gameinfo')
    .then(function(response){
      return response.json()
    })
    .then(function(responseJson){
      self.setState({
        character: responseJson.character,
        probability: responseJson.probability
      })
    })
    .catch(function(err){
      console.log(err);
    })
  }
  onFinish(){
    var self = this;
    fetch('http://localhost:3000/uploadurl',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: 'https://s3-us-west-1.amazonaws.com/code-testing/f44fd929-2585-49a2-a718-1327d1d84aff_blitzcrank.mp4'
      })
    })
    // .then(()=> {
    //   console.log('setting up socket')
    //   return socket.on('results', function(data){
    //     console.log('inside results client socket', data)
    //     self.setState({
    //       character: data.character,
    //       probability: data.probability
    //     })
    //   })
    // })
    .catch(function(err){
      console.log(err);
    })
  }
  update(evt){
    console.log('update this.state.url to', evt.target.value)
    this.setState({url:evt.target.value})
  }
  render(){
    var gameInfo = '';
    if(this.state.character === 'Blitzcrank' && this.state.probability > 0){
      gameInfo = 'We are ' + this.state.probability*100 +'% confident that you are playing ' + this.state.character;
    } else if(this.state.character === 'an unidentifiable character'){
      gameInfo = 'We are unable to confidently identify the character you are playing. Our best guess is that you are playing Blitzcrank (' + this.state.probability + '%)'
    }
    return(
      <div>
        <h2>Submit a stream link below:</h2>
        <form onSubmit={this.stream.bind(this)}>
        <label>
        URL: <input type="text" name="name" onChange={this.update.bind(this)} value={this.state.url} />
        </label>
        <input type="submit" value="Submit" />
        </form>
        <div>
          <h1 style={{textAlign: 'center'}}>Play smarter. Carry harder.</h1>
          <p>League of Legends is a game of skill. Hitting skillshots makes for increased damage,
            higher winrates, and epic montages.
            Why settle for missing skillshots?
          </p>
          <p>Untilt.gg uses advanced machine learning and computer vision unlock your skillshot potential.</p>
          <h2 style = {{textAlign: 'center'}}> Upload a video to get gameplay analytics</h2>
          <div style ={{textAlign: 'center', paddingBottom: 20}}>
          </div>
          <ReactS3Uploader
          signingUrl="/s3/sign"
          signingUrlMethod="GET"
          accept="video/*"
          signingUrlWithCredentials={ true }      // in case when need to pass authentication credentials via CORS
          uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}  // this is the default
          contentDisposition="auto"
          onFinish = {this.onFinish}
          scrubFilename={(filename) => filename.replace(/[^\w\d_\-\.]+/ig, '')}
          server="http://localhost:3000" />
        </div>
        <div style={{textAlign: 'center'}}>
          <form onSubmit = {this.getResult}>
            <input type='submit' value='Get Results!'/>
          </form>
          <h2>{gameInfo}</h2>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Main />, document.getElementById('root')
)
