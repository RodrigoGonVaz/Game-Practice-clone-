const $canvas = document.querySelector("canvas");
const ctx = $canvas.getContext("2d");
$canvas.width = 900;
$canvas.height = 600;

//global variables
const cellSize = 100; // <-- Celda como en excel
const cellGap = 3;
// es un array de los cuadros que s emuestran en el canvas la mover el mouse (45 objetos)
const gameGrid = [];
// Un arreglo que contiene a todos los que defienden
const defenders = [];
let numberOfResources = 300;
//Un Array que contiene todos los enemigos
const enemies = [];
// Un array que nos ayudara ver la posicion de cada enemigo para el Defensor (se llena en *handleEnemies*)
const enemyPosition = []; 
let enemiesInterval = 600; // <--- nos va a servir para disminuir los frames (o enemigos que salen por frames) *handleEnemies*
let frame = 0; // <--- para crear a los enemigos periodicamente
let gameOver = false;
//Para iterar sobre los proyectiles
const projectiles = [];



//Mouse object
const mouse = {
    x: 5,
    y: 5,
    width: 0.1,
    height: 0.1,

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
        this.width = cellSize;
        this.height = cellSize;
    }
    draw(){
        //si mouse.x tiene cordenadas (verdadero) y mouse.y tiene coordenas (verdadero) y...
        // si (first = this.cell (esta instancia) y la posicion del mouse) - regresa o pinta esta misma cell(instancia)
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
// para llamar a la funcion *handleGameGrid* la ponemos en la funcion de animate
function handleGameGrid() {
    // iterando por el array y dibujando cada una de las Cells (o INSTANCIAS)
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
        
    }
}

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
// para llamar a la funcion *handleProjectiles* la ponemos en la funcion de animate
function handleProjectiles() {
    // iterando por el array y dibujando cada una de las balas (o INSTANCIAS) --- *ESTE ARREGLO SE VA LLENANDO en Class Defender* ---
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
   // Si un proyectil 👇  existe y si un proyectil 👇  es menor que el ancho del canvas menos 100: 
        if (projectiles[i] && projectiles[i].x > $canvas.width - cellSize) {  
            projectiles.splice(i,1);  // <----- se eleimina del arreglo cuando llega al ancho - 100 (solo se borra uno)
            i--;  // <---- regresa el arreglo o lo ajusta para no saltar el siguiente objeto iterado
        }
        console.log('projectiles ' + projectiles.length)
    }
}



//Defenders
// ----------CLASSES----------------//
class Defender {
    constructor(x,y){
        this.x = x;
        this.y = y; 
        this.width = cellSize;
        this.hight = cellSize;
        this.shooting = false; // <----- se usara cuando un defensor detecte un enemigo para disparar
        this.health = 100;
        this.projecticles = []; // <---- info de que tipo de projectiles esta disparando la instancia que se creo
        this.timer = 0; // <---- nos va a ayudar a detonar algo cuando cierto tiempo pase, 
        //ejemplo cuando pasen 100 seg, projecticles.push un nuevo proyectil a este arr
    }
    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, cellSize, cellSize);
        ctx.fillStyle = 'gold'; // <------ Vamos a dibujar tambien su vida con los siguientes atributos:
        ctx.font = '30px Orbitron'; // <----- al poner este atributo la funcion esta esperando ordenes de escribir algo: (this.health)
        // la vida se representa en integrales en 👇  la posicion que tenga el defensor
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
    update(){
        this.timer ++; 
        if (this.timer % 100 === 0) {        // valor de 👇  70 y 50 para que salga de en medio del cuadro
            projectiles.push(new Projectile(this.x + 70, this.y + 50)); // <-- cada 100 frames una istancia (projectil) se crea y se va al Array
        }
    }
    
}

// -------Evento del DEFENSOR-----------
$canvas.addEventListener('click', function(){
    // Tomaremos la coordenada principal o original del mouse en X y 
    // supongamos que la posicion del mouse es 250 en X y cellSize = 100 entonces 250 - (50) = 200 
    // Esto es el valor dela posicion de mi Celda en X a la izquierda
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    if (gridPositionY < cellSize) return; // <--- Si doy click en los primero 100 de Hight no pasa nada
        for (let i = 0; i < defenders.length; i++) {
            if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {
                return; // <---- Si la posicion del defensor que ya habia colocado es igual al click de mi nueva CELDA (NO HAGAS NADA)
            }}
    let defenderCost = 100; // el costo de mis defensores el cual ira desendiendo
    if (numberOfResources >= defenderCost) { // <----- Si tenego recursos entonces que se ejecute la Classe Defender y se guarde en arr de Defender
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost; // <----- al crear el defensor le resta recursos a mi variable
    }
})
// para llamar a la funcion *handleDefenders* la ponemos en la funcion de animate
function handleDefenders() {
    // Loop que itera en el array global que se va a ir llenando en mi event click de Crear nuevo Defender
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update(); //<--- for each defender creado en el array, llama la funcion update(projectiles)
        for (let u = 0; u < enemies.length; u++) {  //<---- loop en el array de los enemigos que se van creando (instancias)
            if (defenders[i] && colision(defenders[i], enemies[i])) {  // <---- condicion de la funcion de colision / revisa a cada defensor y enemigo si se tocan
                enemies[u].movement = 0;               // si se tocan enemigo iterado se deja de mover
                defenders[i].health -= 0.2;            // si se tocan quitale vida al defensor
            }
            if (defenders[i] && defenders[i].health <= 0) {  //<---- si el la vida de mi defensor es menor o igual a 0, quitalo de mi array
                defenders.splice(i, 1); //<--- aquel defensor que tiene menos se quita del array y solo se quita 1 objeto del array
                i--;  // <--- para que no se salte el siguiente objeto del array en el loop, ponemos menos 1 en el index 
                enemies[u].movement = enemies[u].speed;
            }            
        }
        
    }
}

