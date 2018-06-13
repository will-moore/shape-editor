/*
// Copyright (C) 2015 University of Dundee & Open Microscopy Environment.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following
// conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
// disclaimer in the documentation // and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived 
// from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, 
// BUT NOT LIMITED TO,
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS
// BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE // GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT // LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* globals fabric: false */
/* globals console: false */

$(function() {

    var WIDTH = 512,
        HEIGHT = 512;

    var options = {};

    var shapesClipboard = [];


    window.canvas = new fabric.Canvas('canvas');
    var canvas = window.canvas;
    // canvas.selectionColor = 'rgba(255, 255, 0, 0.3)';
    // canvas.selectionBorderColor = '#ffff00';
    // canvas.selectionLineWidth = 15;

    // function updateControls(event) {
    //   console.log(event.target, event.e, event.pointer, event.transform);
    //   return false;
    // }

    // canvas.on({
    //   'object:moving': updateControls,
    //   'object:scaling': updateControls,
    //   'object:resizing': updateControls,
    //   'object:rotating': updateControls,
    //   'object:skewing': updateControls
    // });


    var zoomPercent = 100;

    var state = "SELECT";
    var strokeColor = "#ff0000";
    var strokeWidth = 2;

    var supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

    // DRAWING functions

    // https://blog.thirdrocktechkno.com/how-to-draw-an-arrow-using-html-5-canvas-and-fabricjs-9500c3f50ecb
    fabric.LineArrow = fabric.util.createClass(fabric.Line, {

      type: 'lineArrow',

      initialize: function(element, options) {
        options || (options = {});
        this.callSuper('initialize', element, options);
      },

      toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'));
      },

      _render: function(ctx) {
        // draw line bit shorter than full length...

        ctx.beginPath();

        var headSize = (this.strokeWidth * 4) + 5;
        var headx1 = Math.sin(-1.2) * headSize;
        var heady1 = Math.cos(-1.2) * headSize;

        if (!this.strokeDashArray || this.strokeDashArray && supportsLineDash) {
            // move from center (of virtual box) to its left/top corner
            // we can't assume x1, y1 is top left and x2, y2 is bottom right
            var p = this.calcLinePoints();
            // Need to draw line to the base of arrow head, not to x2, y2 point
            var ang = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
            var dx = Math.cos(ang) * 0.9 * headSize;
            var dy = Math.sin(ang) * 0.9 * headSize;
            var x2 = p.x2 - dx;
            var y2 = p.y2 - dy;
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(x2, y2);
        }

        ctx.lineWidth = this.strokeWidth;

        // TODO: test this
        // make sure setting "fill" changes color of a line
        // (by copying fillStyle to strokeStyle, since line is stroked, not filled)
        var origStrokeStyle = ctx.strokeStyle;
        ctx.strokeStyle = this.stroke || ctx.fillStyle;
        this.stroke && this._renderStroke(ctx);
        ctx.strokeStyle = origStrokeStyle;

        // do not render if width/height are zeros or object is not visible
        if (this.width === 0 || this.height === 0 || !this.visible) return;

        ctx.save();

        var xDiff = this.x2 - this.x1;
        var yDiff = this.y2 - this.y1;
        var angle = Math.atan2(yDiff, xDiff);
        ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(headx1, heady1);
        ctx.lineTo(headx1, -heady1);
        ctx.closePath();
        ctx.fillStyle = this.stroke;
        ctx.fill();

        ctx.restore();

      }
    });

    fabric.LineArrow.fromObject = function(object, callback) {
      callback && callback(new fabric.LineArrow([object.x1, object.y1, object.x2, object.y2], object));
    };

    fabric.LineArrow.async = true;


    // var Arrow = (function() {
    //   function Arrow(canvas) {
    //     this.canvas = canvas;
    //     this.className = 'Arrow';
    //     this.isDrawing = false;
    //     this.bindEvents();
    //   }

    //   Arrow.prototype.bindEvents = function() {
    //     var inst = this;
    //     inst.canvas.on('mouse:down', function(o) {
    //       inst.onMouseDown(o);
    //     });
    //     inst.canvas.on('mouse:move', function(o) {
    //       inst.onMouseMove(o);
    //     });
    //     inst.canvas.on('mouse:up', function(o) {
    //       inst.onMouseUp(o);
    //     });
    //     inst.canvas.on('object:moving', function(o) {
    //       inst.disable();
    //     })
    //   }

    //   Arrow.prototype.onMouseUp = function(o) {
    //     var inst = this;
    //     inst.disable();
    //   };

    //   Arrow.prototype.onMouseMove = function(o) {
    //     var inst = this;
    //     if (!inst.isEnable()) {
    //       return;
    //     }

    //     var pointer = inst.canvas.getPointer(o.e);
    //     var activeObj = inst.canvas.getActiveObject();
    //     activeObj.set({
    //       x2: pointer.x,
    //       y2: pointer.y
    //     });
    //     activeObj.setCoords();
    //     inst.canvas.renderAll();
    //   };

    //   Arrow.prototype.onMouseDown = function(o) {
    //     var inst = this;
    //     inst.enable();
    //     var pointer = inst.canvas.getPointer(o.e);

    //     var points = [pointer.x, pointer.y, pointer.x, pointer.y];
    //     var line = new fabric.LineArrow(points, {
    //       strokeWidth: 5,
    //       fill: 'red',
    //       stroke: 'red',
    //       originX: 'center',
    //       originY: 'center',
    //       hasBorders: false,
    //       hasControls: false
    //     });

    //     inst.canvas.add(line).setActiveObject(line);
    //   };

    //   Arrow.prototype.isEnable = function() {
    //     return this.isDrawing;
    //   }

    //   Arrow.prototype.enable = function() {
    //     this.isDrawing = true;
    //   }

    //   Arrow.prototype.disable = function() {
    //     this.isDrawing = false;
    //   }

    //   return Arrow;
    // }());




    // Editing polygon points: http://jsfiddle.net/Da7SP/535/

    var newShape, isDown, origX, origY;

    function handleMouseDown(o){
      isDown = true;
      var pointer = canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;

      console.log("mouse-down...", state);

      if (state === "ELLIPSE") {
        newShape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'rgba(0, 0, 0, 0)',
          selectable: true,
          originX: 'center', originY: 'center',
          rx: 1,
          ry: 1
        });
        canvas.add(newShape);
      } else if (state === "RECT") {
        newShape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'rgba(0, 0, 0, 0)',
          selectable: true,
          width: 1,
          height: 1
        });
        canvas.add(newShape);
      } else if (state === "LINE") {
        newShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'rgba(0, 0, 0, 0)',
          selectable: true,
          originX: 'center', originY: 'center',
          width: 1,
          height: 1
        });
        canvas.add(newShape);
      } else if (state === "ARROW") {
        newShape = new fabric.LineArrow([pointer.x, pointer.y, pointer.x, pointer.y], {
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'rgba(0, 0, 0, 0)',
          selectable: true,
          originX: 'center', originY: 'center',
          width: 1,
          height: 1
        });
        canvas.add(newShape);
      }
    }

    function handleMouseMove(o){
      if (!isDown) {
        return;
      }
      var pointer = canvas.getPointer(o.e);
      if (state === "ELLIPSE") {
        newShape.set({ rx: Math.abs(origX - pointer.x),ry:Math.abs(origY - pointer.y) });
      } else if (state === "RECT") {
        newShape.set({
          left: Math.min(origX, pointer.x) - (strokeWidth/2),
          top: Math.min(origY, pointer.y) - (strokeWidth/2),
          width: Math.abs(origX - pointer.x),
          height: Math.abs(origY - pointer.y),
        });
      } else if (state === "LINE") {
        newShape.set({
          x2: pointer.x,
          y2: pointer.y
        });
      } else if (state === "ARROW") {
        newShape.set({
          x2: pointer.x,
          y2: pointer.y
        });
      }
      canvas.renderAll();
    }

    function handleMouseUp(o){
      isDown = false;
    }




    // set state depending on what we want to do,
    // for example to create Rectangle

    function setState(newState) {
      console.log("state", newState);
      if (newState === "SELECT") {
        // from http://jsfiddle.net/softvar/hKp8D/
        canvas.isDrawingMode = false;
        canvas.selection= true;
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
        canvas.forEachObject(function(o){
            o.setCoords();
        });
      } else if (state === "SELECT") {
        // Only re-bind events if we *were* in SELECT state
        // TODO: turn off selection of existing shapes!
        canvas.selection = false;
        canvas.observe('mouse:down', handleMouseDown);
        canvas.observe('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);
      }
      state = newState;
    }

    // initial state:
    setState("SELECT");


    $("input[name='state']").click(function(){
        setState($(this).val());
    });

    $("input[name='strokeColor']").click(function(){
      strokeColor = $(this).val();
      console.log("strokeColor", strokeColor);
    });

    $("select[name='strokeWidth']").change(function(){
        strokeWidth = parseFloat($(this).val());
        console.log('strokeWidth', strokeWidth);
    });

    var updateZoom = function updateZoom() {
        $("#zoomDisplay").text(zoomPercent + " %");
        // shapeManager.setZoom(zoomPercent);
        var w = WIDTH * zoomPercent / 100,
            h = HEIGHT * zoomPercent / 100;
        $(".imageWrapper img").css({'width': w, 'height': h});
    };

    $("button[name='zoomIn']").click(function(){
        zoomPercent += 20;
        updateZoom();
    });
    $("button[name='zoomOut']").click(function(){
        zoomPercent -= 20;
        updateZoom();
    });

    $("button[name='deleteSelected']").click(function(){
        // shapeManager.deleteSelectedShapes();
    });

    $("button[name='deleteAll']").click(function(){
        // shapeManager.deleteAllShapes();
    });

    $("button[name='selectAll']").click(function(){
        // shapeManager.selectAllShapes();
    });

    $("button[name='copyShapes']").click(function(){
        // shapesClipboard = shapeManager.getSelectedShapesJson();
    });

    $("button[name='pasteShapes']").click(function(){
        // paste shapes, constraining to the image coords
        // var p = shapeManager.pasteShapesJson(shapesClipboard, true);
        if (!p) {
            console.log("Shape could not be pasted: outside view port");
        }
    });

    $("button[name='getShapes']").click(function(){
      // var json = shapeManager.getShapesJson();
      console.log(json);
    });

    $("button[name='getBBoxes']").click(function(){
      // var shapes = shapeManager.getShapesJson();
      shapes.forEach(function(shape){
        // var bbox = shapeManager.getShapeBoundingBox(shape.id);
        // Add each bbox as a Rectangle to image
        bbox.type = "Rectangle";
        bbox.strokeColor = "#ffffff";
        // shapeManager.addShapeJson(bbox);
      });
    });

    $("button[name='selectShape']").click(function(){
      // shapeManager.selectShapesById(1234);
    });

    var lastShapeId;
    $("button[name='deleteShapesByIds']").click(function(){
      // shapeManager.deleteShapesByIds([lastShapeId]);
    });

    $("button[name='setShapes']").click(function(){
        var shapesJson = [
          {"type": "Rectangle",
            "strokeColor": "#ff00ff",
            "strokeWidth": 10,
            "x": 100, "y": 250,
            "width": 325, "height": 250},
          {"type": "Ellipse",
            "x": 300, "y": 250,
            "radiusX": 125, "radiusY": 250,
            "rotation": 100}
          ];
        // shapeManager.setShapesJson(shapesJson);
    });

    $("#shapesCanvas").bind("change:selected", function(){
        // var strokeColor = shapeManager.getStrokeColor();
        if (strokeColor) {
          $("input[value='" + strokeColor + "']").prop('checked', 'checked');
        } else {
           $("input[name='strokeColor']").removeProp('checked');
        }
        // var strokeWidth = shapeManager.getStrokeWidth() || 1;
        $("select[name='strokeWidth']").val(strokeWidth);
    });

    $("#shapesCanvas").bind("change:shape", function(event, shapes){
        console.log("changed", shapes);
    });

    $("#shapesCanvas").bind("new:shape", function(event, shape){
        console.log("new", shape.toJson());
        // console.log("selected", shapeManager.getSelectedShapesJson());
    });

    // Hover effect -------------------

    // canvas.on('mouse:over', function(e) {
    //   if (!e.target) {
    //     return; // mouseover canvas
    //   }
    //   e.target.orig_stroke = e.target.get('stroke')
    //   e.target.set('stroke', 'red');
    //   canvas.renderAll();
    // });

    // canvas.on('mouse:out', function(e) {
    //   if (!e.target) {
    //     return;  // mouseout canvas
    //   }
    //   e.target.set('stroke', e.target.orig_stroke);
    //   canvas.renderAll();
    // });


    // Scale object but keep strokeWidths same:
    // https://stackoverflow.com/questions/39548747/fabricjs-how-to-scale-object-but-keep-the-border-stroke-width-fixed
    fabric.Object.prototype._renderStroke = function (ctx) {
        if (!this.stroke || this.strokeWidth === 0) {
            return;
        }
        if (this.shadow && !this.shadow.affectStroke) {
            this._removeShadow(ctx);
        }
        ctx.save();
        // if (this.strokeUniform)
        ctx.scale(1 / this.scaleX, 1 / this.scaleY);
        this._setLineDash(ctx, this.strokeDashArray, this._renderDashedStroke);
        this._applyPatternGradientTransform(ctx, this.stroke);
        ctx.stroke();
        ctx.restore();
    };
    fabric.Object.prototype._getTransformedDimensions = function (skewX, skewY) {
        // if (!this.strokeUniform)
        //     return _getTransformedDimensions.call(this, e, t);
        if (typeof skewX === 'undefined') {
            skewX = this.skewX;
        }
        if (typeof skewY === 'undefined') {
            skewY = this.skewY;
        }
        var dimX = this.width / 2,
            dimY = this.height / 2;

        var points = [{
            x: -dimX,
            y: -dimY
        }, {
            x: dimX,
            y: -dimY
        }, {
            x: -dimX,
            y: dimY
        }, {
            x: dimX,
            y: dimY
        }];
        var transformMatrix = this._calcDimensionsTransformMatrix(skewX, skewY, false);
        for (var i = 0; i < points.length; i++) {
            points[i] = fabric.util.transformPoint(points[i], transformMatrix);
        }
        var bbox = fabric.util.makeBoundingBoxFromPoints(points);
        return {
            y: bbox.height + this.strokeWidth,
            x: bbox.width + this.strokeWidth,
        };
    };




    // Add shapes to Start------------------------------------------------

    var poly = new fabric.Polygon([
        { x: 329, y: 271 },
        { x: 295, y: 314 },
        { x: 295, y: 365 },
        { x: 333, y: 432 },
        { x: 413, y: 400 },
        { x: 452, y: 350 },
        { x: 432, y: 292 },
        { x: 385, y: 256 },
        { x: 329, y: 271 }
      ], {
      stroke: '#ffffff',
      strokeWidth: 0.5,
      fill: 'rgba(0, 0, 0, 0)',
    });
    canvas.add(poly);


    var polyline = new fabric.Polyline([
        { x: 29, y: 71 },
        { x: 95, y: 14 },
        { x: 95, y: 65 },
        { x: 33, y: 132 },
        { x: 113, y: 100 },
        { x: 152, y: 50 }
      ], {
      stroke: '#00ffdd',
      strokeWidth: 4,
      fill: 'rgba(0, 0, 0, 0)'
    });
    canvas.add(polyline);


    // NB: need to offset left/top for strokestrokeWidth / 2
    var rect = new fabric.Rect({
      left: 200 - 3, top: 150 - 3,
      width: 125, height: 150,
      stroke: "#ff00ff",
      fill: 'rgba(0, 0, 0, 0)',
      strokeWidth: 10,
      lockRotation: true,
    });
    canvas.add(rect);
    // http://fabricjs.com/docs/fabric.Object.html#setControlsVisibility
    rect.setControlsVisibility({ mtr: false });  // hide middle-top-rotate control


    // Ellipse creation: http://jsfiddle.net/softvar/hKp8D/
    canvas.add(
      new fabric.Ellipse({
        left: 200, top: 150,
        rx: 125, ry: 50,
        originX: 'center', originY: 'center',
        angle: 45,
        stroke: "#ff0000",
        fill: 'rgba(0, 0, 0, 0)',
        strokeWidth: 2,
      })
    );

    // TODO: handle? "transform": "matrix(0.82 0.56 -0.56 0.82 183.0 -69.7)"});
    canvas.add(
      new fabric.Ellipse({
        left: 204, top: 260,
        rx: 95, ry: 55,
        originX: 'center', originY: 'center',
        angle: 45,
        stroke: "#ffffff",
        fill: 'rgba(0, 0, 0, 0)',
        strokeWidth: 2,
      })
    );


    // Arrow code from https://jsfiddle.net/ka7nhvbq/2/
    function calcArrowAngle(x1, y1, x2, y2) {
        var angle = 0,
            x, y;

        x = (x2 - x1);
        y = (y2 - y1);

        if (x === 0) {
            angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
        } else if (y === 0) {
            angle = (x > 0) ? 0 : Math.PI;
        } else {
            angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
        }

        return (angle * 180 / Math.PI + 90);
    }


    var arrow1 = new fabric.LineArrow([25, 150, 200, 100], {fill: '#ffff00',
        stroke: '#ffffff',
        strokeWidth: 1}
    );
    canvas.add(arrow1);

    var arrow2 = new fabric.LineArrow([25, 450, 200, 400], {fill: '#ffff00',
        stroke: '#ffff00',
        strokeWidth: 4}
    );

    var arrow3 = new fabric.LineArrow([25, 250, 200, 200], {fill: '#ffff00',
        stroke: '#ffff00',
        strokeWidth: 10}
    );

    canvas.add(arrow2, arrow3);

    // shapeManager.addShapeJson({"type": "Ellipse",
    //                           "strokeColor": "#00ff00",
    //                           "radiusY": 31.5,
    //                           "radiusX": 91,
    //                           "transform": "matrix(2.39437435854 -0.644012141633 2.14261951162 0.765696311828 -1006.17788921 153.860479773)",
    //                           "strokeWidth": 2,
    //                           "y": 297.5,
    //                           "x": 258});

    // shapeManager.addShapeJson({"type": "Ellipse",
    //                       "strokeColor": "#ffff00",
    //                       "radiusY": 71.5,
    //                       "radiusX": 41,
    //                       "transform": "matrix(0.839800601976 0.542894970432 -0.542894970432 0.839800601976 111.894472287 -140.195845758)",
    //                       "strokeWidth": 2,
    //                       "y": 260.5,
    //                       "x": 419});

    // var s = shapeManager.addShapeJson({"type": "Line",
    //                            "strokeColor": "#00ff00",
    //                            "strokeWidth": 2,
    //                            "x1": 400, "y1": 400,
    //                            "x2": 250, "y2": 310});
    // lastShapeId = s.toJson().id;

    // We start off in the 'SELECT' mode
    // shapeManager.setState("SELECT");


//     For the people who are looking for a way to keep aspect ratio for all objects (did not test with group selection, I use selection:false), here is how I do (it would be nice to have an option to do it):
// var currentScaleX = 0;
// var currentScaleY = 0;
// // Event : selected
// canvas.observe('object:selected', function(e) {
//   var activeObject = e.target;
//   // Keep ratio
//   currentScaleX = activeObject.get('scaleX');
//   currentScaleY = activeObject.get('scaleY');
// });

// // Event : scaling
// canvas.observe('object:scaling', function(e) {
//   var activeObject = e.target;
//   if (currentScaleX == activeObject.get('scaleX') && currentScaleY != activeObject.get('scaleY')) activeObject.scale(activeObject.get('scaleY'));
//   else if (currentScaleX != activeObject.get('scaleX') && currentScaleY == activeObject.get('scaleY')) activeObject.scale(activeObject.get('scaleX'));
//   currentScaleX = activeObject.get('scaleX');
//   currentScaleY = activeObject.get('scaleY');

});
