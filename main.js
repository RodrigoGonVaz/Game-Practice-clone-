const $canvas = document.querySelector("canvas");
const ctx = $canvas.getContext("2d");
const $button = document.getElementById("startGame")
$canvas.width = 900;
$canvas.height = 600;


let intervalId; 
let intervalIdEnd;
//Variables Globales
let cellSize = 100; // <-- Celda como en excel
let cellGap = 3;
// es un array de los cuadros que s emuestran en el canvas la mover el mouse (45 objetos)
const gameGrid = [];
// Un arreglo que contiene a todos los que defienden
const dogeKillers = [];
let numberOfResources = 300;
//Un Array que contiene todos los enemigos
const enemies = [];
const superBoss = [];
// Un array que nos ayudara ver la posicion de cada enemigo para el Defensor (se llena en *handleEnemies*) nos da solo la Y
const enemyPosition = [];
const bossPosition = []; 
const bossPosition2 = [];
let enemiesInterval = 50000; // <--- nos va a servir para disminuir los frames (o enemigos que salen por frames) *handleEnemies*
let bossInterval = 1200;
let frame = 0; // <--- para crear a los enemigos periodicamente
let frameOver = 0;
let gameOver = false;
// Se mostrara en la funcion *-handleGameStatus*
let score = 0;
const winningScore = 1000;
//Para iterar sobre los proyectiles
const projectiles = [];
//Array de recursos para meterlos aqui, cuando se crean en start
const resources = [];




//Mouse (pos)
const mouse = {
    x: 10,
    y: 10,
    width: 0,
    height: 0,

}
// getBoundingClientRect -> esta funcion regresa un objecto del DOM (rectangulo) que contiene info
// info del tamaño de algun elemento y su posicion
// sirve para saber donde se puede mover el mouse dentro del CANVAS y no fuera  <-------------- OJO console.log(canvasPosition);
let canvasPosition = $canvas.getBoundingClientRect();
//El método addEventlistener, es un escuchador que indica al navegador que este atento a la interacción del usuario.
//Tipo de evento: MouseEvent | UIEvent | Event | ProgressEvent<EventTarget> | ClipboardEvent | AnimationEvent | WheelEvent
//nombre de evento ejem: mousedown, mouseenter, mouseleave, mousemove, *click*
// ------------------------------------------ 👇 funcion que se detona cuando el mouse se mueve dentro del canvas
$canvas.addEventListener('mousemove', function(event){
    mouse.x = event.x - canvasPosition.left; // el mouse accede a las coordinadas del canvas global
    mouse.y = event.y - canvasPosition.top;
})
//cuando el mouse sale del canvas:
//El evento mouseleave ocurre 👇 cuando el puntero del mouse se mueve fuera de un elemento.
$canvas.addEventListener('mouseleave', function(event){
    mouse.y = undefined;   // regresa a la posicion acual del mouse obj.
    mouse.x = undefined; 
})


//CELDAS con mov del mouse
// ----------CLASSES----------------//

const controlsBar = {
    width: $canvas.width,
    height: cellSize,
}

class Cell {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
    }
    draw(){
        //si mouse.x tiene cordenadas (verdadero) y mouse.y tiene coordenas (verdadero) y...
        // si (defensor = this.cell (esta instancia) y la posicion del mouse) - regresa o pinta esta misma cell(instancia)
        if (mouse.x && mouse.y && colision(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);  
        }
    }
}
// -------Evento del GRID o Celda-----------
function createGrid() {
    // El loop entra al canvas por rows en este loop, primero empieza debajo de la linea azul (100px en hight) y 
    //va iterando 100px en X hasta terminar el $canvas.width y baja de nuevo en 100px (cellSeize)
    for (let y = cellSize; y < $canvas.height; y += cellSize) {
        for (let x = 0; x < $canvas.width; x += cellSize) {
            // cada vez que nos movemos horizontalmente en X en 100px (cellSize) se manda al array un nuevo Cell
            //se ponen Cell por todo el canvas en X y Y
            gameGrid.push(new Cell(x,y));
        }
                
    }
}
createGrid();
// para llamar a la funcion *handleGameGrid* la ponemos en la funcion de start
function handleGameGrid() {
    // iterando por el array y dibujando cada una de las Cells (o INSTANCIAS)
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
        
    }
}