//Enemy
// ----------CLASSES----------------//
class Enemy {
    constructor(verticalPosition){ // <---- parametro se crea en la funcion *handleEnemies*
        this.x = $canvas.width;  // <---- para que el enemigo salga por detras del ancho del canvas
        this.y = verticalPosition; // <----- una variable global para que el defensor tambien pueda acceder a ella
        this.width = cellSize;
        this.height = cellSize;
        this.speed = Math.random() * 0.2 + 0.4; // <-- Max de velocidad 4.2 px
        this.movement = this.speed; // <---- se hizo esta variable para cuando el enemigo llegue al defensor, esto dara 0
        this.health = 100;
        this.maxHealth = this.health; // <--- nos ayuda a darnos mas puntos dependiendo del enemigo que eliminemos.
    }
    update(){
        this.x -= this.movement; // <--- al empezar en el final del canvas en X, se le va ir restando para avanzar en X
    }
    draw(){
        ctx.fillStyle = "#31daFB";
        ctx.fillRect(this.x, this.y, cellSize, cellSize);
        ctx.fillStyle = 'red';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
        
    }
}
// para llamar a la funcion *handleEnemies* la ponemos en la funcion de animate
function handleEnemies(){
    for (let i = 0; i < enemies.length; i++) { // <--- por cada objeto en ese Array:
        enemies[i].update();   // <---- hara que se muevan 
        enemies[i].draw();      // <---- hara que se dibuje con su vida 
        if (enemies[i].x < 0){  // <---- si algun enemigo llega a x = 0 de ancho perdio
            gameOver = true;
        }
        if (enemies[i].health <= 0) {
            let gainedResources = enemies[i].maxHealth; // <---- en la clase Enemy .maxHealth es 100 para guardarlo en esta variable
            enemies[i].splice(i,1) // <----- se eleimina del arreglo cuando la vida llega a 0 (solo se borra uno)
            i--;  // <---- regresa el arreglo o lo ajusta para no saltar el siguiente objeto iterado
        }
    }
    if (frame % enemiesInterval === 0) {  // <---- cada que el frame sea divisible por *enmiesInterval (600)*, un enemigo saldra
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize; // <---- verticalPosition sera un num random entre 100/200/300/400/500 coordenadas horizontales la celda
        enemies.push(new Enemy(verticalPosition));
        enemyPosition.push(verticalPosition)   // <--- Array se va llenando por cada posicion nueva del enemigo
        if (enemiesInterval > 120) {
            enemiesInterval -= 50; // <--- haremos que el intervalo disminuya en 50 (saldran mas y mas)  
        } 
    }
}



//Utilities 
// para llamar a la funcion *handleGameStatus* la ponemos en la funcion de animate
function handleGameStatus(){
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    // Variable numberOfResources 👇  que se modifica en *addEventListener del defensor
    ctx.fillText('Resources: ' + numberOfResources, 20, 55);
     if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '60px Orbitron';
    ctx.fillText('GAME OVER:', 215, 330);
     }
}

function animate() {
    ctx.clearRect(0,0, $canvas.width, $canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleProjectiles()
    handleEnemies();
    handleGameStatus();
    frame ++;
    if (!gameOver) {
        requestAnimationFrame(animate); // <--- si no ha perdido sigue ejecutando animate
    }
    
}
animate();

// Esta funcion se activa en la class Cell cuando pasa una condicion
function colision(first, second) {
    // -----👇  si esta condicion es negativa = TRUE, si no se tocan es verdadero
    // primer rectangulo comparado con el segundo rectangulo en X y Y - y ancho y alto
    if (    !(first.x > second.x + second.width ||  // <------- la punta de inicio de PRIMERA x esta mas a la derecha del ancho de SECOND x -(a su derecha)-
              first.x + first.width < second.x ||   // <------- El ancho de PRIMERA x es menor que la punta o inicio de SECOND x -(a su izquierda)-
              first.y > second.y + second.height || // <------- la punta de inicio de PRIMERA y esta mas abajo de la altura de SECOND y -(por debajo)- 
              first.y + first.height < second.y)    // <------- La altura de PRIMERA y es menor que la punta o inicio de SECOND y -(por arriba)-
              
       ) {
            return true // <----- ! como hay negacion si estan chocando y regresa verdadero en la colision
       }
    
}