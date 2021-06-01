window.addEventListener("load", init);

var canvas = document.getElementById('canvas');
canvas.addEventListener('mousemove', function(evt) {
    let rect = canvas.getBoundingClientRect();
    mouse.x = evt.clientX - rect.left;
    mouse.y = evt.clientY - rect.top;
    if(mouse.x < 930 & mouse.x > 745 & mouse.y < 672 & mouse.y > 620){
        canvas.style.cursor = "pointer";
        return;
    }
    canvas.style.cursor = "default";
    // check if out of game board
    if(mouse.x < 10 || mouse.x > 730 || mouse.y < 10 || mouse.y > 650){
        return;
    }
    let dx = mouse.x - needle.x1;
    let dy = (mouse.y < 640 ? mouse.y : 640) - needle.y1;
    mouse.angle = Math.atan2(dy, dx);
});
canvas.addEventListener("click", fire);

var ctx = canvas.getContext('2d');
var mouse = {x:0,y:0, angle:0};
var needle = {x1:365, y1: 655, x2:0, y2:0};
var action;
var score;
var level;
var numOfShots;
var currentBall;
var nextBall;
var fireBall;
var fireBallAngle;
var popTimer;
let rowFull;
var balls = [];
var ballsToPop = [];

const ballVariants = ["#f22", "#f2f", "#22f", "#2ff", "#2f2", "#ff2", "#c0c0c0"];
const levels = [
    {score:500, threshold:22},
    {score:1000, threshold:20},
    {score:2000, threshold:18},
    {score:3000, threshold:15},
    {score:4500, threshold:12},
    {score:6000, threshold:10},
    {score:8000, threshold:9},
    {score:10000, threshold:8},
    {score:13000, threshold:6},
    {score:16000, threshold:5},
];

class Ball{
    constructor(x, y, color){
        this.x = x;
        this.y = y;
        this.colorIndex = color;
    }
}

function init(){
    action = "wait";
    score = 0;
    level = 0;
    numOfShots = 0;
    currentBall = new Ball(365, 655, rndColorIndex());
    nextBall = new Ball(200, 695, rndColorIndex());
    fireBall = null;
    fireBallAngle = 0;
    popTimer = null;
    balls = [];
    ballsToPop = [];
    /************   init balls  **************/
    /****************************************/
    rowFull = true;
    let tmpx = 45;
    let tmpy = 45;
    for(let i=1; i<30; i++){
        let tmpBall = new Ball(tmpx, tmpy, rndColorIndex());
        balls.push(tmpBall);
        tmpx += 71;
        if(tmpx >= 710){// new row
            tmpy += 58;
            if(rowFull){
                tmpx = 80;
                rowFull = false;
            }else{
                tmpx = 45;
                rowFull = true;
            }
        }
    }

    /************   init frame  **************/
    /****************************************/
    var gradient1 = ctx.createLinearGradient(0, 0, 710, 0);
    gradient1.addColorStop("0", "#6666ff");
    gradient1.addColorStop("0.5", "#66ff66");
    gradient1.addColorStop("1.0", "#ff6666");
    ctx.strokeStyle = gradient1;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 730, 730);

    window.requestAnimationFrame(render);
}




