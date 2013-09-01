/*
Interface:
    Properties:
        * this.spritesOnScreen: an array of all EnvBlock objects currently
        being stored
        * this.timeToNextGap: cycles until next gap is created in creation
        zone (at game.width past the right side of the screen)

    Methods:
        * this.init: initialize a new stage
        * this.update: update a stage after the screen has moved
        * this.draw: draw all environment elements in a stage

TODO:
  * randomize image associated with blocks, pipes, etc at start of level
  * add changing ground height -- store ground offset in a variable so Leon
  can use it
*/

//constructor for EnvBlock objects, which build the environment
function EnvBlock (name, x, y, level, width, height,  necessary, collidable,
                   drawable, harmful) {
    assert(typeof(width) === "number" && width > 0,
           "invalid width for EnvBlock "+name);
    assert(typeof(height) === "number" && height > 0,
           "invalid height for EnvBlock "+name);
    this.img = new SpriteImage(name);
    if(this.img.hasAnimation("chomping")){
        this.img.switchAnimation("chomping");
    }
    this.name = name;
    this.x = x;
    this.y = y;
    this.level = level;
    this.necessary = necessary;
    this.collidable = collidable;
    this.drawable = drawable;
    this.harmful = harmful;
    this.width = width;
    this.height = height;
}

