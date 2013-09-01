function startGame(){
    console.log('starting game with src data:', SpriteImage.sourcesData);
    var game = new Game();
    game.run();
}


function runPreloader(){
    preloadImages(startGame);
}

/** preloadImages: (callback function:(no params))

 grabs the source image data stored in the SpriteImage class and preloads the
 indicated images by creating new Images and storing them back in the sourcedata
 
 params: 
    loadedCallback       the function to call once al images are preloaded
**/
function preloadImages(loadedCallback){
    var srcData = SpriteImage.sourcesData;
    
    // the human readable nicknames of the images we will be preloading
    var imageNames = srcData["nicknames"];
    var totalToPreload = imageNames.length;
    var numLoadedSoFar = 0;
    var imgObj, imgNickname;
    
    for (var i = 0; i < imageNames.length; i++){
        imgNickname = imageNames[i];
        assert(srcData[imgNickname] !== undefined, 
               "invalid nickname '" + imgNickname + "' in preloader, "+
               "check that your nicknames is in the source data's keys");
        assert(srcData[imgNickname].srcPath !== undefined, 
               "srcPath not set for" + imgNickname);
               
        imgObj = new Image();
        imgObj.onload = function(){
            numLoadedSoFar++;
            console.log("loaded", this);
            // if all images are loaded, call the callback
            if(numLoadedSoFar >= totalToPreload){
                // make sure every source has a stored Image object
                imageNames.forEach(function(imgName){
                    assert(srcData[imgName]["imgObj"] !== undefined, 
                           "preloader problem, missing Image object for "+
                           imgName
                           );
                });
                
                loadedCallback();
            }
        }
        imgObj.src = srcData[imgNickname].srcPath;
        
        // save the Image object back in the srcData to avoid having 
        // to repeatedly construct Images when creating SpriteImages
        // will be fully loaded by the time the loadedCallback finally fires
        srcData[imgNickname]["imgObj"] = imgObj;
    }
}

