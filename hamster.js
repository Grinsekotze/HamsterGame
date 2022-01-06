const cvs = document.getElementById("hamsterGame");
const ctx = cvs.getContext("2d");

// create the unit
const tile = 32;

// load images
const hamsterImg = new Image();
hamsterImg.src = "img/hamster.png";
const kloImg = new Image();
kloImg.src = "img/klopapier.png";
const dudeImg = new Image();
dudeImg.src = "img/dude.png"

let level = [
    "XXXXXXXXXXXXXXXXXXXX",
    "X...X...X...X...X..X",
    "X...X...X...X...X..X",
    "X...X...X...X...X..X",
    "X...X...XXXXX...X..X",
    "X...X...X...X...X..X",
    "XXXXXXXXX...X...XXXX",
    "X...X...X...X...X..X",
    "X...X...X...X...X..X",
    "X...XXXXX...X...X..X",
    "XXXXX...XXXXX...X..X",
    "X...X...X...X...X..X",
    "X...X...X...X...X..X",
    "X...XXXXX...X...X..X",
    "X...X.......X...X..X",
    "X...X.......X...X..X",
    "XXXXXXXXXXXXXXXXXXXX",
]

let gameWidth = level[0].length;
let gameHeight = level.length;
let diff = 3; //difficulty

function collision(x1, y1, x2, y2, r) {
    return (Math.abs(x1-x2) + Math.abs(y1-y2) < r);
}

class agent {

    constructor(x, y, cd, rd, spd, img){
        this.x = x;
        this.y = y;
        this.cur_d = cd;
        this.req_d = rd;
        this.img = img;
        this.speed = spd;
        this.xtile = Math.floor(this.x / tile);
        this.ytile = Math.floor(this.y / tile);
        this.xoff = this.x - tile*this.xtile;
        this.yoff = this.y - tile*this.ytile;
    }

    secondhalf() { //determines if the agent a is already past the midpoint of its current tile
        return ((this.cur_d == "LEFT"  && this.xoff <= 0) ||
                (this.cur_d == "UP"    && this.yoff <= 0) ||
                (this.cur_d == "RIGHT" && this.xoff >= 0) ||
                (this.cur_d == "DOWN"  && this.yoff >= 0));
    }

    checkfree(dir) {
        if(this.dir == "STOP") return true;
    
        if((dir == "LEFT"  && this.xtile == 0) ||
           (dir == "UP"    && this.ytile == 0) ||
           (dir == "RIGHT" && this.xtile == gameWidth-1) ||
           (dir == "DOWN"  && this.ytile == gameHeight-1)){
            return false;
        }
    
        return((dir == "LEFT"  && level[this.ytile][this.xtile-1] == "X") ||
               (dir == "UP"    && level[this.ytile-1][this.xtile] == "X") ||
               (dir == "RIGHT" && level[this.ytile][this.xtile+1] == "X") ||
               (dir == "DOWN"  && level[this.ytile+1][this.xtile] == "X"));
    }

    trychange() { //attempts to change the agent's direction to req_d if the level allows it.
        if(this.checkfree(this.req_d)) this.cur_d = this.req_d;
    }

    update(delta) {
    
        // move
        this.xtile = Math.floor(this.x/tile);
        this.ytile = Math.floor(this.y/tile);
        this.xoff = this.x - (this.xtile*tile + tile/2);
        this.yoff = this.y - (this.ytile*tile + tile/2);
        
        if(this.req_d != this.cur_d){
            
            //Turning 180 happens instantly
            if((this.cur_d == "LEFT" && this.req_d == "RIGHT") ||
               (this.cur_d == "RIGHT" && this.req_d == "LEFT") ||
               (this.cur_d == "UP" && this.req_d == "DOWN") ||
               (this.cur_d == "DOWN" && this.req_d == "UP")){
                this.trychange();
            }

            if(this.secondhalf() || this.cur_d == "STOP"){
                this.trychange();
            } 
        }

        if(this.secondhalf() && !this.checkfree(this.cur_d)){
            if(this.cur_d == "LEFT" || this.cur_d == "RIGHT") this.x = this.xtile*tile + tile/2;
            if(this.cur_d == "UP" || this.cur_d == "DOWN") this.y = this.ytile*tile + tile/2;
            this.cur_d = "STOP";
        }

        if(this.cur_d == "LEFT" || this.cur_d == "RIGHT") this.y = this.ytile*tile + tile/2;
        if(this.cur_d == "UP" || this.cur_d == "DOWN") this.x = this.xtile*tile + tile/2;

        let dist = delta*this.speed*tile;
        if( this.cur_d == "LEFT") this.x -= dist;
        if( this.cur_d == "UP") this.y -= dist;
        if( this.cur_d == "RIGHT") this.x += dist;
        if( this.cur_d == "DOWN") this.y += dist;

    }