//Board
// ----------CLASSES----------------//
const dogeCoin = new Image();
dogeCoin.src = "./Images/coinDoge/DogeCoin1.png"


class Board {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.width = $canvas.width;
		this.height = $canvas.height;
		this.image = new Image();
		this.image.src = "./Images/moon.png";
        this.image2 = new Image();
		this.image2.src = "./Images/GameOver.PNG";
        this.frameX = 0;  //<--- num de frames en la fila
        this.frameY = 0; //<--- si hay varias filas seria el numero de filas 
        this.minFrame = 0; //
        this.maxFrame = 23;
        this.spriteWidth = 121; // <-- cuando frame X es 0 se le suma el ancho y empieza el nuevo FrameX en el ancho 144 (cortando)
        this.spriteHeight = 126;
	}

	draw() {
		ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
	}
    drawGameOver(){
        ctx.drawImage(this.image2, this.x, this.y, this.width, this.height);
        ctx.drawImage(dogeCoin, this.frameX * this.spriteWidth + 22,0, this.spriteWidth , this.spriteHeight, this.x + 100, this.y + 200,118, 126);
    }
    updateGameOver(){ // itera sobre las imagenes
        if (frameOver % 5 === 0) {
             if (this.frameX < this.maxFrame) {
                 this.frameX ++;
             } else {
                 this.frameX = this.minFrame = 0;
             }    
         }
}
}

const board = new Board();


//Projectiles
// ----------CLASSES----------------//
class Projectile {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10; 
        this.power = 20;
        this.speed = 5;
    }
    update(){       // <---- cuando se dibuje se movera en x hacia derecha
        this.x += this.speed;
    }
    draw(){
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI *2); // <--- Para hacer un circulo / el cero es su angulo
        ctx.fill();  // <---- lo rellena de negro
    }
}
// para llamar a la funcion *handleProjectiles* la ponemos en la funcion de start
function handleProjectiles() {
    // iterando por el array y dibujando cada una de las balas (o INSTANCIAS) --- *ESTE ARREGLO SE VA LLENANDO en Class dogeKiller* ---
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();
    for (let u = 0; u < enemies.length; u++) {
        if (enemies[u] && projectiles[i] && colision(projectiles[i], enemies[u])) {
            enemies[u].health -= projectiles[i].power;
            projectiles.splice(i,1); //<--- solo eliminar este projectil
            i--;
        }  
    }
    superBoss.forEach((boss) => {
        if (boss && projectiles[i] && boss.isTouching(projectiles[i])) {
            boss.health -= projectiles[i].power;
            projectiles.splice(i,1); //<--- solo eliminar este projectil
            i--;
        }
    })
   // Si un proyectil 👇  existe y si un proyectil 👇  es menor que el ancho del canvas menos 100: 
        if (projectiles[i] && projectiles[i].x > $canvas.width - cellSize) {  
            projectiles.splice(i,1);  // <----- se eleimina del arreglo cuando llega al ancho - 100 (solo se borra uno)
            i--;  // <---- regresa el arreglo o lo ajusta para no saltar el siguiente objeto iterado
        }
    }
}



//DogeKiller
// ----------CLASSES----------------//

const kirby1 = new Image();
kirby1.src = "./Images/killer/kirby.png"


