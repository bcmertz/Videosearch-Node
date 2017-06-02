import React, {Component} from 'react'
import css from '../backend/static/styles.css'
import ReactDOM from 'react-dom'
import Button from 'react-bootstrap/lib/Button'
var ReactS3Uploader = require('react-s3-uploader');

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      query: '',  //query in query box
      time : null,  //time rendered in video
      loading : false,  //uploading video y/n
      predictions: null, //object containing tags:[times, times]
      ready : false,  //have tags y/n
      list : null,  //array containing unique prediction tags
      index: 0,    //index currently used from predictions tag array
      url: null,  //set to aws mp4 url to render video
      youtubeUrl: null,  //youtube url in search box
      link: null,  //youtubeUrl on submission, should eliminate youtubeUrl by using ref in refactoring
      hide: false  //hide entry boxes on url submission
    }
  }
  handleKeyPress(event){ //listens for enter press to iterate through different time occurences of the same classification time
    var self = this;
    var inc = null;
    if(event.key == 'Enter'){
      self.state.list.forEach(function(item){ //gets list of unique tags and checks for each one if our search term matches a classification
        if (item.toLowerCase() === self.state.query.toLowerCase()) {   //checks to make sure search term matches a classification
          if(self.state.index === self.state.predictions[item].length-1) {  //if enter is pressed at the end of the list of times for a given classication tag it sets the new time index to the beginning of the list
            console.log('End of list');
            var test = true;
            var inc = 0;
            self.setState({index:inc})  //sets time index (from time array) to the beginning of the list if at the end
          } else {
            console.log('next index');
            var test = true;
            var inc = self.state.index+1;
            self.setState({index:inc})  //sets time index (from time array) to the next one
          }
        }
      })
    }
  }
  updateQuery(evt){   //onChange in the search box causes this to update the state of the query term
    evt.preventDefault();
    this.setState({query:evt.target.value, index:0})  //need to set index to 0 so if the new query isn't a classification the app doesn't break
  }
  updateYoutubeUrl(evt){   //onChange in the url box updates the state of youtubeUrl to the new string entered
    evt.preventDefault();
    this.setState({youtubeUrl:evt.target.value})
  }
  handleSubmit(evt){  //handles submission of url form
    evt.preventDefault();
    var self = this;
    var url = this.state.youtubeUrl
    //TODO if(link is good) { //clinet side link authentication
      this.setState({   //sets the link to the text input youtubeUrl (can be replaced without state and use ref instead), this triggers handleYoutube in componentDidUpdate
        loading: true,
        link: url,
        hide: true
      })
    // } else {}
  }
  resetPage(evt){
    evt.preventDefault();
    this.setState({
      query: '',  //query in query box
      time : null,  //time rendered in video
      loading : false,  //uploading video y/n
      predictions: null, //object containing tags:[times, times]
      ready : false,  //have tags y/n
      list : null,  //array containing unique prediction tags
      index: 0,    //index currently used from predictions tag array
      url: null,  //set to aws mp4 url to render video
      youtubeUrl: null,  //youtube url in search box
      link: null,  //youtubeUrl on submission, should eliminate youtubeUrl by using ref in refactoring
      hide: false
    })
  }
  componentDidUpdate() {
    var time = null //yep
    var self = this
    if (self.state.predictions) { //search in array of classified images for search term occurence
      self.state.list.forEach(function(item){
        if (item.toLowerCase() === self.state.query.toLowerCase()) {
          time = self.state.predictions[item][self.state.index]
          console.log('Found search term, displaying results', time, 'item array', self.state.predictions[item])
          document.getElementById("uploadedvideo").currentTime=time
        }
      })
    } else if(self.state.link) {  //if the user is uploading a link this is triggered and posts the link to the backend
      //TODO add client side authentication of the link, and a separate route if the link is non-youtube link
      console.log('youtube', self.state.link);
      self.handleYoutube(self.state.link)
    }
  }
  onStart(file, next){  //at the start of the upload of a video from the client to aws we set loading to true so there is visual feedback
    var self = this;
    self.setState({
      loading : true,
      hide : true
    })
    next(file) //boilerplate keeps the uplaod going
  }
  handleYoutube(link){  //if a youtube link is submitted, we send that link to the appropriate backend route
    var self = this;
    fetch('/youtube',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: link
      })
    })
    .then(()=> {
      var timer = Date.now()  //assumes error and stops chekcing after a minute
      console.log('looking for result')
      var check = setInterval(function(){
        fetch('/results')
        .then(function(response){
          return response.json()
        })
        .then(function(responseJson){
          console.log('checked');
          var timenow = Date.now() - timer
          if (responseJson.success === true) {  //if the results are ready
            console.log('got response', responseJson.data);
            var predictionsArray = responseJson.data.predictions  //all predictions and times
            var url = responseJson.data.url   //url on aws
            console.log('predictionsArray', predictionsArray, 'url', url);
            clearInterval(check)
            var predictionsObject = {}    //contains unique tags and an associated array of the times that tag occurs
            var list = []   //list of unique classification names
            predictionsArray.forEach(function(item){
              if (predictionsObject[item.classification]) {
                predictionsObject[item.classification].push(item.time)
              } else {
                list.push(item.classification)
                predictionsObject[item.classification] = [item.time]
              }
            })
            self.setState({loading : false, predictions: predictionsObject, ready : true, list: list, url: url})  //loading gif disappears, list and predictions array help us search and render tags, ready shows search bar, url shows video on aws
          } else {    //results not ready
            if (responseJson.error) {
              alert('Invalid URL, reload and try again')  //TODO make more elegant
              clearInterval(check)
            } else if (timenow >= 480000) {
              alert('Process failed, reload and try again')  //TODO make more elegant
              clearInterval(check)
            }
            return
          }
        })
        .catch(function(err){
          console.log(err);
        })
      }, 1000)  //frequency we check for the results
    })
    .catch(function(err){
      console.log(err);
    })
  }
  handleMP4(url){ //if link submitted is an mp4
    var self = this
    fetch('/uploadurl',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    })
    .then(()=> {
      console.log('looking for result')
      var check = setInterval(function(){
        fetch('/results')
        .then(function(response){
          return response.json()
        })
        .then(function(responseJson){ //see youtube comments
          if (responseJson.success === true) {
            console.log('got response', responseJson.data.predictions);
            var predictionsArray = responseJson.data.predictions
            var url = responseJson.data.url
            console.log('predictionsArray', predictionsArray);
            clearInterval(check)
            var predictionsObject = {}
            var list = []
            predictionsArray.forEach(function(item){
              if (predictionsObject[item.classification]) {
                predictionsObject[item.classification].push(item.time)
              } else {
                list.push(item.classification)
                predictionsObject[item.classification] = [item.time]
              }
            })
            self.setState({loading : false, predictions: predictionsObject, ready : true, list: list, url: url})
          } else {
            console.log('response not ready')
            return
          }
        })
        .catch(function(err){
          console.log(err);
        })
      }, 1000)
    })
    .catch(function(err){
      console.log(err);
    })
  }
  onFinish(signResult){   //for videoupload, when the upload to aws finishes we construct the url it is located at, set state to that to render the video, send to backend and look for results
    var self = this
    var tempUrl = signResult.publicUrl.slice(12,signResult.publicUrl.length)
    var url = 'https://s3-us-west-1.amazonaws.com/mybucket-bennettmertz/'+tempUrl
    console.log('url', url)
    fetch('/uploadurl',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    })
    .then(()=> {
      self.setState({
        url: url
      })
      console.log('looking for result')
      var check = setInterval(function(){
        fetch('/results')
        .then(function(response){
          return response.json()
        })
        .then(function(responseJson){  //see above comments in youtube upload
          if (responseJson.success === true) {
            console.log('got response', responseJson.data.predictions);
            var predictionsArray = responseJson.data.predictions
            console.log('predictionsArray', predictionsArray);
            clearInterval(check)
            var predictionsObject = {}
            var list = []
            predictionsArray.forEach(function(item){
              if (predictionsObject[item.classification]) {
                predictionsObject[item.classification].push(item.time)
              } else {
                list.push(item.classification)
                predictionsObject[item.classification] = [item.time]
              }
            })
            self.setState({loading : false, predictions: predictionsObject, ready : true, list: list})
          } else {
            console.log('response not ready')
            return
          }
        })
        .catch(function(err){
          console.log(err);
        })
      }, 1000)
    })
    .catch(function(err){
      console.log(err);
    })
  }
  render(){
    var predictions = this.state.predictions;
    var counter = 0;

    return(
      <div style={{width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', textAlign: 'center'}}>
        {!this.state.ready && !this.state.loading ? <div>
        <h1>SearchWithinVideo</h1>
        <p>Submit a youtube url or upload a video to get started</p>
        <form onSubmit={this.handleSubmit.bind(this)}>
            <input ref="youtube" style={styles.input1} type="text" placeholder="Enter youtube link here" onChange={this.updateYoutubeUrl.bind(this)}/>
            <input type="submit"/>
        </form>
        <ReactS3Uploader
          signingUrl="/s3/sign"
          signingUrlMethod="GET"
          accept="video/*"
          signingUrlWithCredentials={ true }      // in case when need to pass authentication credentials via CORS
          uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}  // this is the default
          contentDisposition="auto"
          onFinish = {this.onFinish.bind(this)}
          preprocess = {this.onStart.bind(this)}
          scrubFilename={(filename) => filename.replace(/[^\w\d_\-\.]+/ig, '')}
          />
        </div>
        :
        <div style={{marginTop: 30}}>
          <form onSubmit={this.resetPage.bind(this)}>
            <input type="submit" value="New Video Search"/>
          </form>
        </div>
      }
        {this.state.loading ?
          <div style={{marginTop: 30}}>
            <img src="https://s-media-cache-ak0.pinimg.com/originals/90/80/60/9080607321ab98fa3e70dd24b2513a20--mark-bennett-ui-animation.jpg" width="640" height="360" alt="Loading gif"/>
          </div>
          :
          <div></div>
        }
        {
          this.state.ready ?
          <div style = {{marginTop: 30, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'}}>
          <video id="uploadedvideo" width="640" height="360" controls>
            <source src={this.state.url} type="video/mp4"/>
            Your browser does not support the video tag.
          </video>
          <p style={{marginTop: 15}}>Now enter a word from the list below. Hit enter to search for additional occurrences.</p>
          <input type="text" style={styles.input2} name="name" onKeyPress={this.handleKeyPress.bind(this)} onChange={this.updateQuery.bind(this)} value={this.state.query} placeholder='Enter Search Term Here' />
          <h2>What we found</h2>
          <ul>
            {this.state.list.map(function(item) {
              counter++
              return <li style={{listStyleType: 'none'}} key={counter}>{item} ({predictions[item].length})</li>
            })}
          </ul>
          </div>
          : <div></div>
        }
      </div>
    )
  }
}

let styles = {
  input1: {
    width: 320,
    marginBottom: 15,
    marginRight: 5,
    paddingLeft: 5
  },
  input2: {
    width: 640,
    marginBottom: 15,
    paddingLeft: 5
  }
};

ReactDOM.render(
  <Main />, document.getElementById('root')
)
