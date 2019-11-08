// variables
var w, h, counter = 0;

// load svg file
function loadfile(input) {
  var reader = new FileReader();
  var path = input.value;
  reader.onload = function(e) {
    if (path.toLowerCase().substring(path.length - 4 === ".svg")) {
      readsvg.value = e.target.result;
      imageLoaded();
    } else {
      alertify.error("Sorry that file type is not supported. Please only load .svg files.");
    }
  };
  reader.readAsText(input.files[0]);
};
function dropfile(file) {
  var reader = new FileReader();  
  reader.onload = function(e) {
    if (file.type === "image/svg+xml") {
      readsvg.value = e.target.result;
      imageLoaded();
    } else {
      alertify.error("Sorry that file type is not supported. Please only load .svg files.");
    }
  }        
  reader.readAsText(file,"UTF-8"); 
};
function imageLoaded() {
  animate.innerHTML = readsvg.value;
  read.classList.add("hide");
  scripttxt.classList.remove("hide");
  btns.classList.remove("hide");
  reloadSVG();
};
openfile.onchange = function() {
  loadfile(this);
  
  dropflash.classList.remove("hide");
  readsvg.value = "";
  $("#dropflash").fadeOut();
};
read.ondragover   = function(e) {
  this.style.opacity = ".5";
  return false;
};
read.ondragend    = function() {
  read.style.opacity = "1";
  return false;
};
read.ondrop       = function(e) {
  e.preventDefault();
  read.style.opacity = "1";
  dropflash.classList.remove("hide");
  readsvg.value = "";
  $("#dropflash").fadeOut();
  var file = e.dataTransfer.files[0];
  dropfile(file);
};

// reload svg
function reloadSVG() {
  imgframes.innerHTML = "";
  animate.innerHTML = readsvg.value;
  w  = document.querySelector("#animate > svg").getAttribute("width");
  h = document.querySelector("#animate > svg").getAttribute("height");
  if (!w || !h) {
    alertify.alert("Width and Height attributes are required for grabbing animation frames!").set("basic", true);
    return false;
  }
  if (w || h) {
    document.querySelector("#animate > svg").removeAttribute("width");
    document.querySelector("#animate > svg").removeAttribute("height");
  }
  // remove the vector-effect attribute
//  $("#animate svg *").attr("vector-effect", "");
  $("#animate svg *").removeAttr("vector-effect");
}

// remove element
function removeElm(elm) {
  $(elm).remove();
}

// get frames
function getFrame() {
  // scrollTo top
  // window.scrollTo({ top: 0 });
  
  // add svg to base64
  function grabFrameImg() {
    var canvas = document.querySelector("#canvas");
    var ctx    = canvas.getContext("2d");
    canvas.width  = w.replace(/pt/g, "").replace(/px/g, "").replace(/%/g, "").replace(/em/g, "").replace(/in/g, "").replace(/cm/g, "").replace(/px/g, "");
    canvas.height = h.replace(/pt/g, "").replace(/px/g, "").replace(/%/g, "").replace(/em/g, "").replace(/in/g, "").replace(/cm/g, "").replace(/px/g, "");
    
    var img = new Image();
    var s = new XMLSerializer().serializeToString(document.querySelector("#animate > svg"))
    var encodedData = window.btoa(s);
    img.src = "data:image/svg+xml;base64," + encodedData;
    
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      var imgType    = canvas.toDataURL("image/png");
//      img.classList.add("pointer");
//      img.setAttribute("onclick", "removeElm(this)")
      img.src = imgType;
    };

    imgframes.appendChild(img);
  }
  grabFrameImg();
}
grabframes.onclick = function() {
  creatingsequence.classList.remove("hide");

  var frames = animLength.value / animRate.value;
  if (frames.toString().indexOf(".") >= 0) {
    alertify.error("Error: Frame rate <strong>MUST</strong> go into the length evenly.");
    return false;
  }
  
  reloadSVG();
  window.intervalID = setInterval(function() {
    console.log("Grabbing Frame " + counter++);
    var remainingFrames = parseInt(frames - parseInt(counter)) + " Frames remaining";
    document.querySelector("#creatingsequence h1").textContent = remainingFrames;
    getFrame();
    
    if (counter > frames) {
      if (window.intervalID != undefined && window.intervalID != 'undefined') {
        window.clearInterval(window.intervalID);
        console.log('Timer cleared with id' + window.intervalID);
      }

      animWidth.value  = canvas.width;
      animHeight.value = canvas.height;
      grabit.classList.add("hide");
      
      creatingsequence.classList.add("hide");
      scripttxt.classList.add("hide");
      animate.innerHTML = "";
      
      animDimensions.classList.remove("hide");
      creategif.classList.remove("hide");
      exportsequence.classList.remove("hide");
      return false;
    }
  }, animRate.value);

  grabframes.classList.add("hide");
};

// create gif animation
creategif.onclick = function() {
  creategif.classList.add("hide");
  grabit.classList.add("hide");
  animDimensions.classList.add("hide");
  scripttxt.classList.add("hide");

  showprocess.classList.remove("hide");
  var images = [];
  $("#imgframes img").each(function() {
    images.push($(this).attr("src"));
  });
  
  gifshot.createGIF({
    images: images,
    gifWidth: animWidth.value,
    gifHeight: animHeight.value,
    interval: animRate.value, // seconds
    progressCallback: function(captureProgress) { console.log('progress: ', captureProgress); },
    completeCallback: function() { console.log('completed!!!'); },
    numWorkers: 2,
  },function(obj) {
    if(!obj.error) {
      var image = obj.image;
      result.src = image;
      showit.classList.remove("hide");
      exportgif.classList.remove("hide");
      showprocess.classList.add("hide");
    }
  });
};

// export gif animation
exportgif.onclick = function() {
  this.href = result.src;
};

// download image sequence
exportsequence.onclick = function() {
  var totalImgs = parseInt(document.querySelectorAll("#imgframes img").length);
  
  var zip = new JSZip();

  for (var i = 0; i < totalImgs; i++) {
    zip.file("frame-"+[i]+".png", document.querySelectorAll("#imgframes img")[i].src.split('base64,')[1],{base64: true});
  }
  
  // Export application
  var content = zip.generate({type:"blob"});
  saveAs(content, "svg-image-sequence.zip");
};

// initiate animation when values change
animRate.style.width  = ((animRate.value.length + 1) * 30) + "px";
animLength.style.width = ((animLength.value.length + 1) * 30) + "px";
animRate.onkeydown  = function(e) {
  this.style.width  = ((this.value.length + 1) * 22) + "px";
}
animLength.onkeydown = function(e) {
  this.style.width  = ((this.value.length + 1) * 22) + "px";

  if (e.shiftKey && e.which === 38) {
    this.value = parseInt(parseInt(this.value) + 10);
    e.preventDefault();
  }
  if (e.shiftKey && e.which === 40) {
    this.value = parseInt(parseInt(this.value) - 10);
    e.preventDefault();
  }
}