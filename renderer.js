// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var fb_size = { x: 1000, y: 1000 };

var gl;

function initGL(canvas) {
    try {
        // Disable default framebuffer's AA because we will do MSAA on a separate framebuffer, 
        //  then blit it over to default. The 'blit' requires destination to be not multisampled.
        gl = canvas.getContext("webgl2", { antialias: false });        
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        fb_size.x = canvas.width;
        fb_size.y = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("GRBG: could not initialise WebGL2. ");
    }
}

function checkShaderCompileStatus(shader)
{
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    return checkShaderCompileStatus(shader);
}

var shaderProgram_Floor;

var Shaderz = require('./shaders.js');
var LightInfo;

function initAdvancedShaders()
{    
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    var vs = gl.createShader(gl.VERTEX_SHADER);

    var src = Shaderz.floorShaders();

    gl.shaderSource(fs, src.fs);
    gl.compileShader(fs);
    checkShaderCompileStatus(fs);
    
    gl.shaderSource(vs, src.vs);
    gl.compileShader(vs);
    checkShaderCompileStatus(vs);
    
    shaderProgram_Floor = gl.createProgram();
    gl.attachShader(shaderProgram_Floor, vs);
    gl.attachShader(shaderProgram_Floor, fs);
    gl.linkProgram(shaderProgram_Floor);

    if (!gl.getProgramParameter(shaderProgram_Floor, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram_Floor);
    
    shaderProgram_Floor.vertexPositionAttribute = gl.getAttribLocation(shaderProgram_Floor, "position");
    console.log(shaderProgram_Floor.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram_Floor.vertexPositionAttribute);

    shaderProgram_Floor.pMatrixUniform = gl.getUniformLocation(shaderProgram_Floor, "uPMatrix");
    shaderProgram_Floor.mvMatrixUniform = gl.getUniformLocation(shaderProgram_Floor, "uMVMatrix");
    shaderProgram_Floor.shadowMatrixUniform = gl.getUniformLocation(shaderProgram_Floor, "shadow_matrix");
    shaderProgram_Floor.grbgUniform = gl.getUniformLocation(shaderProgram_Floor, "grbg");
    
    console.log("grbg uniform: " + shaderProgram_Floor.grbgUniform);
}

var shaderProgram;

function initShaders() 
{
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    var vs = gl.createShader(gl.VERTEX_SHADER);

    LightInfo = new Shaderz.lightInfo();
    LightInfo.initFramebuffer(gl);

    var src = Shaderz.lightShaders();

    gl.shaderSource(fs, src.fs);
    gl.compileShader(fs);
    checkShaderCompileStatus(fs);
    
    gl.shaderSource(vs, src.vs);
    gl.compileShader(vs);
    checkShaderCompileStatus(vs);
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    
    
    shaderProgram.vertexPositionAttribute = 0;
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vpMatrixUniform = gl.getUniformLocation(shaderProgram, "vp_matrix");
    shaderProgram.mMatrixUniform  = gl.getUniformLocation(shaderProgram, "model");
    
}


var mvMatrix = mat4.create();
var pMatrix  = mat4.create();


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}




var rPyramid = 0;
var rCube = 0;

const MD = require('./models.js');
console.log(MD);
let mm   = new MD.Models(gl);

function _drawPyramid() {
    
    gl.bindBuffer(gl.ARRAY_BUFFER, mm.pyramidVertexPositionBuffer);
    gl.vertexAttribPointer(0, mm.pyramidVertexPositionBuffer.itemSize,gl.FLOAT, false, 0, 0);
    //gl.bindBuffer(gl.ARRAY_BUFFER, mm.pyramidVertexColorBuffer);
    //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, mm.pyramidVertexColorBuffer.itemSize,gl.FLOAT, false, 0, 0);    
    gl.drawArrays(gl.TRIANGLES, 0, mm.pyramidVertexPositionBuffer.numItems);
}