class DogeKiller {
    constructor(x,y){
        this.x = x;
        this.y = y; 
        this.width = cellSize - cellGap * 2; // <- reduce el cuadro del defensor por arriba y abajo en 6
        this.hight = cellSize - cellGap * 2;
        this.shooting = false; // <----- se usara cuando un defensor detecte un enemigo para disparar
        this.health = 100;
        this.projecticles = []; // <---- info de que tipo de projectiles esta disparando la instancia que se creo
        this.timer = 0; // <---- nos va a ayudar a detonar algo cuando cierto tiempo pase, 
        //ejemplo cuando pasen 100 seg, projecticles.push un nuevo proyectil a este arr
        // this.img1 = new Image();
		// this.img2 = new Image();
		// this.img3 = new Image();
		// this.img4 = new Image();
        // this.img5 = new Image();
		// this.img1.src = "./Images/a1.PNG";
		// this.img2.src = "./Images/a2.PNG";
		// this.img3.src = "./Images/a3.PNG";
		// this.img4.src = "./Images/a4.PNG";
        // this.img5.src = "./Images/a5.PNG";
		// this.animation = 0;
        
        this.frameX = 0;  //<--- num de frames en la fila
        this.frameY = 0; //<--- si hay varias filas seria el numero de filas 
        this.minFrame = 0; //
        this.maxFrame = 11;
        this.spriteWidth = 248; // <-- cuando frame X es 0 se le suma el ancho y empieza el nuevo FrameX en el ancho 144 (cortando)
        this.spriteHeight = 238;
    }
    draw() {
        // if (frame % 100 === 0) {
		// 	this.animation++;
		// 	if (this.animation === 6) this.animation = 1; //<--- Mantener un numero entre 1 a 5 (cambiando de imagen)
		// }

        // if (this.animation === 1) {
        //     ctx.drawImage(this.img1, this.x, this.y + 22, this.width, this.height);        
        // } else if (this.animation === 2) {
        //     ctx.drawImage(this.img2, this.x, this.y + 22, this.width, this.height);
        // } else if (this.animation === 3) {
        //     ctx.drawImage(this.img3, this.x, this.y + 22, this.width, this.height);
        // }else if (this.animation === 4) {
        //     ctx.drawImage(this.img4, this.x, this.y + 22, this.width, this.height);
        // }else if (this.animation === 5) {
        //     ctx.drawImage(this.img5, this.x, this.y + 22, this.width, this.height);
        // }
        
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(this.x, this.y,  this.width, this.hight); // <-----  OJO Revisar por que no me esta tomando 
        ctx.fillStyle = 'gold'; // <------ Vamos a dibujar tambien su vida con los siguientes atributos:
        ctx.font = '30px Orbitron'; // <----- al poner este atributo la funcion esta esperando ordenes de escribir algo: (this.health)
        // la vida se representa en integrales en 👇  la posicion que tenga el defensor
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
        //context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        // img = imagen / sx = 	Frame index por spriteWidth(para emepzar X=spriteWidth) / sy= frameIndex 0 y no se multiplica por spriteHeight ya que esta en una sola fila
        //sw=spriteWidth / sy=spriteHeight / dx = destino en X/ dy=destino en Y / dw = ancho / dh = alto
        ctx.drawImage(kirby1, this.frameX * this.spriteWidth,0, this.spriteWidth, this.spriteHeight, this.x + 15, this.y + 20,60, 60);
        
    }
    update(){
       if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) {
                this.frameX ++;
            } else {
                this.frameX = this.minFrame = 0;
            }    
        }
        
        if (this.shooting) { // <-- si es true dispara
            this.timer ++; 
            if (this.timer % 100 === 0) {        // valor de 👇  70 y 50 para que salga de en medio del cuadro
                projectiles.push(new Projectile(this.x + 70, this.y + 50)); // <-- cada 100 frames una istancia (projectil) se crea y se va al Array
            }  
    } else {
       this.timer = 0; 
    }
    }
    isTouching(boss){
        return (
			this.x < boss.x + boss.width &&
			this.x + this.width > boss.x &&
			this.y < boss.y + boss.height &&
			this.y + this.height > boss.y
		);
    }
    
}

