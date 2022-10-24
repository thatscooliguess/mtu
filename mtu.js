(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Perspective = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright 2010 futomi  http://www.html5.jp/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// perspective.js v0.0.2
// 2010-08-28
//
// This file was modified by Fabien LOISON <http://www.flozz.fr/>


/* -------------------------------------------------------------------
 * define objects (name space) for this library.
 * ----------------------------------------------------------------- */

var html5jp = window.html5jp || {};

(function() {

    /* -------------------------------------------------------------------
     * constructor
     * ----------------------------------------------------------------- */
    html5jp.perspective = function(ctxd, image) {
        // check the arguments
        if( ! ctxd || ! ctxd.strokeStyle ) { return; }
        if( ! image || ! image.width || ! image.height ) { return; }
        // prepare a <canvas> for the image
        var cvso = document.createElement('canvas');
        cvso.width = parseInt(image.width);
        cvso.height = parseInt(image.height);
        var ctxo = cvso.getContext('2d');
        ctxo.drawImage(image, 0, 0, cvso.width, cvso.height);
        // prepare a <canvas> for the transformed image
        var cvst = document.createElement('canvas');
        cvst.width = ctxd.canvas.width;
        cvst.height = ctxd.canvas.height;
        var ctxt = cvst.getContext('2d');
        // parameters
        this.p = {
            ctxd: ctxd,
            cvso: cvso,
            ctxo: ctxo,
            ctxt: ctxt
        }
    };

    /* -------------------------------------------------------------------
     * prototypes
     * ----------------------------------------------------------------- */

    var proto = html5jp.perspective.prototype;

    /* -------------------------------------------------------------------
     * public methods
     * ----------------------------------------------------------------- */

    proto.draw = function(points) {
        var d0x = points[0][0];
        var d0y = points[0][1];
        var d1x = points[1][0];
        var d1y = points[1][1];
        var d2x = points[2][0];
        var d2y = points[2][1];
        var d3x = points[3][0];
        var d3y = points[3][1];
        // compute the dimension of each side
        var dims = [
            Math.sqrt( Math.pow(d0x-d1x, 2) + Math.pow(d0y-d1y, 2) ), // top side
            Math.sqrt( Math.pow(d1x-d2x, 2) + Math.pow(d1y-d2y, 2) ), // right side
            Math.sqrt( Math.pow(d2x-d3x, 2) + Math.pow(d2y-d3y, 2) ), // bottom side
            Math.sqrt( Math.pow(d3x-d0x, 2) + Math.pow(d3y-d0y, 2) )  // left side
        ];
        //
        var ow = this.p.cvso.width;
        var oh = this.p.cvso.height;
        // specify the index of which dimension is longest
        var base_index = 0;
        var max_scale_rate = 0;
        var zero_num = 0;
        for( var i=0; i<4; i++ ) {
            var rate = 0;
            if( i % 2 ) {
                rate = dims[i] / ow;
            } else {
                rate = dims[i] / oh;
            }
            if( rate > max_scale_rate ) {
                base_index = i;
                max_scale_rate = rate;
            }
            if( dims[i] == 0 ) {
                zero_num ++;
            }
        }
        if(zero_num > 1) { return; }
        //
        var step = 2;
        var cover_step = step * 5;
        //
        var ctxo = this.p.ctxo;
        var ctxt = this.p.ctxt;
        ctxt.clearRect(0, 0, ctxt.canvas.width, ctxt.canvas.height);
        if(base_index % 2 == 0) { // top or bottom side
            var ctxl = this.create_canvas_context(ow, cover_step);
            ctxl.globalCompositeOperation = "copy";
            var cvsl = ctxl.canvas;
            for( var y=0; y<oh; y+=step ) {
                var r = y / oh;
                var sx = d0x + (d3x-d0x) * r;
                var sy = d0y + (d3y-d0y) * r;
                var ex = d1x + (d2x-d1x) * r;
                var ey = d1y + (d2y-d1y) * r;
                var ag = Math.atan( (ey-sy) / (ex-sx) );
                var sc = Math.sqrt( Math.pow(ex-sx, 2) + Math.pow(ey-sy, 2) ) / ow;
                ctxl.setTransform(1, 0, 0, 1, 0, -y);
                ctxl.drawImage(ctxo.canvas, 0, 0);
                //
                ctxt.translate(sx, sy);
                ctxt.rotate(ag);
                ctxt.scale(sc, sc);
                ctxt.drawImage(cvsl, 0, 0);
                //
                ctxt.setTransform(1, 0, 0, 1, 0, 0);
            }
        } else if(base_index % 2 == 1) { // right or left side
            var ctxl = this.create_canvas_context(cover_step, oh);
            ctxl.globalCompositeOperation = "copy";
            var cvsl = ctxl.canvas;
            for( var x=0; x<ow; x+=step ) {
                var r =  x / ow;
                var sx = d0x + (d1x-d0x) * r;
                var sy = d0y + (d1y-d0y) * r;
                var ex = d3x + (d2x-d3x) * r;
                var ey = d3y + (d2y-d3y) * r;
                var ag = Math.atan( (sx-ex) / (ey-sy) );
                var sc = Math.sqrt( Math.pow(ex-sx, 2) + Math.pow(ey-sy, 2) ) / oh;
                ctxl.setTransform(1, 0, 0, 1, -x, 0);
                ctxl.drawImage(ctxo.canvas, 0, 0);
                //
                ctxt.translate(sx, sy);
                ctxt.rotate(ag);
                ctxt.scale(sc, sc);
                ctxt.drawImage(cvsl, 0, 0);
                //
                ctxt.setTransform(1, 0, 0, 1, 0, 0);
            }
        }
        // set a clipping path and draw the transformed image on the destination canvas.
        this.p.ctxd.save();
        this._applyClipPath(this.p.ctxd, [[d0x, d0y], [d1x, d1y], [d2x, d2y], [d3x, d3y]]);
        this.p.ctxd.drawImage(ctxt.canvas, 0, 0);
        this.p.ctxd.restore();
    }

    /* -------------------------------------------------------------------
     * private methods
     * ----------------------------------------------------------------- */

    proto.create_canvas_context = function(w, h) {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
        return ctx;
    };

    proto._applyClipPath = function(ctx, points) {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for( var i=1; i<points.length; i++ ) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.clip();
    };

})();


module.exports = html5jp.perspective;

},{}]},{},[1])(1)
});


