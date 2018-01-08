var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var sun;
var ground;
//var orbitControl;
var rollingGroundSphere;
var heroSphere;
var rollingSpeed=0.008;
var heroRollingSpeed;
var worldRadius=26;
var heroRadius=0.1;
var sphericalHelper;
var pathAngleValues;
var heroBaseY=2.1;
var bounceValue=0.1;
var gravity=0.005;
var leftLane=-1;
var rightLane=1;
var middleLane=0;
var currentLane;
var clock;
var jumping;
var enemyReleaseInterval=0.5;
var lastenemyReleaseTime=0;
var enemysInPath;
var enemysPool;
var particleGeometry;
var particleCount=20;
var explosionPower =1.06;
var particles;
var explosionCount = 0;
var healthText;
//var stats;
var scoreText;
var score;
var hasCollided;

init();

function init() {
	// set up the scene
	createScene();

// 	var text2 = document.createElement('div');
// text2.style.position = 'absolute';
// //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
// text2.style.width = 100;
// text2.style.height = 100;
// text2.style.backgroundColor = "white";
// text2.innerHTML = score;
// text2.style.top = 200 + 'px';
// text2.style.left = 200 + 'px';
// document.body.appendChild(text2);
	//call game loop
	update();


}

function createScene(){
	hasCollided=false;
	score=0;
	enemysInPath=[];
	enemysPool=[];
	clock=new THREE.Clock();
	clock.start();
	heroRollingSpeed=0;
	// heroRollingSpeed=(rollingSpeed*worldRadius/heroRadius)/5;
	sphericalHelper = new THREE.Spherical();
	pathAngleValues=[1.52,1.57,1.62];
    sceneWidth=window.innerWidth;
    sceneHeight=window.innerHeight;
    scene = new THREE.Scene();//the 3d scene
    //scene.fog = new THREE.FogExp2( 0xf0fff0, 0.14 );
    camera = new THREE.PerspectiveCamera( 70, sceneWidth / sceneHeight, 0.1, 500 );//perspective camera

		camera.position.set(0,0,0);
		camera.up = new THREE.Vector3(0,0,0);
		camera.lookAt(new THREE.Vector3(0,0,0));

    renderer = new THREE.WebGLRenderer({alpha:true});//renderer with transparent backdrop
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;//enable shadow
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('TutContainer');
	dom.appendChild(renderer.domElement);
	//stats = new Stats();
	//dom.appendChild(stats.dom);
	createenemysPool();
	addWorld();
	addHero();
	addLight();
	addExplosion();

	camera.position.z = 6.5;
	camera.position.y = 2.5;
	/*orbitControl = new THREE.OrbitControls( camera, renderer.domElement );//helper to rotate around in scene
	orbitControl.addEventListener( 'change', render );
	orbitControl.noKeys = true;
	orbitControl.noPan = true;
	orbitControl.enableZoom = false;
	orbitControl.minPolarAngle = 1.1;
	orbitControl.maxPolarAngle = 1.1;
	orbitControl.minAzimuthAngle = -0.2;
	orbitControl.maxAzimuthAngle = 0.2;
	*/
	window.addEventListener('resize', onWindowResize, false);//resize callback

	document.onkeydown = handleKeyDown;

	 scoreText = document.getElementById('minutes');
	 healthText = document.getElementById('health');

	 scoreText.innerHTML = "0";
	 healthText.innerHTML="100";
}
function addExplosion(){
	particleGeometry = new THREE.Geometry();
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		particleGeometry.vertices.push( vertex );
	}
	var pMaterial = new THREE.ParticleBasicMaterial({
	  color: 0xfffafa,
	  size: 0.2
	});
	particles = new THREE.Points( particleGeometry, pMaterial );
	scene.add( particles );
	particles.visible=false;
}
function createenemysPool(){
	var maxenemysInPool=10;
	var newenemy;
	for(var i=0; i<maxenemysInPool;i++){
		newenemy=createenemy();
		enemysPool.push(newenemy);
	}
}
function handleKeyDown(keyEvent){
	if(jumping)return;
	var validMove=true;
	if ( keyEvent.keyCode === 37) {//left
		if(currentLane==middleLane){
			currentLane=leftLane;
		}else if(currentLane==rightLane){
			currentLane=middleLane;
		}else{
			validMove=false;
		}
	} else if ( keyEvent.keyCode === 39) {//right
		if(currentLane==middleLane){
			currentLane=rightLane;
		}else if(currentLane==leftLane){
			currentLane=middleLane;
		}else{
			validMove=false;
		}
	}else{
		if ( keyEvent.keyCode === 38){//up, jump
			bounceValue=0.1;
			jumping=true;
		}
		validMove=false;
	}
	//heroSphere.position.x=currentLane;
	if(validMove){
		jumping=true;
		bounceValue=0.06;
	}
}
function addHero(){
	//var character	= new THREEx.MinecraftChar();
	var sphereGeometry = new THREE.IcosahedronGeometry( heroRadius, 1);
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff9329,shading:THREE.FlatShading} )

	var sphereGeometry1 = new THREE.IcosahedronGeometry( 0.05, 1);
	var sphereMaterial1 = new THREE.MeshStandardMaterial( { color: 0xffffff,shading:THREE.FlatShading} )
	jumping=false;
	heroSphere = new THREE.Object3D();

	heroSphere2 = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heroSphere2.receiveShadow = true;
	heroSphere2.castShadow=true;

	heroSphere1 = new THREE.Mesh( sphereGeometry1, sphereMaterial1 );
	heroSphere1.receiveShadow = true;
	heroSphere1.castShadow=true;

	heroSphere1.position.y=heroBaseY-2;

	heroSphere.add(heroSphere1);
	heroSphere.add(heroSphere2);

	scene.add( heroSphere );
	//scene.add(heroSphere1);

	//heroSphere2.position.y=heroBaseY;
	//heroSphere2.position.z=4.8;

	heroSphere.position.y=heroBaseY;
	heroSphere.position.z=4.8;

	currentLane=middleLane;
	heroSphere.position.x=currentLane;
	//heroSphere1.position.x=currentLane;
}
function addWorld(){
	var sides=80;
	var tiers=80;
	var sphereGeometry = new THREE.SphereGeometry( worldRadius, sides,tiers);
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0x1a56c5 ,shading:THREE.FlatShading} )

	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var nextVertexVector= new THREE.Vector3();
	var firstVertexVector= new THREE.Vector3();
	var offset= new THREE.Vector3();
	var currentTier=1;
	var lerpValue=0.5;
	var heightValue;
	var maxHeight=0.07;
	for(var j=1;j<tiers-2;j++){
		currentTier=j;
		for(var i=0;i<sides;i++){
			vertexIndex=(currentTier*sides)+1;
			vertexVector=sphereGeometry.vertices[i+vertexIndex].clone();
			if(j%2!==0){
				if(i==0){
					firstVertexVector=vertexVector.clone();
				}
				nextVertexVector=sphereGeometry.vertices[i+vertexIndex+1].clone();
				if(i==sides-1){
					nextVertexVector=firstVertexVector;
				}
				lerpValue=(Math.random()*(0.75-0.25))+0.25;
				vertexVector.lerp(nextVertexVector,lerpValue);
			}
			heightValue=(Math.random()*maxHeight)-(maxHeight/2);
			offset=vertexVector.clone().normalize().multiplyScalar(heightValue);
			sphereGeometry.vertices[i+vertexIndex]=(vertexVector.add(offset));
		}
	}
	rollingGroundSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	rollingGroundSphere.receiveShadow = true;
	rollingGroundSphere.castShadow=false;
	rollingGroundSphere.rotation.z=-Math.PI/2;
	scene.add( rollingGroundSphere );
	rollingGroundSphere.position.y=-24;
	rollingGroundSphere.position.z=5;
	addWorldenemys();
}
function addLight(){
	var light	= new THREE.AmbientLight( 0x020202 )
	scene.add( light )
	var hemisphereLight = new THREE.HemisphereLight(0xfffafa,0x000000, 1.5)
	scene.add(hemisphereLight);
	sun = new THREE.DirectionalLight( 0xcdc1c5, 0.6);
	sun.position.set( 12,6,-7 );
	sun.castShadow = true;
	scene.add(sun);
	//Set up shadow properties for the sun light
	sun.shadow.mapSize.width = 256;
	sun.shadow.mapSize.height = 256;
	sun.shadow.camera.near = 0.5;
	sun.shadow.camera.far = 50 ;
}
function addPathenemy(){
	var options=[0,1,2];
	var lane= Math.floor(Math.random()*3);
	addenemy(true,lane);
	options.splice(lane,1);
	if(Math.random()>0.5){
		lane= Math.floor(Math.random()*2);
		addenemy(true,options[lane]);
	}
}
function addWorldenemys(){
	var numenemys=36;
	var gap=6.28/36;
	for(var i=0;i<numenemys;i++){
		addenemy(false,i*gap, true);
		addenemy(false,i*gap, false);
	}
}
function addenemy(inPath, row, isLeft){
	var newenemy;
	if(inPath){
		if(enemysPool.length==0)return;
		newenemy=enemysPool.pop();
		newenemy.visible=true;
		//console.log("add enemy");
		enemysInPath.push(newenemy);
		sphericalHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4 );
	}else{
		newenemy=createenemy();
		var forestAreaAngle=0;//[1.52,1.57,1.62];
		if(isLeft){
			forestAreaAngle=1.68+Math.random()*0.1;
		}else{
			forestAreaAngle=1.46-Math.random()*0.1;
		}
		sphericalHelper.set( worldRadius-0.3, forestAreaAngle, row );
	}
	newenemy.position.setFromSpherical( sphericalHelper );
	var rollingGroundVector=rollingGroundSphere.position.clone().normalize();
	var enemyVector=newenemy.position.clone().normalize();
	newenemy.quaternion.setFromUnitVectors(enemyVector,rollingGroundVector);
	newenemy.rotation.x+=(Math.random()*(2*Math.PI/10))+-Math.PI/10;

	rollingGroundSphere.add(newenemy);
}
function createenemy(){
	var sides=4;
	var tiers=6;
	var scalarMultiplier=(Math.random()*(0.25-0.1))+0.05;
	var midPointVector= new THREE.Vector3();
	var vertexVector= new THREE.Vector3();
	var enemyGeometry = new THREE.ConeGeometry( 0.5, 1, sides, tiers);
	var enemyMaterial = new THREE.MeshStandardMaterial( { color: 0xc62c2b,shading:THREE.FlatShading  } );
		var enemyTop = new THREE.Mesh( enemyGeometry, enemyMaterial );
	enemyTop.castShadow=true;
	enemyTop.receiveShadow=false;
	enemyTop.position.y=0.5;
	enemyTop.rotation.y=(Math.random()*(Math.PI));
		var enemy =new THREE.Object3D();
	enemy.add(enemyTop);
	return enemy;
}