//the main Game object.
//the method is Game.run, which starts the game.
function Game() {
    var self = this;

    var _gameFps = 30;
    var environment,
        player,
        collisions,
        allEnemies,
        canvas,
        ctx,
        clicks,
        heldKeys;
        //add more objects here
    var pauseSprite;
    var titleSprites;
    this.width;
    this.height;
    this.worldX;
    this.worldY;
    this.speed;
    this.gamePaused;
    this.gameOver;
    this.atTitle;
    this.time;
    this.transitionDrop;
    this.transitionLand;
    this.nextTransition;
    this.falling;
    this.scrollSpeed;
    this._nextEnemyDelayCountdown; // how many frames until the next enemy
    this.mushroomCount;

    // get a random number of frames to wait until next enemy
    var _regenNextEnemyDelay = function(self){
        var minDist = 10;
        var maxDist = self.width;
        var distanceToNextEnemy = randomInt(minDist, maxDist);
        return Math.max(0,Math.ceil(distanceToNextEnemy / Math.abs(self.scrollSpeed)));
    }
    
    var updateModel = function () {
        //clear clicks, but don't clear the held keys
        clicks = [];
        if(self.atTitle === true){
            return;
        }
        // update player, environment, and collisions!
        if(!(self.gamePaused) && !(self.gameOver)){
            // spawn new enemies
            if (!self.falling){
                self._nextEnemyDelayCountdown--;
                if(self._nextEnemyDelayCountdown <= 0){
                   self._nextEnemyDelayCountdown = _regenNextEnemyDelay(self);
                   var groundHeight = environment.groundHeight;
                   if(Math.random() < 0.4){
                        var randHeight = randomInt(1, groundHeight-50); // hardcoding, eep!
                        allEnemies.addEnemy("bullet_bill", self.width, randHeight);
                   }
                   else{
                        var randHeight = randomInt(groundHeight-275, groundHeight-50); 
                        allEnemies.addEnemy("spiny", self.width, randHeight);
                   }
                }
            }
            
            // update location/velocity/etc data
            player.update(self, clicks, heldKeys); 
            allEnemies.update(self);
            environment.update(self);
            
            // check collisions
            allEnemies.getAllEnemies().forEach(function(enemy){
                collisions.collide(enemy,environment.spritesOnScreen,self); 
            });
            collisions.collide(player,environment.spritesOnScreen,self);
            collisions.collide(player,allEnemies.getAllEnemies(),self);
        }
        else{ 
            pauseSprite.nextFrame();
            self.fallTutorial = false;
        }

        // for timing and score
        if ((!self.gameOver) && (!self.gamePaused)) {
            self.time++;
        }
        // activate TRANSITION
        if (self.time > self.nextTransition) {
            // activate GAP (if X direction is moving, make drop)
            if (self.scrollX !== 0){
                //console.log("GAP TRANSISTION at ", self.time);
                self.transitionDrop = true;
                // this gets overridden when they fall
                // and is a safety in case they don't
                self.nextTransition += 300;
            }
            // activate STOP FALLING when 1down is hit (see collisions)
            else if (self.transitionLand) {
                //console.log("STOP FALLING TRANSISTION at ", self.time);
                self.nextTransition = self.time + randomInt(200,450);
                // increase speed!
                self.scrollSpeed -= 3;
                player.maxVelX += 3;
                //console.log("NEW SPEEDS: player-", player.maxVelX, " level-", -self.scrollSpeed)
                environment.init(self, self.height, false);
                allEnemies._init();
                self.fallTutorial = false;
            }
        }
        // activate FALLING
        if ((!self.falling) && (player.y > 500)) {
           // console.log("FALLING NOW!");
            self.falling = true;
            self.startFallingCount = 40;
            self.scrollX = 0;
            self.scrollY = -10;
            self.nextTransition = self.time + 50;
            if (self.mushroomCount === 0) {
                self.fallTutorial = true;
            }
        }

        // add falling enemies
        if (!self.gamePaused && !self.gameOver && self.falling && !self.transitionLand && (self.startFallingCount < 10)) {
            if ((self.time % 2) < 1) {
                allEnemies.addEnemy("wackyBlock", randomInt(0,1160), 650);}
            if ((self.time % 110) < 1) {
                allEnemies.addEnemy("1down", randomInt(100, 1100), 650);
            }
        }
    };


    // draw title screen when game starts
    var _drawTitleScreen = function(){
        titleSprites.forEach(function(spriteInfo){
            var x = spriteInfo.x;
            var y = spriteInfo.y;
            var sprite = spriteInfo.sprite;
            sprite.drawTo(ctx,x,y);
            sprite.nextFrame();
        });
    }
    
    // split this type of drawing into a HUD object or something
    var _drawPauseScreen = function(){
        ctx.save();
        ctx.fillStyle = "rgba(50, 50, 50, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 60px "Lucida Console", Monaco, monospace';
        ctx.textAlign = "center";
        
        var pauseMetrics = pauseSprite.getCurrFrameMetrics();
        var text = "Paused";
        var textX = (canvas.width - pauseMetrics.width)/2;
        var textY = canvas.height/2;
        
        ctx.fillStyle = "black";
        ctx.fillText(text, textX+1, textY+1);
        ctx.fillStyle = "white";
        ctx.fillText(text, textX, textY);
        ctx.restore();
        
        pauseSprite.drawTo(ctx, textX + pauseMetrics.width + 30, textY - pauseMetrics.height/2); 
    };
    
    var _drawGameOverScreen = function(){
        ctx.save();
        ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 95px "Lucida Console", Monaco, monospace';
        ctx.textAlign = "center";
        
        var bigMsg = "GAME OVER";
        var smallMsg = "Press R to Restart";
        var bigX = canvas.width/2;
        var bigY = canvas.height/2-50;
        var smallX = canvas.width/2;
        var smallY = canvas.height/2+50;
        ctx.fillStyle = "black";
        ctx.fillText(bigMsg, bigX + 1, bigY + 1);
        
        ctx.fillStyle = "red";
        ctx.fillText(bigMsg, bigX, bigY);

        ctx.font = 'bold 45px "Lucida Console", Monaco, monospace';
        ctx.fillStyle = "black";
        ctx.fillText(smallMsg, smallX + 1, smallY + 1);
        
        ctx.fillStyle = "white";
        ctx.fillText(smallMsg, smallX, smallY);

        ctx.restore();
    };

    // draws bar for high score
    var _drawTopBar = function() {
        // make black high score bar on top
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,canvas.width,30);

        // write the score
        ctx.font = 'bold 20px Arial, Monaco, monospace';
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        ctx.fillText("SCORE: ", canvas.width*5/6, 22);
        ctx.textAlign = "right";
        ctx.fillText(String(self.time), canvas.width-10, 22);

        // write 1DOWN count
        ctx.textAlign = "left";
        ctx.fillText("1-DOWNS: ", 10, 22);
        ctx.fillText(String(self.mushroomCount), 120, 22);
    };

    var updateView = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(self.atTitle === true){
            _drawTitleScreen();
            return;
        }
        ctx.save();
        // draw blue background
        ctx.fillStyle = "#9eb3ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        environment.draw(ctx,self);
        allEnemies.draw(ctx);
        player.draw(ctx);
        _drawTopBar();
        
        if (self.gameOver){
            player.switchAnimation("fall");
            _drawGameOverScreen();
        }
        else if(self.gamePaused){
            _drawPauseScreen();
        }
        else if (self.fallTutorial && (self.startFallingCount < 10)) {
            ctx.save();
            tutorialSprite.drawTo(ctx,900,400);
            ctx.restore();
        }
    };

    var cycleLength = Math.max(1, Math.round(1000/_gameFps)); //length of a timer cycle
    var timer = function (){
        updateModel();
        updateView();
        setTimeout(timer, cycleLength);
    };
    
    var onMouseDown = function (e) {
        //react to mouse
        var canvX, canvY;
        canvX = e.pageX - canvas.offsetLeft;
        canvY = e.pageY - canvas.offsetTop;
        //alert("You clicked on the canvas at (" + canvX + ", " + canvY + ").");

        clicks.push(e);
    };

    var onKeyDown = function (e) {
        //react to key
        var keyCode = util_getKeyCode(e);
        //alert("Keycode of the pressed key is " + keyCode);
        
        // prevent webpage from moving while moving player
        if(util_isPageMoveKeyCode(keyCode)){
            e.preventDefault();
        }
        
        heldKeys[keyCode] = true;
        if(keyCode === R_KEYCODE && self.atTitle === false){
            self.initGame();
        }
        else if(keyCode === SPACE_KEYCODE && self.atTitle === true){
            self.initGame();
        }
        else if(keyCode === P_KEYCODE && self.atTitle === false && self.gameOver === false){
            self.gamePaused = !self.gamePaused;
            pauseSprite.switchAnimation("default_static", true);
        }
    };
    
    var onKeyUp = function (e) {
        var keyCode = util_getKeyCode(e);
        
        if(util_isPageMoveKeyCode(keyCode)){
            e.preventDefault();
        }
        
        // remove key
        delete(heldKeys[keyCode]);
    };
    
    this.initTitle = function(){
        this.atTitle = true;
        this.gamePaused = false;
        this.gameOver = false;
        titleSprites = [];
        titleSprites.push({x:0, y:0, sprite:new SpriteImage("titleBackground")});
        var jumpMsgSprite = new SpriteImage("jumpMsg");
        jumpMsgSprite.switchAnimation("flash");
        // mega hard code goooooo
        titleSprites.push({x:575, y:512, sprite:jumpMsgSprite});
    }
    
    this.initGame = function(){
        titleSprites = []
        this.atTitle = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.transitionDrop = false;
        this.transitionLand = false;
        this.nextTransition = 100;
        this.nextEnvironment = 0;
        this.falling = false;
        
        //set game dimensions and speed
        this.worldX = 0;
        this.worldY = 0;
        this.width = 1200;
        this.height = 600;
        this.scrollSpeed = -8;
        this.scrollX = this.scrollSpeed;
        this.scrollY = 0;
        this.time = 0;
        this.mushroomCount = 0;
        
        this._nextEnemyDelayCountdown = 0; //start with enemy on screen
        
        // initialize player
        player = new Player(500, 400, 32, 32);
        player.maxVelX = -this.scrollSpeed+3;
        //initialize environment
        environment = new Environment();
        environment.init(self, 0, true);
        // initialize Collisions
        collisions = new Collisions();
        
        allEnemies = new Enemies();
        
        pauseSprite = new SpriteImage("sleep_render");

        tutorialSprite = new SpriteImage("tutorial");
    }
    
    this.init = function(){
        console.log("reinitializing game");
        // initialize mouse and key event queues
        clicks = [];
        heldKeys = {};
        
        this.initTitle();
    }
    
    /** like Tkinter's run; sets up event handlers etc. **/
    this.run = function () {

        // actually start the game
        console.log('running game; setting up event handlers');
        this.init();
        
        //save reference to canvas and context
        canvas = document.getElementById("gamecanvas");
        ctx = canvas.getContext("2d");

        //initialize event handlers
        canvas.addEventListener("mousedown", onMouseDown, true);
        canvas.addEventListener("keydown", onKeyDown, true);
        canvas.addEventListener("keyup", onKeyUp, true);

        // make canvas focusable, then give it focus!
        canvas.setAttribute('tabindex','0');
        canvas.focus();
        
        // draws the title screen, until user clicks start game
        _drawTitleScreen();

        //the inital call to timer, which will run continuously to update
        //the model and view
        timer();
    };
}