function _drawCube() {
    gl.bindBuffer(gl.ARRAY_BUFFER, mm.cubeVertexPositionBuffer);
    gl.vertexAttribPointer(0, mm.cubeVertexPositionBuffer.itemSize,gl.FLOAT, false, 0, 0);
    //gl.bindBuffer(gl.ARRAY_BUFFER, mm.cubeVertexColorBuffer);
    //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, mm.cubeVertexColorBuffer.itemSize,gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mm.cubeVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, mm.cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);    
}

function _drawFloor() {
        
    gl.bindBuffer(gl.ARRAY_BUFFER, mm.floorVertexPositionBuffer);
    gl.vertexAttribPointer(0, mm.floorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //gl.bindBuffer(gl.ARRAY_BUFFER, mm.floorVertexPositionBuffer);
    //gl.vertexAttribPointer(1, mm.floorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);    
    gl.drawArrays(gl.TRIANGLES, 0, mm.floorVertexPositionBuffer.numItems);

}

function drawScene() 
{

    if(false) { // Draw from light's point of view, into a depth buffer. 
        gl.bindFramebuffer(gl.FRAMEBUFFER, LightInfo.lightFramebuffer);
        gl.viewport(0, 0, LightInfo.texSize, LightInfo.texSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shaderProgram);        
        gl.uniformMatrix4fv(shaderProgram.vpMatrixUniform, false, LightInfo.light_vp_matrix);
    }

    {
//        gl.bindFramebuffer(gl.FRAMEBUFFER, LightInfo.viewFramebuffer);
        //gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);
        mat4.translate([-0.5,-0.5, -8.0], mvMatrix );
        gl.useProgram(shaderProgram_Floor);


        gl.uniformMatrix4fv(shaderProgram_Floor.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram_Floor.mvMatrixUniform, false, mvMatrix);
        gl.uniform1fv(shaderProgram_Floor.grbgUniform, [2.0]);
        
        _drawFloor(); 

        gl.uniform1fv(shaderProgram_Floor.grbgUniform, [0.0]);        
        _drawPyramid();
        
        
        gl.uniform1fv(shaderProgram_Floor.grbgUniform, [0.5]);        
        _drawCube();
        
    }
}


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        if ((1 > 0) || elapsed % 5000 < 2500) {
            rPyramid += 0.5;
            rCube -= 0.7;
        }
    } else
        lastTime = timeNow;
}

var tickCount = 0;

function tick() {

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer_id);
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0.0, 0.0, 0.0, 0.5);

    //gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.3, 0.0, 1.0]);

    //gl.enable(gl.SAMPLE_COVERAGE);
    //gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    //gl.sampleCoverage(1.0, false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    drawScene();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer_id);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.blitFramebuffer(
        0, 0, fb_size.x, fb_size.y,
        0, 0, fb_size.x, fb_size.y,
        gl.COLOR_BUFFER_BIT, gl.LINEAR);
    gl.blitFramebuffer(
        0, 0, fb_size.x, fb_size.y,
        0, 0, fb_size.x, fb_size.y,
        gl.DEPTH_BUFFER_BIT, gl.NEAREST);


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    animate();

    tickCount++;

    requestAnimFrame(tick);
}



var framebuffer_id = null;

function initFramebuffer() {

    // What factor of MSAA we will use. 
    var N_msaa = 8;

    // Create new Renderbuffer and tag it as MSAA
    var colorRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, N_msaa, gl.RGBA8, fb_size.x, fb_size.y);

    var depthRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, N_msaa, gl.DEPTH24_STENCIL8, fb_size.x, fb_size.y);

    // Create and bind new Framebuffer
    framebuffer_id = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer_id);

    // Slap the MSAA'd Renderbuffer onto the just-made Framebuffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

    // Restore default Framebuffer to not myrus up the state. 
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    LightInfo.viewFrameBuffer = framebuffer_id;
}

function webGLStart() {
    var canvas = document.getElementById("lesson04-canvas");
    initGL(canvas);
    initShaders();
    initAdvancedShaders();
    mm.initBuffers(gl);

    initFramebuffer();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    console.log("  vendor: ", gl.getParameter(gl.VENDOR),
        "  version: ", gl.getParameter(gl.VERSION),
        "  glsl_version: ", gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

    tick();
}


webGLStart();