alert("ZXCXZ111C");



var canvas = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var targurl = 'http://fithouston.webflow.io/';
var select = 4;
var delay = 3000;
var scaler = 2;
var mocks = [];
var aspectratio = 19.5/9.5;
const canvasupload = document.querySelector('#canvasupload');
const ctx2 = canvasupload.getContext('2d');
const uploader = document.querySelector('#uploader');
var image = new Image();
//var img = document.getElementById("stock");
var viewport = mocks[select][2];
viewport = "mobile";
//image.src = "https://cdn.filestackcontent.com/AZnYffln9SjifQ4e1tVvIz/urlscreenshot=mode:window,delay:"+delay+",agent:"+viewport+"/"+targurl;


mocks[0] = ['https://images.unsplash.com/photo-1604074131228-9d48b811bd80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3087&q=80', [[360*scaler, 513*scaler],[722*scaler, 546*scaler],[657*scaler, 842*scaler],[295*scaler,  752*scaler]],'desktop', 9/16];
mocks[1] = ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80', 
[[74*scaler, 97*scaler],[475*scaler, 115*scaler],[520*scaler, 360*scaler],[104*scaler,  369*scaler]],'desktop', 9/16];
mocks[2] = ['https://i.ibb.co/N2hNWC6/mock-phone-pink.png', 
[[490*scaler, 90*scaler],[614*scaler, 170*scaler],[300*scaler, 360*scaler],[180*scaler,  275*scaler]],'mobile', 16/9];
mocks[3] = ['https://images.unsplash.com/photo-1505156868547-9b49f4df4e04?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1016&q=80', 
[[248*scaler, 292*scaler],[554*scaler, 292*scaler],[554*scaler, 832*scaler],[248*scaler,  832*scaler]],'mobile', 16/9];
mocks[4] = ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=967&q=80', 
[[115*scaler, 208*scaler],[584*scaler, 154*scaler],[679*scaler, 1072*scaler],[217*scaler,  1120*scaler]],'mobile', 4];
mocks[5] = ['https://images.unsplash.com/photo-1624517542693-6f10f3c9dc40?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80', 
[[414*scaler, 716*scaler],[588*scaler, 716*scaler],[589*scaler, 1053*scaler],[413*scaler,  1053*scaler]],'mobile', 2];
mocks[6] = ['https://cdn.pixabay.com/photo/2022/04/11/17/55/iphone-7126316_1280.jpg', 
[[138*scaler, 174*scaler],[314*scaler, 88*scaler],[676*scaler, 266*scaler],[503*scaler,  367*scaler]],'mobile', 2];
mocks[7] = ['https://images.pexels.com/photos/8947141/pexels-photo-8947141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
[[225*scaler, 433*scaler],[433*scaler, 388*scaler],[522*scaler, 796*scaler],[319*scaler,  846*scaler]],'mobile'];




uploader.addEventListener('change',(e)=>{
  console.log(canvasupload.height,canvasupload.width);
  const myFile = uploader.files[0];
  console.log(myFile.name);
  image.src = URL.createObjectURL(myFile);
  image.onload = function(){
    frameimage(aspectratio);
  }
})


function composite(t){
	var ctx = canvas.getContext("2d");
	var p = new Perspective(ctx, canvasupload);
	p.draw(mocks[t][1]);
	//add top layers
	// if(mocks[select][2]=="mobile"){ctx.drawImage(img, 0, 0, document.querySelector("#stock").width*scaler, document.querySelector("#stock").height*scaler); }
}

window.onload = function() {
		for(let i = 0; i < mocks.length; i++) {
		  const img = document.createElement("img");
		  img.src = mocks[i][0];
		  img.classList.add("image-stock");
		  img.addEventListener("click", function() {
		   c.width = img.naturalWidth;
		   c.height = img.naturalHeight;
		   c.style.aspectRatio = c.width/c.height;
		   ctx.drawImage(img, 0, 0);
           frameimage(mocks[i][3]);
           composite(i);
           return false;
		  })
		  document.querySelector(".gallery").appendChild(img);
		}
    }


document.querySelector("#urlform").onsubmit = function(){
  getscreenshot(document.querySelector("#furl").value);
  return false;
};

function getscreenshot(t){
  image.src = "https://cdn.filestackcontent.com/AZnYffln9SjifQ4e1tVvIz/urlscreenshot=mode:window,delay:"+delay+",agent:"+viewport+"/http://"+t;
}

function frameimage(aspectr){
  canvasupload.height = image.width*aspectr;
  canvasupload.width = image.width; 
  ctx2.drawImage(image,0,0,canvasupload.width,canvasupload.width*aspectr,0,0,canvasupload.width,canvasupload.width*aspectr);
}