    draw() {
        ctx.drawImage(this.img, this.x - tile/2, this.y - tile/2, tile, tile);
    }

}

function animate(a, delta) {
    if(Math.random() < delta || a.cur_d == "STOP") { //on average once per second, or when they are stopped
        let temp = 4*Math.random();
        if(temp < 1){
            a.req_d = "LEFT";
        } else if(temp < 2){
            a.req_d = "UP";
        } else if(temp < 3){
            a.req_d = "RIGHT";
        } else {
            a.req_d = "DOWN";
        }
    }
}

let score, gameOver, dead, agents, enemies, hamster, papier

function reset(number, speed){
    score = 0;
    gameOver = false;
    dead = false;

    agents = [];
    enemies = [];

    hamster = new agent(tile/2, tile/2, "STOP", "STOP", 5, hamsterImg);
    if(diff+1 > hamster.speed) hamster.speed = diff+1;
    agents.push(hamster);

    for(let i = 0; i < number; i++){
        let x, y;
        do {
            x = 5 + Math.floor(Math.random()*(gameWidth-5));
            y = 5 + Math.floor(Math.random()*(gameHeight-5));    
        } while (level[y][x] != "X")
        let dude = new agent(x*tile + tile/2, y*tile + tile/2, "STOP", "STOP", speed, dudeImg);
        agents.push(dude);
        enemies.push(dude);
    }

    //Klopapier
    papier = [];

    for(let row = 0; row < level.length; row++){
        for(let col = 0; col < level[row].length; col++){
            if(level[row][col] == "X"){
                let temp = {
                    x : tile * col + tile/2,
                    y : tile * row + tile/2
                }
                papier.push(temp);
            }
        }
    }
}

reset(3, 4);

document.addEventListener("keydown", direction);

function direction(event){
    let key = event.keyCode;
    if(key == 37){
        hamster.req_d = "LEFT";
    } else if(key == 38){
        hamster.req_d = "UP";
    } else if(key == 39){
        hamster.req_d = "RIGHT";
    } else if(key == 40){
        hamster.req_d = "DOWN";
    } else if(key == 32){ //Space
        hamster.req_d = "STOP";
    } else if(key == 65){ //A
        diff--;
        reset(diff, diff+1)
    } else if(key == 83){ //S
        diff++;
        reset(diff, diff+1)
    } else if(key == 13){ //Enter
        if(gameOver){
            if(!dead) diff++;
            reset(diff, diff+1);
        }
    }
}

// draw everything to the canvas

let lastLoop = new Date();

function draw(){
    
    var thisLoop = new Date();
    var delta = (thisLoop - lastLoop)/1000;
    lastLoop = thisLoop;

    ctx.fillStyle = "black";
    ctx.fillRect(0,0,720,720);
    
    //draw level
    for(let row = 0; row < level.length; row++){
        for(let col = 0; col < level[row].length; col++){
            ctx.fillStyle = (level[row][col] == "X") ? "white" : "black";
            ctx.fillRect(col*tile, row*tile, tile, tile);
        }
    }

    //draw klopapier
    for(let i = 0; i < papier.length; i++){
        ctx.drawImage(kloImg, papier[i].x - tile/2, papier[i].y - tile/2, tile, tile);
        if(collision(hamster.x, hamster.y, papier[i].x, papier[i].y, tile/2)){
            score++;
            papier.splice(i, 1);
            i -= 1;
        }
    }
    if(papier.length == 0){
        gameOver = true;
        dead = false;
    }
    
    for(let i = 0; i < enemies.length; i++){
        animate(enemies[i], delta);

        if(collision(hamster.x, hamster.y, enemies[i].x, enemies[i].y, 0.7*tile)){
            gameOver = true;
            dead = true;
        }
    }

    for(let i = 0; i < agents.length; i++){
        if(!gameOver) agents[i].update(delta);
        agents[i].draw();
    }

    ctx.fillStyle = "white";
    ctx.font = "24px Comic Sans MS";
    ctx.fillText("Score: " + score, 2*tile, (gameHeight+1)*tile);
    ctx.fillText("Difficulty: " + diff, (gameWidth-5)*tile, (gameHeight+1)*tile);
    ctx.fillText("Change diffulty with A/S keys", 8*tile, (gameHeight+2)*tile);

    if(gameOver){
        ctx.fillStyle = "black";
        ctx.fillRect(2*tile,(gameHeight+1)*tile, 20*tile, 2*tile);
        if(dead){
            ctx.fillStyle = "red";
            ctx.fillText("GAME OVER", 2*tile, (gameHeight+2)*tile);
        }
        else{
            ctx.fillStyle = "green";
            ctx.fillText("LEVEL COMPLETE", 2*tile, (gameHeight+2)*tile);
        }
        ctx.fillText("Press ENTER to continue", 11*tile, (gameHeight+2)*tile);
    }

}

// call draw function every 50 ms

let game = setInterval(draw, 15);