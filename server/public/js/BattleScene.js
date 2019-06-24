class BattleScene extends Phaser.Scene {
    constructor() {
        super ({ key: "BattleScene" });
    }

    init(data){

    }

    preload(){
        
    }

    create() {
        //variables
        let camera = this.cameras.main;
        let self = this;
        this.socket = io();
        this.players = this.physics.add.group();
        this.projectiles = this.physics.add.group({ runChildUpdate: true });

        //map creation
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('spaceTiles', 'tiles', 16, 16, 1, 2);
        const spaceLayer = map.createStaticLayer('space', tileset, 0, 0).setScale(1.2);
        const structureLayer = map.createStaticLayer('structure', tileset, 0, 0).setScale(1.2);

        spaceLayer.scrollFactorX = 0.2;
        spaceLayer.scrollFactorY = 0.2;

        structureLayer.setCollisionByProperty({ collides: true });

        this.physics.add.collider(this.players, this.projectiles);

        //network stuff
        this.socket.on('currentPlayers', players => {
            Object.keys(players).forEach(id => {
                if (players[id].playerId === self.socket.id) {
                    this.selfPlayer = displayPlayers(self, players[id], 'blueShip');
                    camera.startFollow(this.selfPlayer);
                } else {
                    displayPlayers(self, players[id], 'orangeShip');
                }
            });
        });

        this.socket.on('newPlayer', playerInfo => {
            displayPlayers(self, playerInfo, 'orangeShip');
        });

        this.socket.on('disconnect', playerId => {
            self.players.getChildren().forEach(player => {
                if (playerId === player.playerId) {
                    player.destroy();
                }
            });
        });

        this.socket.on('playerUpdates', players => {
            Object.keys(players).forEach(id => {
                self.players.getChildren().forEach(player => {
                    if (players[id].playerId === player.playerId) {
                        player.setRotation(players[id].rotation);
                        player.setPosition(players[id].x, players[id].y);
                    }
                });
            });
        });

        this.socket.on('weaponFired', (player) => {
            fireWeapon(self, player)
        });

        //input creation
        this.cursors = this.input.keyboard.createCursorKeys();
        this.leftKeyPressed = false;
        this.rightKeyPressed = false;
        this.upKeyPressed = false;
        this.downKeyPressed = false;
        this.spaceKeyPressed = false;

        //animations
        this.anims.create({
           key: 'shipEngineFire',
           frames: this.anims.generateFrameNumbers('engineFire', { start: 0, end: 5 }),
           frameRate: 60,
           repeat: 0 
        });
    }

    update() {
        const left = this.leftKeyPressed;
        const right = this.rightKeyPressed;
        const up = this.upKeyPressed;
        const down = this.downKeyPressed;
        const space = this.spaceKeyPressed;

        if (this.cursors.left.isDown) {
            this.leftKeyPressed = true;
        } else if (this.cursors.right.isDown) {
            this.rightKeyPressed = true;
        } else {
            this.leftKeyPressed = false;
            this.rightKeyPressed = false;
        }

        if (this.cursors.up.isDown) {
            this.upKeyPressed = true;
            fireEngines(this);
        } else if (this.cursors.down.isDown) {
            this.downKeyPressed = true;
            fireEngines(this);
        } else {
            this.upKeyPressed = false;
            this.downKeyPressed = false;
        }

        if (this.cursors.space.isDown) {
            this.spaceKeyPressed = true;
        } else {
            this.spaceKeyPressed = false;
        }

        if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed || space !== this.spaceKeyPressed) {
            this.socket.emit('playerInput', { left: this.leftKeyPressed, right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed, space: this.spaceKeyPressed });
        }
    }
}

function displayPlayers(self, playerInfo, sprite) {
    const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, sprite);
    player.setScale(0.75);
    player.setCircle(15);
    player.setOffset(1, 1);
    player.setDepth(2);
    player.playerId = playerInfo.playerId;
    self.players.add(player);

    return player;
}

function fireEngines(self) {
    let engineFire = self.physics.add.sprite(self.selfPlayer.x, self.selfPlayer.y, 'engineFire').play('shipEngineFire');

    engineFire.setRotation(self.selfPlayer.rotation);
    engineFire.setVelocityX(self.selfPlayer.body.velocity.x);
    engineFire.setVelocityY(self.selfPlayer.body.velocity.y);
    engineFire.on("animationcomplete", ()=> {
        engineFire.destroy();
    });
}

function fireWeapon(self, player) {
    let laser = self.physics.add.sprite(player.x, player.y, 'laser');
    laser.setPosition(calcWeaponStartPositionX(player), calcWeaponStartPositionY(player));
    self.projectiles.add(laser);
    laser.setSize(4, 4);
    laser.setRotation(player.rotation);
    laser.body.rotation = player.rotation;
    laser.setScale(0.75);
    laser.setVisible(true);
    laser.setActive(true);
    laser.body.enable = true;
    laser.body.setMass(0.01);
    self.physics.velocityFromRotation(player.rotation, 500, laser.body.velocity);
    laser.lifespan = 2000;
    laser.update = function(time, delta){
        this.lifespan -= delta;
        if(this.lifespan <= 0){
            this.destroy();
        }
    }

    console.log(player.rotation);

    /*let laser = new Laser(self, player);
    console.log(laser.texture);
    laser.setVisible(true);
    laser.setTexture('blueShip');
    self.physics.add.sprite(laser);
    self.physics.velocityFromRotation(laser.rotation, 500, laser.body.velocity);
    console.log(laser);*/
}

function calcWeaponStartPositionX(player) {
    if (player.rotation === 0) { //right 
        return player.x + 12;
    } else if (player.rotation === (Math.PI/2) * -1) { //up
        return player.x;
    } else if (player.rotation === Math.PI) { //left
        return player.x - 12;
    } else if (player.rotation === (Math.PI / 2)) { //down
        return player.x;
    } else if (player.rotation < 0 && player.rotation > (Math.PI/2) * -1) {  //up-right
        return player.x + (12 * Math.cos(Math.abs(player.rotation)));
    } else if (player.rotation < (Math.PI/2) * -1 && player.rotation > Math.PI * -1) { //up-left
        return player.x + (12 * Math.cos(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI && player.rotation > Math.PI / 2) { //down-left
        return player.x + (12 * Math.cos(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI / 2 && player.rotation > 0) { //down-right
        return player.x + (12 * Math.cos(Math.abs(player.rotation)));
    }
}

function calcWeaponStartPositionY(player) {
    if (player.rotation === 0) {  //right
        return player.y;
    } else if (player.rotation === (Math.PI/2) * -1) {  //up
        return player.y - 12;
    } else if (player.rotation === Math.PI) {  //left
        return player.y;
    } else if (player.rotation === (Math.PI / 2)) {  //down
        return player.y + 12;
    } else if (player.rotation < 0 && player.rotation > (Math.PI/2) * -1) {  //up-right
        return player.y - (12 * Math.sin(Math.abs(player.rotation)));
    } else if (player.rotation < ((Math.PI/2) * -1) && player.rotation > (Math.PI * -1)) {  //up-left
        return player.y - (12 * Math.sin(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI && player.rotation > Math.PI / 2) {  //down-left
        return player.y + (12 * Math.sin(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI / 2 && player.rotation > 0) {  //down-right
        return player.y + (12 * Math.sin(Math.abs(player.rotation)));
    }
}