function update(){
	//stats.update();
    //animate

		if(explosionCount > 25){
			gameOver();
		}

    rollingGroundSphere.rotation.x += rollingSpeed;
    heroSphere.rotation.x -= heroRollingSpeed;
    if(heroSphere.position.y<=heroBaseY){
    	jumping=false;
    	bounceValue=(Math.random()*0.04)+0.005;
    }
    heroSphere.position.y+=bounceValue;
    heroSphere.position.x=THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());//clock.getElapsedTime());
    bounceValue-=gravity;
    if(clock.getElapsedTime()>enemyReleaseInterval){
    	clock.start();
    	addPathenemy();
			score+=2*enemyReleaseInterval;
			scoreText.innerHTML=score.toString();
			health = ((25 - explosionCount)/25)*100;
			healthText.innerHTML=parseInt(health).toString();

    }
    doenemyLogic();
    doExplosionLogic();
    render();

	requestAnimationFrame(update);//request next update
}
function doenemyLogic(){
	var temp = 0;
	var oneenemy;
	var enemyPos = new THREE.Vector3();
	var enemysToRemove=[];
	enemysInPath.forEach( function ( element, index ) {
		oneenemy=enemysInPath[ index ];
		enemyPos.setFromMatrixPosition( oneenemy.matrixWorld );
		if(enemyPos.z>6 &&oneenemy.visible){//gone out of our view zone
			enemysToRemove.push(oneenemy);
		}else{//check collision
				if(enemyPos.distanceTo(heroSphere.position)<=0.6){
					console.log("hit");
					hasCollided=true;
					explosionCount = explosionCount + 1;

					explode();
				}

		}
	});
	var fromWhere;
	enemysToRemove.forEach( function ( element, index ) {
		oneenemy=enemysToRemove[ index ];
		fromWhere=enemysInPath.indexOf(oneenemy);
		enemysInPath.splice(fromWhere,1);
		enemysPool.push(oneenemy);
		oneenemy.visible=false;
		console.log("remove enemy");
	});
}
function doExplosionLogic(){
	if(!particles.visible)return;
	for (var i = 0; i < particleCount; i ++ ) {
		particleGeometry.vertices[i].multiplyScalar(explosionPower);
	}
	if(explosionPower>1.005){
		explosionPower-=0.001;
	}else{
		particles.visible=false;
	}
	particleGeometry.verticesNeedUpdate = true;
}
function explode(){

	//$('#exp').trigger("play");
	particles.position.y=2;
	particles.position.z=4.8;
	particles.position.x=heroSphere.position.x;
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = -0.2+Math.random() * 0.4;
		vertex.y = -0.2+Math.random() * 0.4 ;
		vertex.z = -0.2+Math.random() * 0.4;
		particleGeometry.vertices[i]=vertex;
	}
	explosionPower=1.07;
	particles.visible=true;
}
function render(){
    renderer.render(scene, camera);//draw
}
function gameOver () {
	$('#bgsound').trigger("pause");  //Pause Sound bg
	healthText.innerHTML='0'; //Health to Zero
	document.getElementById('exp').src = '';
	var text2 = document.createElement('div');
text2.style.position = 'absolute';
//text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
text2.style.width = 400;
text2.style.fontSize=42+ 'px';
text2.style.color='white';
text2.style.height = 400;
text2.style.backgroundColor = "rgba(0,0,0,0)";
text2.innerHTML = '<p>GAME OVER</p>';
text2.style.top = 15 + '%';
text2.style.left = 40 + '%';

document.body.appendChild(text2);
  cancelAnimationFrame( globalRenderID );
  window.clearInterval( powerupSpawnIntervalID );






}
function onWindowResize() {
	//resize & align
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth/sceneHeight;
	camera.updateProjectionMatrix();
}
