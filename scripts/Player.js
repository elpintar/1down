/*
    Carnegie Mellon 15-237 Project 1
    1-Down
    Group: Erik Pintar, Connor Brem, Leon Zhang
*/

/** Player(Number, Number, Number, Number)

params:
    x           the x-coordinate of the player, relative to the canvas
    y           the y-coordinate of the player, relative to the canvas
    width       the width of the player, as displayed on the canvas
    height      the height of the player, as displayed on the canvas
**/
function Player(){
    this._init = function(x, y, width, height){
        console.log("initializing", this);
        
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = new SpriteImage('mario');
        
        this.velX = 0;
        this.velY = 0;
        this.accelX = 0;
        
        this.gravAccel = 3;
        this.accelY = this.gravAccel;
        
        this.maxVelX = 11;
        this.maxVelX = Math.abs(this.maxVelX);
        this.maxUpVel = 18;
        this.maxDownVel = this.maxUpVel*(3/4);
        
        this._accelRate = 2;
        this._decelRate = this._accelRate/3;
        
        this._facing = RIGHT_DIR;
        this._canStartJump = true;
        this._canContinueJump = true;
    };
    
    /** Player.draw(canvas context) -> () 
    **/
    this.draw = function(ctx){
        this.sprite.drawTo(ctx, this.x, this.y, this.width, this.height);
    };
    
    /** Player.switchAnimation(String, Boolean) -> ()
    simply a wrapper to call the stored SpriteImage's method
    **/
    this.switchAnimation = function(animName, forceRestart){
        this.sprite.switchAnimation(animName, forceRestart);
    }
    
    this.getFacingDirName = function(){ 
        return (this._facing == LEFT_DIR) ? "left" : "right";
    }
    
    /** Player._constrainVelocities() -> ()
    **/
    this._constrainVelocities = function(){
        // constrain velocities
        this.velX = Math.min(this.maxVelX, Math.max(-this.maxVelX, this.velX));
        this.velY = Math.min(this.maxDownVel, Math.max(-this.maxUpVel, this.velY));
    }
    
    /** Player._updateVelocity() -> ()
    **/
    this._updateVelocity = function(){
        this.velX += this.accelX;
        this.velY += this.accelY;
        this._constrainVelocities();
    };
    
    this._constrainPositions = function(game){
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        
        if (this.x + this.width > game.width)
            {this.x = game.width-this.width;}
        if (game.falling) {
            if (this.x + this.width > game.width)
                {this.x = game.width-this.width;}
            if (this.x < 0)
                {this.x = 0;}
            if (this.y + this.height > game.height)
                {this.y = game.height-this.height;}
            if (this.y + this.height < 0)
                {game.gameOver = true;}
        }
    }
    
    /** Player._updatePos(game instance) -> ()
    **/
    this._updatePos = function(game){
        this.x += this.velX;
        // scroll with screen
        this.x += game.scrollX;
        
        this.y += this.velY;
        this.y += game.scrollY;
        
        this._constrainPositions(game);
    }
    
    /** Player._applyDecelX() -> ()
    **/
    this._applyDecelX = function(){
        // to prevent problem of constantly hovering around 0 due to float nums
        var stopBufferX = this._decelRate; 
        // if currently moving right
        if (this.velX > stopBufferX){
            this.accelX = -this._decelRate;
        }
        // if currently moving left
        else if (this.velX < -stopBufferX){
            this.accelX = this._decelRate;
        }
        else{
            this.accelX = this.velX = 0;
        }
    }

    this._applyDecelY = function(){
        // to prevent problem of constantly hovering around 0 due to float nums
        var stopBufferY = 10 + this._decelRate; 
        // if currently moving right
        if (this.velY > stopBufferY){
            this.accelY = -this._decelRate;
        }
        // if currently moving left
        else if (this.velY < -stopBufferY){
            this.accelY = this._decelRate;
        }
        else{
            this.accelY = 0;
            this.velY = 10;
        }
    }    
    
    this._updateMovementAnim = function(game){
        var dirName = (this._facing === LEFT_DIR) ? "left" : "right";
        var baseAnimName;
        if (game.falling || game.gameOver) {
            baseAnimName = "fall";
        }
        else if(this._canStartJump === false){
            baseAnimName = "jump";
        }
        else if(this.velX !== 0){
            baseAnimName = "run";
        }
        else{
            baseAnimName = "stand";
        }
        
        if (!game.falling) {var fullAnimName = baseAnimName + "_" + dirName;}
        else {var fullAnimName = baseAnimName;}
        this.switchAnimation(fullAnimName);
    }
    
    this.killDownwardMomentum = function(){
        // kill falling momentum to 
        // prevent player from shooting into ground when walking off surfaces
        // (remember positive y coordinates move down)
        this.velY = Math.min(this.velY, 0);
    }
    
    this.resetJump = function(){
        this._canStartJump = true;
        this._canContinueJump = true;
    }
    
    this.abortJump = function(){
        this._canStartJump = false;
        this._canContinueJump = false;
        
        // kill upwards momentum (remember positive y coordinates move down)
        this.velY = Math.max(this.velY, 0);
    }
    
    /** Player.update(Array, dictionary) -> ()
    **/
    this.update = function(game, mousePresses, heldKeys){
        var holdingLeft = util_keyInDict(LEFT_KEYCODE, heldKeys);
        var holdingRight = util_keyInDict(RIGHT_KEYCODE, heldKeys);
        var holdingSpace = util_keyInDict(SPACE_KEYCODE, heldKeys);
        // up and down for falling mode
        var holdingUp = util_keyInDict(UP_KEYCODE, heldKeys);
        var holdingDown = util_keyInDict(DOWN_KEYCODE, heldKeys);
        if (game.falling) {
            this.maxUpVel = 0;
            this.maxDownVel = 20;
        }
        else {
            this.maxUpVel = 24;
            this.maxDownVel = this.maxUpVel*(3/4);
            this.accelY = this.gravAccel;
        }
        // what to do for each key
        if(holdingLeft === holdingRight){
            this._applyDecelX();
        }
        else if(holdingLeft){
            this.accelX = -this._accelRate;
            this._facing = LEFT_DIR;
        }
        else if(holdingRight){
            this.accelX = this._accelRate;
            this._facing = RIGHT_DIR;
        }
        if (game.falling) {
            if (holdingUp === holdingDown){
                this._applyDecelY();
            }
            else if (holdingUp){// && game.falling) {
                this.accelY = -this._accelRate;
            }
            else if (holdingDown){// && game.falling) {
                this.accelY = this._accelRate;
            }
        }
        
        if(holdingSpace && !game.falling){
            if(this._canStartJump){
                // provide jump boost
                this.velY = -this.maxUpVel;
                this._canStartJump = false;
            }
            else if(this._canContinueJump){
                // counteract some of gravity to implement controllable ascent
                this.velY -= this.gravAccel*(1/2);
            }
        }
    
        this._updateMovementAnim(game);
        this._updateVelocity();

        // when player doesn't have control
        // beginning to fall, move player to the middle of the screen
        if (game.startFallingCount > 0) {
            game.startFallingCount--;
            this.velY -= 2;
        }
        
        this._updatePos(game);
        this.sprite.nextFrame();

        // gameOver is triggered by falling down or going past left side
        if (this.x + this.width < 0){
            game.gameOver = true;
        }
        // set as false and wait for collision to reset jump
        this._canStartJump = false;
    };
    
    this._init.apply(this, arguments);
};