function render(evt){
    ctx.clearRect(10, 10, 920, 720);
    
    /********************************************/
    /***********    Side Menu   *****************/
    /********************************************/
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(730, 0, 220, 740);
    
    // Score
    ctx.font = "30px Verdana";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Score:", 780, 50); 
    ctx.fillStyle = "blue";
    ctx.textAlign = "center";
    ctx.fillText(score, 830, 100); 

    // Level
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Level:", 780, 200); 
    ctx.fillStyle = "blue";
    ctx.textAlign = "center";
    ctx.fillText(level, 830, 250); 

    // Shots
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Shots:", 780, 350); 
    ctx.fillStyle = "blue";
    ctx.textAlign = "center";
    ctx.fillText(numOfShots, 830, 400); 

    // new game button
    ctx.save();
    ctx.shadowBlur = 5;
    //ctx.shadowOffsetX = -5;
    ctx.shadowOffsetY = 5;
    ctx.shadowColor = "black";
    ctx.fillStyle = "blue";
    ctx.fillRect(745, 620, 190, 50);
    ctx.restore();
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("New Game", 842, 655); 

    /********************************************/
    /**********     Aim    **********************/
    /********************************************/
    
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.moveTo(20, 655);
    ctx.lineTo(325, 655);
    ctx.moveTo(405, 655);
    ctx.lineTo(710, 655);
    ctx.strokeStyle = "red";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(365, 655, 40, 3.15, 2 * Math.PI);
    //ctx.strokeStyle = "red";
    ctx.stroke();

    ctx.beginPath();
    //ctx.strokeStyle = 'red';
    ctx.arc(365, 655, 10, 0, Math.PI * 2, true);
    ctx.stroke();
    /********************************************/
    /**********     Needle          *************/
    /********************************************/
    

    needle.x2 = needle.x1 + 80 * Math.cos(mouse.angle);
    needle.y2 = needle.y1 + 80 * Math.sin(mouse.angle);

    ctx.beginPath();
    ctx.moveTo(needle.x1, needle.y1);
    ctx.lineTo(needle.x2, needle.y2);
    ctx.stroke();

    /********************************************/
    /**********     Actions         *************/
    /********************************************/
    switch(action){
        case "superBall":
            fireBall.x += 12  * Math.cos(fireBallAngle);
            fireBall.y += 12 * Math.sin(fireBallAngle);
        
            // bouns of wall
            if(fireBall.x > 685 || fireBall.x < 45){// Wall collision
                fireBallAngle = Math.PI - fireBallAngle;
            }
            // is out of ceiling
            if(fireBall.y <= 0){
                fireBall = null;
                // check if we have more than 3 attached
                if(ballsToPop.length > 0){
                    // detached from ghroup balls
                    checkDetachedBalls();
                    popTimer = 10;
                    action = "pop";
                }else{
                    //reset pop array;
                    ballsToPop = [];
                    if(isTimeToDescent()){
                        action = "initDescent";
                    }else{
                        action = "wait";
                    }
                }
            }else{
                renderBall(fireBall);
                for(let b=0; b<balls.length; b++){
                    //if(balls[b] == fireBall){ continue; }
                    let a = 75;//r1 + r2;
                    let x = fireBall.x - balls[b].x;
                    let y = fireBall.y - balls[b].y;
        
                    if (a > Math.sqrt((x * x) + (y * y))) {// collision
                        score += 10;
                        //ballsToPop.push(balls[b]);
                        findAllAttachedBalls(balls[b]);
                        // remove current ball from ballstopop
                        ballsToPop = ballsToPop.filter(o => o!=balls[b]);
                        // pop current ball
                        balls.splice(balls.indexOf(balls[b]), 1);
                        break;
                    }

                }
            }
        break;
        case "fire":
            fireBall.x += 12  * Math.cos(fireBallAngle);
            fireBall.y += 12 * Math.sin(fireBallAngle);
        
            // bouns of wall
            if(fireBall.x > 685 || fireBall.x < 45){// Wall collision
                fireBallAngle = Math.PI - fireBallAngle;
            }
            // is ceiling
            if(fireBall.y <= 45){
                fireBallAngle = 0;
                fireBall.y = 45;
                // snug to x
                let tmpx = rowFull ? (fireBall.x - 80) % 71 : (fireBall.x - 45) % 71;
                fireBall.x -= tmpx <= 35 ? tmpx : -(70 - tmpx);
                balls.push(new Ball(fireBall.x, fireBall.y, fireBall.colorIndex));
                ballsToPop.push(balls[balls.length-1]);
                findAllAttachedBalls(balls[balls.length-1]);
                fireBall = null;
                // check if we have more than 3 attached
                if(ballsToPop.length >= 3){
                    // detached from ghroup balls
                    checkDetachedBalls();
                    popTimer = 10;
                    action = "pop";
                }else{
                    //reset pop array;
                    ballsToPop = [];
                    if(isTimeToDescent()){
                        action = "initDescent";
                    }else{
                        action = "wait";
                    }
                }
            }else{
                // check balls collision
                let collisionFlag = false;
                for(let b=0; b<balls.length; b++){
                    //if(balls[b] == fireBall){ continue; }
                    let a = 60;//r1 + r2;
                    let x = fireBall.x - balls[b].x;
                    let y = fireBall.y - balls[b].y;
        
                    if (a > Math.sqrt((x * x) + (y * y))) {// collision
                        collisionFlag = true;
                        fireBallAngle = 0;
                        // snug ball Y
                        if(fireBall.y > balls[b].y + 12){
                            // row bellow
                            fireBall.y = balls[b].y + 58;
                            // snug ball X
                            fireBall.x = (fireBall.x > balls[b].x && balls[b].x < 683) ? balls[b].x + 35 : balls[b].x - 35;
                        }else if(fireBall.y > balls[b].y - 12 || balls[b].y == 45){
                            // same row
                            fireBall.y = balls[b].y
                            // snug ball X
                            fireBall.x = (fireBall.x > balls[b].x && balls[b].x < 683) ? balls[b].x + 71 : balls[b].x - 71;

                        }else{
                            // row above
console.log("a");
                            fireBall.y = balls[b].y - 58;
                            // snug ball X
                            fireBall.x = (fireBall.x > balls[b].x && balls[b].x < 683) ?balls[b].x + 35 : balls[b].x - 35;

                        }

                        balls.push(new Ball(fireBall.x, fireBall.y, fireBall.colorIndex));
                        ballsToPop.push(balls[balls.length-1]);
                        findAllAttachedBalls(balls[balls.length-1]);
                        fireBall = null;
                        // check if we have more than 3 attached
                        if(ballsToPop.length >= 3){
                            // detached from ghroup balls
                            checkDetachedBalls();
                            popTimer = 10;
                            action = "pop";
                        }else{
                            //reset pop array;
                            ballsToPop = [];
                            if(balls[balls.length-1].y >= 560){
                                action = "gameOver";
                            }else if(isTimeToDescent()){
                                action = "initDescent";
                            }else{
                                action = "wait";
                            }
                        }

                        break;
                    }
                    if(!collisionFlag){
                        // render fire ball
                        renderBall(fireBall);
                    }else if(action != "pop"){
                        if(isTimeToDescent()){
                            action = "initDescent";
                        }else{
                            action = "wait";
                        }
                    }
                }
                
            }
        break;
        case "pop":
            // increase pop timer
            if(popTimer !== null){
                popTimer -= 1;
            }
            // time to pop ball
            if(popTimer === 0){
                // add score
                score += (10 * ballsToPop.length);
                // check level
                if(levels[level].score <= score){
                    level += 1;
                }
                // select currect ball to pop (remove from ball arr)
                for(let i=0; i<balls.length; i++){
                    //if(balls[i].x == ballsToPop[0].x && balls[i].y == ballsToPop[0].y){
                        if(balls[i] == ballsToPop[0]){
                        balls.splice(i, 1);
                        ballsToPop.splice(0, 1);
                        if(ballsToPop.length == 0){
                            popTimer = null;
                            if(isTimeToDescent()){
                                action = "initDescent";
                            }else{
                                action = "wait";
                            }
                        }else{
                            popTimer = 10;
                        }
                        break;
                    }
                }
            }
        break;
        case "initDescent":
            // add new back row
            let tmpx;
            let tmpy = -15;
            let ballsInRow;
            if(!rowFull){
                tmpx = 80;
                ballsInRow = 9;
                rowFull = true;
            }else{
                tmpx = 45;
                ballsInRow = 10;
                rowFull = false;
            }
            for(let i=0; i<ballsInRow; i++){
                let tmpBall = new Ball(tmpx, tmpy, rndColorIndex());
                balls.unshift(tmpBall);
                tmpx += 71;
            }
            action = "goDescent";
        break;
        case "goDescent":
            let gameOverFlag = false;
            // move all balls down
            for(let i=0; i<balls.length; i++){
                balls[i].y += 3;
                if(balls[i].y >= 577){
                    gameOverFlag = true;
                }
            }
            if(gameOverFlag){
                action = "gameOver";
            }else if(balls[0].y >= 45){
                action = "wait";
            }
        break;
        case "gameOver":
            ctx.font = "150px Verdana";
            var gradient = ctx.createLinearGradient(0, 0, 500, 0);
            gradient.addColorStop("0", "purple");
            gradient.addColorStop("0.25", "blue");
            gradient.addColorStop("0.5", "green");
            gradient.addColorStop("0.75", "yellow");
            gradient.addColorStop("1.0", "red");
            ctx.textAlign = "center";
            ctx.fillStyle = gradient;
            ctx.strokeStyle = "black";
            ctx.strokeText("Game", 396, 254);
            ctx.fillText("Game", 400, 250);
            ctx.strokeText("Over!", 396, 424);
            ctx.fillText("Over!", 400, 420);
        break;
    }






    /********************************************/
    /**********     Render Current Ball    ******/
    /********************************************/
    if(currentBall.x < 365){
        currentBall.x *= 1.1;
        if(currentBall.x > 365){
            currentBall.x = 365;
        }
    }else if(currentBall.y > 655){
        currentBall.y *= 0.98;
        if(currentBall.y < 655){
            currentBall.y = 655;
        }
    }

    renderBall(currentBall);
    
    /********************************************/
    /**********     Render Next Ball    *********/
    /********************************************/
    renderBall(nextBall);
    
    /********************************************/
    /**********     Render Balls    *************/
    /********************************************/
    for(let i=0; i<balls.length; i++){
        renderBall(balls[i]);
    }

    

    window.requestAnimationFrame(render);
}


