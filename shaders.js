module.exports.lightInfo = function() {
    
    this.lightPosition = [5.0,5.0,5.0];
    this.depth_tex = {};
    this.depth_tex_debug = {};
    this.light_proj_matrix = {};
    this.light_view_matrix = {};
    this.viewFrameBuffer = 0; // the non-"light" framebuffer
    this.texSize = 512;

    this.initFramebuffer = function(gl) 
    {        
        const targetTextureWidth  = this.texSize;
        const targetTextureHeight = this.texSize;
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        this.depth_tex = targetTexture;
        
        // define size and format
        const level = 3;
        const internalFormat = gl.R32F;                                
        gl.texStorage2D(gl.TEXTURE_2D, level, internalFormat,
                        targetTextureWidth, targetTextureHeight);
        //api ref: 
        // void gl.texStorage2D(target, levels, internalformat, width, height);
        
        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,   gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,   gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, 
                         gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D, 
                         gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);

        // create a framebuffer for light grbg.
        this.lightFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFramebuffer);

        // attach the texture as the first color attachment        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                                gl.TEXTURE_2D, this.depth_tex, 0);

        {
            const debugTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, debugTexture);
            this.depth_debug_tex = debugTexture;            
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F,
                            targetTextureWidth, targetTextureHeight);            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,   gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,   gl.LINEAR);            
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                                    gl.TEXTURE_2D, this.depth_debug_tex, 0);
        }

        {
            this.light_proj_matrix = mat4.frustum(-1.0,1.0,-1.0,1.0,1.0,200.0);
            this.light_view_matrix = mat4.lookAt(this.lightPosition,
                                                 [0.0,0.0,0.0], [0.0,1.0,0.0]);
            console.log(this.light_proj_matrix);
            console.log(this.light_view_matrix);            
            this.light_vp_matrix   = mat4.multiply(this.light_proj_matrix,this.light_view_matrix);
            this.shadow_vp_matrix  = mat4.multiply(this.light_proj_matrix,this.light_view_matrix);
            console.log(this.light_vp_matrix);            
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
    }


    
}

module.exports.screenQuadShaders = function() {
    return { 
        vs : `#version 300 es

        layout(location = 0) in vec4 position;
        layout(location = 1) in vec2 texcoord;

        out vec2 UV;

        void main() {
        gl_Position = position;
        UV = texcoord;
        }`,
        fs :
        `#version 300 es

        precision mediump float;

        in vec2 UV;

        uniform sampler2D u_texture;

        out vec4 fragColor;

        void main() {
            fragColor = texture(u_texture, UV);
        }`
        };
}

module.exports.lightShaders = function() {
    return {
        vs: 
        `#version 300 es
        precision mediump float;
        uniform mat4 vp_matrix;
        uniform mat4 model;
        
        layout (location = 0) in vec4 position;
        
        void main(void)
        {
            gl_Position = vp_matrix * model * position;
        }
        `,
        fs:
        `#version 300 es
        precision mediump float;
        layout (location = 0) out vec4 color;
        
        void main(void)
        {
            // note: for debug purposes, we have also mapped 
            // colorattachment0 to the framebuffer now assumed to be bound.
            color = vec4(gl_FragCoord.z);
        }`
    };
}

module.exports.floorShaders = function() {
    return { 
        vs : 
        `#version 300 es

        precision mediump float;

        layout(location = 0) in vec3 position;
        
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        uniform mat4 shadow_matrix;

        uniform float grbg;

        out vec2 UV;
        out vec4 shadow_coord; 

        void main() 
        {
            vec4 posfull = vec4(position, 1.0);
            gl_Position  = uPMatrix * uMVMatrix * posfull;
            
            UV = vec2(grbg);
            //if(grbg > 1.0)
                UV = (position.xy*0.5) + vec2(0.5);
            
            shadow_coord = shadow_matrix * posfull;
        }`,
        fs :
        `#version 300 es

        precision mediump float;

        in vec2 UV;
        in vec4 shadow_coord;

        uniform mediump sampler2DShadow shadow_tex;
        
        out vec4 fragColor;

        void main() {
            fragColor = vec4(UV.x, UV.y, 1.0, 1.0);
            
            vec4 shadow_color = textureProj(shadow_tex, shadow_coord)
                                   * vec4(1.0,1.0,1.0,1.0);     
        }`
        };        
}