// -------Evento del DogeKiller-----------
$canvas.addEventListener('click', function(){
    // Tomaremos la coordenada principal o original del mouse en X y Y
    // supongamos que la posicion del mouse es 250 en X y cellSize = 100 entonces 250 - (50) = 200 
    // Esto es el valor dela posicion de mi Celda en X a la izquierda (son 9 columnas - 900px)
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize) return; // <--- Si doy click en los primero 100 de Hight no pasa nada
        for (let i = 0; i < dogeKillers.length; i++) {
            if (dogeKillers[i].x === gridPositionX && dogeKillers[i].y === gridPositionY) {
                return; // <---- Si la posicion del defensor que ya habia colocado es igual al click de mi nueva CELDA (NO HAGAS NADA)
            }}
    let dogeKillerCost = 100; // el costo de mis defensores el cual ira desendiendo
    if (numberOfResources >= dogeKillerCost) { // <----- Si tenego recursos entonces que se ejecute la Classe dogeKiller y se guarde en arr de dogeKiller
        dogeKillers.push(new DogeKiller(gridPositionX, gridPositionY));
        numberOfResources -= dogeKillerCost; // <----- al crear el defensor le resta recursos a mi variable
    }
})
// para llamar a la funcion *handledogeKillers* la ponemos en la funcion de start
function handledogeKillers() {
    // Loop que itera en el array global que se va a ir llenando en mi event click de Crear nuevo dogeKiller
    for (let i = 0; i < dogeKillers.length; i++) {
        dogeKillers[i].draw();
        dogeKillers[i].update(); //<--- for each dogeKiller creado en el array, llama la funcion update(projectiles)

        superBoss.forEach((boss) => {


        
        // <- array que se va a revisar si aun tiene la misma coordenada defensor y enemigo en Y (no es -1 DISPARA)
        // si la posision del enemigo no encuentra la misma coordenada que el defensor en Y me da -1 (SE DETIENEN LAS BALAS)
        if (enemyPosition.indexOf(dogeKillers[i].y) !== -1 || bossPosition2.indexOf(dogeKillers[i].y - cellGap) !== -1) {  
            dogeKillers[i].shooting = true;
        } else {
            dogeKillers[i].shooting = false;
        }
        for (let u = 0; u < enemies.length; u++) {  //<---- loop en el array de los enemigos que se van creando (instancias)
            if (dogeKillers[i] && colision(dogeKillers[i], enemies[u])) {  // <---- condicion de la funcion de colision / revisa a cada defensor y enemigo si se tocan
                enemies[u].movement = 0;               // si se tocan enemigo iterado se deja de mover
                dogeKillers[i].health -= 0.2;            // si se tocan quitale vida al defensor
            }
            if (dogeKillers[i] && dogeKillers[i].health <= 0) {  //<---- si el la vida de mi defensor es menor o igual a 0, quitalo de mi array
                dogeKillers.splice(i, 1); //<--- aquel defensor que tiene menos se quita del array y solo se quita 1 objeto del array
                i--;  // <--- para que no se salte el siguiente objeto del array en el loop, ponemos menos 1 en el index 
                enemies[u].movement = enemies[u].speed;
            }            
        }
           if (dogeKillers[i] && colision(dogeKillers[i], boss)) {
                boss.movement = 0;               // si se tocan enemigo iterado se deja de mover
                dogeKillers[i].health -= 0.2; 
           }
           if (dogeKillers[i] && dogeKillers[i].health <= 0) {  
               dogeKillers.splice(i, 1); 
               i--; 
               boss.movement = boss.speed;
           }    
        });


        // superBoss.forEach((boss) => {
        //    dogeKillers.forEach(dogeKiller => {
        //      if (dogeKiller.isTouching(boss)){
        //         boss.movement = 0;              
        //         dogeKiller.health -= 0.2;   
        //      }
        //    });
        // });
    }
    
}

//ENEMIGO
// ----------CLASSES----------------//
const enemyTypes = [];
const enemyDoge = new Image();
enemyDoge.src = "./Images/1doge.png"
enemyTypes.push(enemyDoge);

class Enemy {
    constructor(verticalPosition){ // <---- parametro se crea en la funcion *handleEnemies*
        this.x = $canvas.width;  // <---- para que el enemigo salga por detras del ancho del canvas
        this.y = verticalPosition; // <----- una variable global para que el defensor tambien pueda acceder a ella
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = 0.01; // <-- Max de velocidad 4.2 px
        this.movement = this.speed; // <---- se hizo esta variable para cuando el enemigo llegue al defensor, esto dara 0
        this.health = 100;
        this.maxHealth = this.health; // <--- nos ayuda a darnos mas puntos dependiendo del enemigo que eliminemos.
        this.enemyType = enemyTypes[0];
        this.frameX = 0;
        this.frameY = 0; 
        this.minFrame = 0;
        this.maxFrame = 4;
        this.spriteWidth = 144;
        this.spriteHeight = 144;
    }
    update(){
        this.x -= this.movement; // <--- al empezar en el final del canvas en X, se le va ir restando para avanzar en X
        if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) {
                this.frameX ++;
            } else {
                this.frameX = this.minFrame = 0;
            }    
        }
    }
    draw(){
        ctx.fillStyle = "#31daFB";
        ctx.fillRect(this.x, this.y, this.width, this.height); // <-----  OJO Revisar por que no me esta tomando 
        ctx.fillStyle = 'red';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
        //context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        // img = imagen / sx = 	Frame index por spriteWidth(para emepzar X=spriteWidth) / sy= frameIndex 0 y no se multiplica por spriteHeight ya que esta en una sola fila
        //sw=spriteWidth / sy=spriteHeight / dx = destino en X/ dy=destino en Y / dw = ancho / dh = alto
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth,0,this.spriteWidth, this.spriteHeight, this.x, this.y,this.width, this.height)
        
    }
}

