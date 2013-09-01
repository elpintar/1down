/*
    Carnegie Mellon 15-237 Project 1
    1-Down
    Group: Erik Pintar, Connor Brem, Leon Zhang
*/

UP_KEYCODE = 38;
DOWN_KEYCODE = 40;
LEFT_KEYCODE = 37;
RIGHT_KEYCODE = 39;
SPACE_KEYCODE = 32;
R_KEYCODE = 82;
P_KEYCODE = 80;
LEFT_DIR = "L";
RIGHT_DIR = "R";
UP_DIR = "U";
DOWN_DIR = "D";

/** util_getEventKeycode(event) -> Number

returns the keycode of the given event in a more cross-browser compatible way
**/
function util_getKeyCode(e){
    return (e.key) ? e.key : e.keyCode;
}

/** util_isPageMoveKeyCode(Number) -> Boolean

checks if this is a key that would move the page when focused on the canvas
**/
function util_isPageMoveKeyCode(keyCode){
    var movementKeys = [UP_KEYCODE, DOWN_KEYCODE, LEFT_KEYCODE,
                        RIGHT_KEYCODE, SPACE_KEYCODE];
    var keyDict = {};
    movementKeys.forEach(function(kc){
        keyDict[kc] = true;
    });
    return keyDict[keyCode] !== undefined;
}

/** util_keyInDict(key type, dictionary) -> Boolean

checks if the given key exists in the given dictionary
**/
function util_keyInDict(key, dict){
    return dict[key] !== undefined;
}

//generates a random integer.
//lower bound is inclusive, upper bound is exclusive.
function randomInt(bound1, bound2) {
    var lo = Math.min(bound1, bound2);
    var hi = Math.max(bound1, bound2);
    var rand = lo + Math.floor(Math.random()*(hi - lo));
    if(rand === hi)
        //this is highly unlikely, maybe impossible
        return randomInt(bound1, bound2);
    else
        return rand;
}

//randomly chooses an element from an array
function randomChoice (a) {
    return a[randomInt(0, a.length)];
}

//returns true with probability 1/x
function randomChance(x) {
    return (0 === randomInt(0, x));
}

//return a random hexidecimal color
function randomColor() {
    return {red : randomInt(0x10, 0xFF), 
            blue : randomInt(0x10, 0xFF),
            green : randomInt(0x10, 0xFF)};
}