function Environment () {
    var self = this;

    this.spritesOnScreen; //lists of sprites currently on the screen
    this.bgColor;
    this.timeToNextGap; //time until setNextGap is turned on
    this.groundHeight;
    
    var drawGap; //boolean which determines whether gap should be
                 //currently drawn
    var gapLeft;  //once setNextGap is on, time for which gap continues
                  //to be drawn
    var plants; // should piranha plants be drawn in the holes?

    //options for sprites on the top and bottom of the screen.
    //also, sprites which must be drawn (e.g. sky, grass)
    var spriteChoices = [
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -7, necessary : true, collidable : true,  width : 32,
         height : 32, y : 224},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -6, necessary : true, collidable : true,  width : 32,
         height : 32, y : 192},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -5, necessary : true, collidable : true,  width : 32,
         height : 32, y : 160},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -4, necessary : true, collidable : true,  width : 32, 
         height : 32, y : 128},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -3, necessary : true, collidable : true,  width : 32, 
         height : 32, y : 96},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -2, necessary : true, collidable : true,  width : 32,
         height : 32, y : 64},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : -1, necessary : true, collidable : true,  width : 32,
         height : 32, y : 32},
        {name : undefined,
         nameOptions : ["groundBlock", "groundBlock_blue",
                        "groundBlock_white", "groundBlock_green"],
         level : 0, necessary : true, collidable : true,  width : 32,
         height : 32, y : 0},
        {name : undefined, nameOptions : ["bush"],
         level : 1, necessary : false, collidable : false, width : 96,
         height : 32, y : -32, startChance : 2, followChance : 1.5},
        {name : undefined,
         nameOptions : ["pipe", "pipe_orange", "pipe_white", "pipe_purple"],
         level : 2, necessary : false, collidable : true,  width : 64,
         height : 64, y : -64, startChance : 8, followChance : 8},
        {name : undefined,
         nameOptions : ["brickBlock", "brickBlock_white",
                        "brickBlock_blue", "brickBlock_green"],
         level : 3, necessary : false, collidable : true,  width : 32,
         height : 32, y : -172, startChance : 4, followChance : 1.3},
        {name : undefined,
         nameOptions : ["cloudPlatform", "mushPlatform_green",
                        "mushPlatform_orange", "mushPlatform_white",
                        "mushPlatform_purple"],
         level : 4, necessary : false, collidable : true,  width : 96,
         height : 32, y : -272, startChance : 4, followChance : 1.3},
        {name : undefined, nameOptions : ["cloud"],
         level : 5, necessary : false, collidable : false, width : 96,
         height : 64, y : -372, startChance : 4, followchance : 2}
    ];

    //moves all EnvBlocks in a by a given distance
    var moveEnvBlocks = function (a, distX, distY) {
        for (var i = 0; i < a.length; i++){
            a[i].x += distX;
            a[i].y += distY;
        }    
    };

    //initialize the environment, with "below" determining how far beneath
    //the current top of the screen the top of the environment is located.
    //normal is a boolean which determines whether defaults are used.
    this.init = function (game, below, normal) {
        this.spritesOnScreen = [];
        this.timeToNextGap = 0;
        this.groundHeight = 472;

        gapLeft = 0;
        drawGap = false;
        plants = true;

        //randomly pick background color if !normal
        this.bgColor = (normal) ? {red : 0x93, green : 0xb3, blue : 0xff} :
                                  randomColor();

        //randomly pick block colors.
        //to ensure that all groundBlocks get same color, pick this first
        //and apply it to all blocks identified as groundBlocks.
        var groundBlockChoice = randomChoice(spriteChoices[0].nameOptions);
        for (var i = 0; i < spriteChoices.length; i++) {
            var sprite = spriteChoices[i];
            if(normal) {
                //choose default
                sprite.name = sprite.nameOptions[0];
            } else {
                //choose randomly
                sprite.name = (sprite.nameOptions[0] === "groundBlock") ?
                              groundBlockChoice :
                              randomChoice(sprite.nameOptions);
            }
        }
        
        //fill map with necessary sprites
        for (var i = 0; i < spriteChoices.length; i++) {
            var choice = spriteChoices[i];
            if (choice.necessary) {
                addNecessarySprite(choice, game.width, this.spritesOnScreen,
                                   drawGap);
            } else {
                addNonNecessarySprite(choice, game.width, this.spritesOnScreen,
                                      drawGap, true, game.scrollX);
            }
        }

        //possibly shift blocks down so they don't appear on screen
        moveEnvBlocks(this.spritesOnScreen, 0, below);
    };

    this.draw = function (ctx, game) {
        //draw background
        ctx.fillStyle = ("#"+(this.bgColor.red.toString(16))+
                        (this.bgColor.green.toString(16))+
                        this.bgColor.blue.toString(16));
        ctx.fillRect(0,0, game.width, game.height);

        var drawEnvBlockArray = function (a) {
            //first pass: draw neccesary
            for (var i = 0; i < a.length; i++) {
                var envBlock = a[i];
                if(envBlock.drawable && envBlock.necessary) {
                    envBlock.img.drawTo(ctx, envBlock.x, envBlock.y,
                                        envBlock.width, envBlock.height);
                    if((game.gameOver || game.gamePaused) === false){
                        envBlock.img.nextFrame();
                    }
                }
            }
            //second pass : draw nonNeccesary, to make sure they're in front
            for (var i = 0; i < a.length; i++) {
                var envBlock = a[i];
                if(envBlock.drawable && !envBlock.necessary) {
                    envBlock.img.drawTo(ctx, envBlock.x, envBlock.y,
                                        envBlock.width, envBlock.height);
                    if((game.gameOver || game.gamePaused) === false){
                        envBlock.img.nextFrame();
                    }
                }
            }
        };

        //draw sprites
        drawEnvBlockArray(this.spritesOnScreen);
    };

    //prune off-screen sprites from a sprite array.
    //takes advantage of the sprite array invariant
    //(i.e. sprite arrays are sorted by x-coordinate of right side)
    var pruneSprites = function (spritesOnScreen, worldWidth) {
        var newSpritesOnScreen = [];
        for (var i = 0; i < spritesOnScreen.length; i++) {
            var sprite = spritesOnScreen[i];
            //test for sidescrolling objects and upward objects
            if ((sprite.x + sprite.width) > 0
               && (sprite.y + sprite.height) > 0)
                newSpritesOnScreen.push(sprite);
        }
        self.spritesOnScreen = newSpritesOnScreen;
        //console.log("length: ", self.spritesOnScreen.length);
    };

    //Adds enough new sprites on a given level to span the screen. 
    //Unlike addNecessarySprite, sprite choice is random,
    //and sprites may not be drawn at some locations.
    //adds sprites to spritesOnscreen in the specified level.
    //worldX is the absolutes width of the screen, and gameWidth is its width.
    //onScreen is a boolean which determines whether EnvBlocks can be created
    //if they are in a position that is currently on the screen
    var addNonNecessarySprite = function (choice, gameWidth, spritesOnScreen,
                                          drawGap, onScreen, gameSpeed) {
                                          
        //ensure that all objects created will be off screen
        var furthestRight = (onScreen) ? 0 : gameWidth;

        //is the furthest right EnvBlock on this level drawn? used for
        //stringing
        var furthestRightDrawn = false;

        //determine how much space there is on this level
        for (var i = 0; i < spritesOnScreen.length; i++) {
            var envBlock = spritesOnScreen[i];
            var rightSide = envBlock.x + envBlock.width;
            if (envBlock.necessary === false
               && envBlock.level === choice.level
               && rightSide > furthestRight) {
                furthestRight = rightSide;
                furthestRightDrawn = envBlock.drawable;
            }
        }

        while(furthestRight < 2 * gameWidth) {
            var collidable,
                drawable;

            var chance = (furthestRightDrawn) ? choice.followChance :
                                                choice.startChance;
            if (randomChance(chance)
               && !drawGap
               && furthestRight + choice.width
                  < 2 * gameWidth - gameSpeed * self.timeToNextGap) {
                //if a gap is not currently being drawn
                //and the edge of the sprite to be drawn will not extend into
                //the next gap
                collidable = choice.collidable;
                drawable = true;
            } else {
                //the sprite only takes up space and is not drawn
                collidable = false;
                drawable = false;
            }

            var newSprite =
                new EnvBlock(choice.name, furthestRight, 
                             self.groundHeight + choice.y,
                             choice.level, choice.width, choice.height,
                             choice.necessary, collidable, drawable, false);
            furthestRight += newSprite.width;
            spritesOnScreen.push(newSprite);
        }
    };

    //span the screen with instances of a necessary sprite.
    var addNecessarySprite = function (choice, gameWidth, spritesOnScreen,
                                       drawGap) {

        //determine how much screen space of the necessary sprite is missing
        var furthestRight = 0; //right side of furthest right sprite
        for (var i = 0; i < spritesOnScreen.length; i++) {
            var envBlock = spritesOnScreen[i];
            if (envBlock.name === choice.name && 
                envBlock.level === choice.level) {
                furthestRight = envBlock.x + envBlock.width;
            }
        }

        //fill that screen space with an appropriate number of instances
        //of the necessary sprite
        while (furthestRight < 2 * gameWidth) {
            var collidable,
                drawable,
                name;
            if (drawGap) {
                if (choice.level === 0 && plants) {
                    //draw a piranha plant over the gap
                    var pirhanaPlant = 
                        new EnvBlock("piranhaPlant", furthestRight, 520,
                                     0, 32, 48, false, true, true, true); 
                    spritesOnScreen.push(pirhanaPlant);
                    var plantBlock =
                        new EnvBlock(spriteChoices[4].name, furthestRight, 568,
                                     0, 32, 32, false, true, true, false); 
                    spritesOnScreen.push(plantBlock);
                }
                collidable = false;
                drawable = false;
            } else {
                collidable = choice.collidable;
                drawable = true;
            }

            var newSprite = 
                new EnvBlock(choice.name, furthestRight, 
                             self.groundHeight + choice.y,
                             choice.level, choice.width, choice.height,
                             choice.necessary, collidable, drawable, false);
            spritesOnScreen.push(newSprite);
            furthestRight += newSprite.width;
        }
    };

    //takes the x-coordinate of the screen's sides in world coordinates.
    //note that these should be the NEW side coordinates.
    this.update = function (game) {
        // gap drawing
        var manageGaps = function () {
            if (drawGap) {
                //if gap drawing is on
                if (gapLeft > 0) {
                    gapLeft--;
                } else {
                    //time to turn gap drawing off
                    drawGap = false;
                    plants = true;
                    self.timeToNextGap = randomInt(50, 100);
                    self.groundHeight = randomInt(344, 504);
                }
            } else {
                //if not currently drawing a gap
                if (self.timeToNextGap > 0) {
                    if (game.transitionDrop) {
                        plants = false;
                        //console.log("MADE BIG GAP");
                        //force gap to appear soon
                        self.timeToNextGap = 0;
                        gapLeft = randomInt(49,54);
                        game.transitionDrop = false;
                        drawGap = true;
                    } else {
                        self.timeToNextGap--;
                    }
                } else {
                    //time to turn gap drawing on
                    drawGap = true;
                    gapLeft = randomInt(20, 30);
                }

            }
        };
        manageGaps();

        //shift all EnvBlocks
        moveEnvBlocks(this.spritesOnScreen, game.scrollX, game.scrollY);

        //remove elements which have moved off left side
        pruneSprites(this.spritesOnScreen, game.width);

        if (!game.falling) {
            //add in necessary sprites
            for (var i = 0; i < spriteChoices.length; i++) {
                var choice = spriteChoices[i];
                if (choice.necessary){
                    addNecessarySprite(choice, game.width, 
                                       this.spritesOnScreen, drawGap);
                } else {
                    addNonNecessarySprite(choice, game.width,
                                          this.spritesOnScreen, drawGap,
                                          false, game.scrollX);
                }
            }
        }

        //check for the whole environment being on screen
        var maxY = 0;
        for (var i = 0; i < this.spritesOnScreen.length; i++) {
            var envBlock = this.spritesOnScreen[i];
            maxY = Math.max(maxY, envBlock.y + envBlock.height);
        }
        if ((game.transitionLand) && (maxY <= game.height)) {
            // console.log("BACK TO PLATFORM TRANSITION!");
            game.scrollX = game.scrollSpeed;
            game.scrollY = 0;
            game.transitionLand = false;
            if (game.falling) game.falling = false;
        }

        if (game.falling) {
            // don't let it get below 16...bad hex error-turns white
            var fadeSpeed = 2;
            if (this.bgColor.red > 15+fadeSpeed) 
                {this.bgColor.red -= fadeSpeed;};
            if (this.bgColor.green > 15+fadeSpeed) 
                {this.bgColor.green -= fadeSpeed;};
            if (this.bgColor.blue > 15+fadeSpeed) 
                {this.bgColor.blue -= fadeSpeed;};
        }
    };
}