// para llamar a la funcion *handleEnemies* la ponemos en la funcion de start
function handleEnemies(){
    for (let i = 0; i < enemies.length; i++) { // <--- por cada objeto en ese Array:
        enemies[i].update();   // <---- hara que se muevan 
        enemies[i].draw();      // <---- hara que se dibuje con su vida 
        if (enemies[i].x < 0){  // <---- si algun enemigo llega a x = 0 de ancho perdio
            gameOver = true;
        }
        if (enemies[i].health <= 0) {        // 👇 solo dara 10 de recursos al matar al enemigo
            let gainedResources = enemies[i].maxHealth/10; // <---- en la clase Enemy .maxHealth es 100 para guardarlo en esta variable
            numberOfResources += gainedResources;
            score += gainedResources;
            // en el loop de los enemigos si el enemigo muere, se activa la variable findThisIndex la cual sirve para
            //encontrar al enemigo que murio y quitarlo del enemyPosition array
            const findThisIndex = enemyPosition.indexOf(enemies[i].y) 
            enemyPosition.splice(findThisIndex,1)
            enemies.splice(i,1) // <----- se eleimina del arreglo cuando la vida llega a 0 (solo se borra uno)
            i--;  // <---- regresa el arreglo o lo ajusta para no saltar el siguiente objeto iterado
        }
    }
    if (frame % enemiesInterval === 0 || score < winningScore) {  // <---- cada que el frame sea divisible por *enmiesInterval (600)*, un enemigo saldra
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap; // <---- verticalPosition sera un num random entre 100/200/300/400/500 coordenadas horizontales la celda
        enemies.push(new Enemy(verticalPosition));
        enemyPosition.push(verticalPosition)   // <--- Array se va llenando por cada posicion nueva del enemigo que este ACTIVO
        if (enemiesInterval > 120) {
            enemiesInterval -= 50; // <--- haremos que el intervalo disminuya en 50 (saldran mas y mas)  
        } 
    }
}

class Boss extends Enemy {
    constructor(verticalPosition){
        super(verticalPosition);
        this.width = cellSize + 100;
        this.height = cellSize + 100;
        this.speed = 0.01;
        this.movement = this.speed; // <---- se hizo esta variable para cuando el enemigo llegue al defensor, esto dara 0
        this.health = 300;
        this.maxHealth = this.health;
        this.img1 = new Image();
		this.img2 = new Image();
		this.img3 = new Image();
		this.img4 = new Image();
        this.img5 = new Image();
		this.img1.src = "./Images/a1.PNG";
		this.img2.src = "./Images/a2.PNG";
		this.img3.src = "./Images/a3.PNG";
		this.img4.src = "./Images/a4.PNG";
        this.img5.src = "./Images/a5.PNG";
		this.animation = 0;
	}
    update(){
        this.x = this.x - this.movement; // <--- al empezar en el final del canvas en X, se le va ir restando para avanzar en X
    }
    draw(){
		if (frame % 100 === 0) {
			this.animation++;
			if (this.animation === 3) this.animation = 1; //<--- Mantener un numero entre 1 a 5 (cambiando de imagen)
		}

        if (this.animation === 1) {
            ctx.drawImage(this.img1, this.x, this.y + 22, this.width, this.height);        
        }else if (this.animation === 2) {
            ctx.drawImage(this.img5, this.x, this.y + 22, this.width, this.height);
        }

        ctx.fillStyle = 'red';
        ctx.font = '20px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 80, this.y + 100);
        
    }
    isTouching(dogekiller){
        return (
			this.x < dogekiller.x + dogekiller.width &&
			this.x + this.width > dogekiller.x &&
			this.y < dogekiller.y + dogekiller.height &&
			this.y + this.height > dogekiller.y
		);

    }

    }

