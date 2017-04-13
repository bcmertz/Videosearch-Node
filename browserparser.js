var createThumbnails = function () {
  var i = 0;
  var video = document.createElement("video");
  var thumbs = document.getElementById("thumbs");

  video.addEventListener('loadeddata', function() { //when a frame has loaded (before the next has) it
    console.log("Loaded the Video");
    thumbs.innerHTML = "";
    video.currentTime = i;
  }, false); //runs after video.preload runs

  video.addEventListener('seeked', function() {
    // now video has seeked and current frames will show
    // at the time as we expect
    generateThumbnail();
    i=i+4; // when frame is captured, increase
    if (i <= video.duration) { // if we are not passed end, seek to next interval
      // this will trigger another seeked event
      video.currentTime = i;
    } else {
      alert("done!") //each second of the video has a frame captured
    }
  }, false);

  video.preload = "auto"; //begins loading video early on
  video.src = source; //for uploaded files, maybe this doesn't work
  //through iframe api or from video upload

  function generateThumbnail() { //we use canvas and append a child canvas to thumbs
    //so inside thumbs are the canvas children
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d"); //sets 2d convas of c.width and c.height to ctx.drawImage (built-in) on
    c.width = 160;
    c.height = 90;
    ctx.drawImage(video, 0, 0, 160, 90);
    console.log(3)
    var img = new Image();
    img.src = c.toDataURL();


    // var data = {
    //   Key: 'frameN',
    //   Body: bodystream,
    //   ContentEncoding: 'base64',
    //   ContentType: 'image/png'
    // }
    //
    // s3Bucket.putObject(data, function (err,data) {
    //   if(err){
    //     console.log("err", err);
    //   } else {
    //     console.log('successfully uploaded')
    //   }
    // })

    thumbs.appendChild(img);
    // thumbs.appendChild(c);  //we add our created image into thumbs, instead we can get rbg array for
    //each pixel and send that to a server
  }
}