function renderBall(tball){
    ctx.save();
    grd = ctx.createRadialGradient(tball.x -10, tball.y -13, 1, tball.x, tball.y, 35);
    grd.addColorStop(0, "white" );
    grd.addColorStop(1, ballVariants[tball.colorIndex] );
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-over";
    ctx.arc(tball.x, tball.y, 33, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = ballVariants[tball.colorIndex];
    ctx.stroke(); 
    ctx.restore();
}

function fire(){
    // check if new game button was clicked
    if(mouse.x < 930 & mouse.x > 745 & mouse.y < 672 & mouse.y > 620){
        if(numOfShots != 0 && action != "gameOver"){
            if(!confirm("Start New Game?")){
                return;
            }
        }
        init();
        return;
    }

    if(action != "wait"){
        return;
    }
    numOfShots += 1;

    action = currentBall.colorIndex == 6 ? "superBall" : "fire";

    // init fire ball
    fireBall = new Ball(currentBall.x, currentBall.y, currentBall.colorIndex);
    fireBallAngle = mouse.angle;

    // switch current with next ball
    currentBall.x = nextBall.x;
    currentBall.y = nextBall.y;
    currentBall.colorIndex = nextBall.colorIndex;

    // reste next ball
    // check if superBall ball
    if(Math.floor((Math.random() * 40)) == 39){
        nextBall.colorIndex = 6;
    }else{
        nextBall.colorIndex = rndColorIndex();
    }
}

function rndColorIndex(){
    // generate rendom index 0-5
    return Math.floor((Math.random() * 6));
}

function findAllAttachedBalls(tball){
//console.log("findAllAttachedBalls");
    // check balls collision
    for(let b=0; b<balls.length; b++){
        // check if ball in pop arr
        if(ballsToPop.includes(balls[b]) || balls[b] == tball){
            // same ball continue
            continue;
        }
        
        let a = 75;//r1 + r2;
        let x = tball.x - balls[b].x;
        let y = tball.y - balls[b].y;

        if (a > Math.sqrt((x * x) + (y * y))) {// collision
//console.log(`ball:${b} attached`);
            if(tball.colorIndex === balls[b].colorIndex){
//console.log("color match");
                ballsToPop.push(balls[b]);
                findAllAttachedBalls(balls[b]);
            }
        }
    }
}

function checkDetachedBalls(){
    // remove from ball list all ball that are not attached to other balls (detached from group).
    let onwall = balls.filter(o => { return (o.x <= 77 || o.x >= 650 || o.y == 45) && !ballsToPop.includes(o)});

   // onwall.map(o => o.colorIndex = 0);
    let tocheck = balls.filter(o => {return !(onwall.includes(o) || ballsToPop.includes(o))})

    for(let a=0; a<tocheck.length; a++){
        for(let b=0; b<onwall.length; b++){
            if(tocheck[a] == onwall[b]){
                continue;
            }

            let c = 75;//r1 + r2;
            let x = tocheck[a].x - onwall[b].x;
            let y = tocheck[a].y - onwall[b].y;

            if (c > Math.sqrt((x * x) + (y * y))) {// collision
                // add ball to onwall
                onwall.push(tocheck[a]);       
                break;
            }
        }
    }


    let detached = tocheck.filter(x => !onwall.includes(x));
    if(detached.length > 0){
        ballsToPop.push(...detached);
    }
}


function isTimeToDescent(){
   return (numOfShots % levels[level].threshold == 0);
}