// para llamar a la funcion *handleBoss* la ponemos en la funcion de start
function handleBoss(){
	superBoss.forEach((boss) => {
		boss.draw();
        boss.update();        
	});    
    superBoss.forEach((boss) => {
        if (boss.x < - 45 ) {
        gameOver = true            
      }});

      if (frame % bossInterval === 0 && score < winningScore) {  // <---- cada que el frame sea divisible por *bossInterval (1200), un boss saldra
        let verticalPosition = Math.floor(Math.random() * 4 + 1) * cellSize - 100; // <---- verticalPosition sera un num random entre 100/200/300/400 coordenadas horizontales la celda
        if (verticalPosition === 100) {
            verticalPosition += 100;            
        }
        superBoss.push(new Boss(verticalPosition));
        bossPosition.push(verticalPosition);   // <--- Array se va llenando por cada posicion nueva del enemigo que este ACTIVO
        bossPosition2.push(verticalPosition + 100);
    }
    superBoss.forEach((boss) => {
        dogeKillers.forEach(dogeKiller => {
          if (dogeKiller.isTouching(boss)){
             boss.movement = 0;              
             dogeKiller.health -= 0.2;   
          }
          if (boss.health <= 0) {        // 👇 solo dara 10 de recursos al matar al enemigo
             let gainedResources = boss.maxHealth/10; // <---- en la clase Boss .maxHealth es 300 para guardarlo en esta variable
             numberOfResources += gainedResources;
             score += gainedResources;
             // en el loop de los boss si el enemigo muere, se activa la variable findThisIndex la cual sirve para
             //encontrar al boss que murio y quitarlo del bossPosition array
             const findThisIndex = bossPosition.indexOf(boss.y) 
             bossPosition.splice(findThisIndex,1)
             superBoss.splice(boss,1) // <----- se eleimina del arreglo cuando la vida llega a 0 (solo se borra uno)
             boss--;  // <---- regresa el arreglo o lo ajusta para no saltar el siguiente objeto iterado
         }
        });
     });
     
  

}


// RECURSOS
// --------GANAR RECURSOS---------
const coin = new Image();
coin.src = "./Images/killer/coin.png"
const amounts = [20, 30, 40];

class Resources {
    constructor(x,y){
     this.x = Math.random() * ($canvas.width - cellSize);  // <-- para que los recursos no salgan tanto a la derecha (100px)
     // redondea por las 5 columnas y multiplica para que sea multiplos de 100/200/300/400/500 
     //y para que salgan en medio del cuadro de 100x100 le sumamos 25 de alto
     this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
     this.width = cellSize * 0.6;
     this.height  = cellSize * 0.6;
     this.amount = amounts[Math.floor(Math.random()* amounts.length)]; // <-- random de recursos generados
     this.frameX = 0;  //<--- num de frames en la fila
     this.frameY = 0; //<--- si hay varias filas seria el numero de filas 
     this.minFrame = 0; //
     this.maxFrame = 5;
     this.spriteWidth = 30; // <-- cuando frame X es 0 se le suma el ancho y empieza el nuevo FrameX en el ancho 144 (cortando)
     this.spriteHeight = 30;
    }
    draw(){
        // ctx.fillStyle = 'yellow';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px Orbitron';
        ctx.fillText(this.amount, this.x + 15, this.y);
        ctx.drawImage(coin, this.frameX * this.spriteWidth + 5.8,0, this.spriteWidth, this.spriteHeight, this.x, this.y,this.width, this.height);
    }
    update(){
        if (frame % 10 === 0) {
             if (this.frameX < this.maxFrame) {
                 this.frameX ++;
             } else {
                 this.frameX = this.minFrame = 0;
             }    
         }
}
}

function handleResources() {
    if (frame % 10000 === 0 && score < winningScore){   // <-- cada 100 frames crea un recurso (instancia) que se empuja al arreglo SI el score es menor al WINNINGSCORE
        resources.push(new Resources());
    } 
    for (let i = 0; i < resources.length; i++) {
        resources[i].draw();
        resources[i].update();
        if (resources[i] && mouse.x && mouse.y && colision(resources[i], mouse)) { //<----- si mi mouse pasa por encima del recurso, entonces se llena mi array resources[i].amount
            numberOfResources += resources[i].amount;
            resources.splice(i,1);
            i --;
        }
        
    }
}



