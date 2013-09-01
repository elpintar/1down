function Enemy(type, x, y){
    this._init = function(type, x, y){
        assert(Enemy.types[type] !== undefined, "Enemy type '"+type+
                "' does not exist, check that Enemy.types is formatted properly");
        this.type = type;
        //console.log("made Enemy:", type, "at", x,y);
        
        var typeData = Enemy.types[type];
        ["spriteName", "width", "height", "flags"].forEach(function(dataParam){
            assert(typeData[dataParam] !== undefined,
                   "missing parameter "+dataParam+"in data for type "+type);
        });
        
        this.x = x;
        this.y = y;
        this.sprite = new SpriteImage(typeData.spriteName);
        this.width = typeData.width;
        this.height = typeData.height;
        
        this.maxVelX = (typeData.maxVelX !== undefined) ? typeData.maxVelX : 2;
        this.maxVelX = Math.abs(this.maxVelX);
        this.maxUpVel = (typeData.maxVelY !== undefined) ? typeData.maxVelY : 17;
        this.maxDownVel = this.maxUpVel*(3/4);
        
        
        this.facing = LEFT_DIR; // overridden in first switch direction call
        this.velX = 0; // overridden in first switch direction call
        this.velY = 0;
        this.accelX = 0;
        this.gravAccel = 3;
        this.accelY = (typeData.flags.has_gravity) ? this.gravAccel : 0;
        
        
        this.alive = true;
        this.exists = true;
        this.collidable = (typeData.flags.collidable) ? true : false;
        this.collidablePlayerOnly = (typeData.flags.collidable_player_only) ? true : false;
        this.harmful = true;

        this.switchDirection(LEFT_DIR);
    }
    
    this.switchDirection = function(newDir){
        // default to simply toggling direction if not given a direction
        if(newDir !== LEFT_DIR && newDir !== RIGHT_DIR){
            newDir = (this.facing === LEFT_DIR) ? RIGHT_DIR : LEFT_DIR;
        }
        this.facing = newDir;
        this.velX = (this.facing === LEFT_DIR) ? -this.maxVelX : this.maxVelX;
    }
    
    this.draw = function(ctx,showDebug){
        this.sprite.drawTo(ctx, this.x, this.y, this.width, this.height, showDebug);
        this.sprite.nextFrame();
    }
    
    this._updateMovementAnim = function(){
        var baseAnim = "walk";
        var dirName = (this.facing === RIGHT_DIR) ? "right" : "left";
        var animName = baseAnim + "_" + dirName;
        if(this.sprite.hasAnimation(animName)){
            this.sprite.switchAnimation(animName);
        }
    }
    
    this._updatePos = function(game){
        this.x += this.velX;
        this.y += this.velY;
        
        this.x += game.scrollX;
        this.y += game.scrollY;
        
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }
    
    this.killDownwardMomentum = function(){
        // kill falling momentum to 
        // prevent player from shooting into ground when walking off surfaces
        // (remember positive y coordinates move down)
        this.velY = Math.min(this.velY, 0);
    }
    
    this._constrainVelocities = function(){
        // constrain velocities
        this.velX = Math.min(this.maxVelX, Math.max(-this.maxVelX, this.velX));
        this.velY = Math.min(this.maxDownVel, Math.max(-this.maxUpVel, this.velY));
    }
    
    this._updateVel = function(game){
        this.velX += this.accelX;
        this.velY += this.accelY;
        
        this._constrainVelocities();
    }
    
    this.update = function(game){
        this._updateVel(game);
        this._updatePos(game);
        
        this._updateMovementAnim();
    }
    
    this._init(type, x, y);
    //this._init.apply(this, arguments); // commented due to hw1 restriction
}

function Enemies(){
    this._init = function(){
        this.enemiesList = [];
    }
    
    this.draw = function(ctx){
        this.enemiesList.forEach(function(enemy){
            enemy.draw(ctx);
        });
    }
    
    this.getAllEnemies = function(){
        return this.enemiesList;
    }
    
    this.pruneEnemies = function(game){
        var preservedEnemies = [];
        var buffer = 50;
        this.enemiesList.forEach(function(enemy){
            if(enemy.exists && 
               -buffer <= enemy.x && enemy.x <= game.width + buffer &&
               -buffer <= enemy.y && enemy.y <= game.height + buffer)
            {
                preservedEnemies.push(enemy);
            }
        });
        this.enemiesList = preservedEnemies;
    }
    
    this.update = function(game){
        this.enemiesList.forEach(function(enemy){
            enemy.update(game);
        });
        this.pruneEnemies(game);
    }
    
    this.addEnemy = function(type, x, y){
        var newEnemy = new Enemy(type, x, y);
        this.enemiesList.push(newEnemy);
    }
    
    this._init();
}


Enemy.types = {
    "spiny":{
        "spriteName": "spiny",
        "width": 28,
        "height": 28,
        "flags":{
            "has_gravity": true,
            // if set to true, enemy will also change directions at walls
            "collidable": true
        }
    },
    "bullet_bill":{
        "spriteName": "bullet_bill",
        "width": 28,
        "height": 20,
        "maxVelX": 5,
        "flags":{
            "collidable_player_only":true
        }
    },
    "wackyBlock":{
        "spriteName": "wackyBlock",
        "width": 32,
        "height": 32,
        "maxVelY": 0,
        "maxVelX": 0,
        "flags":{
            "collidable_player_only":true
        }
    },
    "1down":{
        "spriteName": "1down",
        "width": 48,
        "height": 48,
        "maxVelX": 0,
        "maxVelY": 3,
        "flags":{
            "collidable_player_only":true
        }
    }
}