//Utilities 
// para llamar a la funcion *handleGameStatus* la ponemos en la funcion de start
function handleGameStatus(){
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    // Variable numberOfResources 👇  que se modifica en *addEventListener del defensor
    ctx.fillText('Score: ' + score, 20, 40);
    ctx.fillText('Resources: ' + numberOfResources, 20, 80);
     if (gameOver) {
        board.drawGameOver();
        board.updateGameOver();
        clearInterval(intervalId);
    // ctx.fillStyle = '#717171';
    // ctx.font = '60px Orbitron';
    // ctx.fillText('GAME OVER:', 215, 330);
     }
     if (score > winningScore && enemies.length === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText('LEVEL COMPLETE', 130, 300);
        ctx.font = '30px Orbitron';
        ctx.fillText('You Win, score: ' + score + 'points', 134, 340);
     }
}

function startGame() {
	if (intervalId) return;
	intervalId = setInterval(() => {
		start();
	}, 1000/60);
}
// function startGameOver() {
// 	if (intervalIdEnd) return;
// 	intervalIdEnd = setInterval(() => {
// 		end();
// 	}, 5000);
// }


function start() {
    //Clear
    ctx.clearRect(0,0, $canvas.width, $canvas.height);
    
    board.draw();
    ctx.fillStyle = "#2a282a";
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handledogeKillers();
    handleResources();
    handleProjectiles();
    handleEnemies();
    handleBoss();
    handleGameStatus();
    frame ++;
    if (!gameOver) {
        requestAnimationFrame(start); // <--- si no ha perdido sigue ejecutando start
    }  
}
startGame();

function end(){
    ctx.clearRect(0,0, $canvas.width, $canvas.height);
    
    board.drawGameOver();
    board.updateGameOver();
    frameOver ++;
    if (gameOver) {
        requestAnimationFrame(end); // <--- si no ha perdido sigue ejecutando start
    }  
}
startGameOver();

// Esta funcion se activa en la class Cell cuando pasa una condicion
function colision(defensor, enemigo) {
    // -----👇  si esta condicion es negativa = TRUE, si no se tocan es verdadero
    // primer rectangulo comparado con el segundo rectangulo en X y Y - y ancho y alto
    if (    !(defensor.x > enemigo.x + enemigo.width ||  // <------- la punta de inicio de PRIMERA x esta mas a la derecha del ancho de enemigo x -(a su derecha)-
              defensor.x + defensor.width < enemigo.x ||   // <------- El ancho de PRIMERA x es menor que la punta o inicio de enemigo x -(a su izquierda)-
              defensor.y > enemigo.y + enemigo.height || // <------- la punta de inicio de PRIMERA y esta mas abajo de la altura de enemigo y -(por debajo)- 
              defensor.y + defensor.height < enemigo.y)    // <------- La altura de PRIMERA y es menor que la punta o inicio de enemigo y -(por arriba)-
              
       ) {
           return true // <----- ! como hay negacion si estan chocando y regresa verdadero en la colision
       } else if (defensor.x > enemigo.x + enemigo.width ||  
       defensor.x + defensor.width < enemigo.x ||   
       defensor.y > enemigo.y + enemigo.height || 
       defensor.y + defensor.height < enemigo.y) {
           return false
       }
};

// // Esta funcion se activa en la class Cell cuando pasa una condicion
// function colisionBoss(defensor, enemigo) {
//     // -----👇  si esta condicion es negativa = TRUE, si no se tocan es verdadero
//     // primer rectangulo comparado con el segundo rectangulo en X y Y - y ancho y alto
//     if ((defensor.x < enemigo.x  + enemigo.width - 80 ||  // <------- la punta de inicio de PRIMERA x esta mas a la derecha del ancho de enemigo x -(a su derecha)-
//          defensor.x + defensor.width - 80 > enemigo.x ||   // <------- El ancho de PRIMERA x es menor que la punta o inicio de enemigo x -(a su izquierda)-
//          defensor.y < enemigo.y + enemigo.height || // <------- la punta de inicio de PRIMERA y esta mas abajo de la altura de enemigo y -(por debajo)- 
//          defensor.y + defensor.height > enemigo.y)    // <------- La altura de PRIMERA y es menor que la punta o inicio de enemigo y -(por arriba)-
              
//        ) {
//            return true // <----- ! como hay negacion si estan chocando y regresa verdadero en la colision
//        } 
// };

// $button.onclick = startGame


window.addEventListener('resize', function() { // <---- cuando el browser cambia de tamaño el mouse Position se mueve pero la funcion lo recalcula 
    canvasPosition = $canvas.getBoundingClientRect();    
})

