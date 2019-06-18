class BattleScene extends Phaser.Scene {
    constructor() {
        super ({ key: "BattleScene" });
    }

    init(data){

    }

    preload(){
        this.load.image('blueShip', 'assets/blueShip.png');
        this.load.image('orangeShip', 'assets/orangeShip.png');

        this.load.image('tiles', 'assets/spaceTiles-extruded.png');
        this.load.tilemapTiledJSON('map', 'assets/subspace2Map2.json');

        this.load.spritesheet('engineFire', 'assets/engineFire.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        let camera = this.cameras.main;
        let self = this;
        this.socket = io();
        this.players = this.physics.add.group();

        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('spaceTiles', 'tiles', 16, 16, 1, 2);
        const spaceLayer = map.createStaticLayer('space', tileset, 0, 0).setScale(1);
        const structureLayer = map.createStaticLayer('structure', tileset, 0, 0).setScale(1);

        spaceLayer.scrollFactorX = 0.2;
        spaceLayer.scrollFactorY = 0.2;

        structureLayer.setCollisionByProperty({ collides: true });

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

        this.cursors = this.input.keyboard.createCursorKeys();
        this.leftKeyPressed = false;
        this.rightKeyPressed = false;
        this.upKeyPressed = false;
        this.downKeyPressed = false;

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
            /*let engineFire = this.physics.add.sprite(this.selfPlayer.x, this.selfPlayer.y, 'engineFire').play('shipEngineFire');
            engineFire.setRotation(this.selfPlayer.rotation);
            engineFire.setVelocityX(this.selfPlayer.body.velocity.x);
            engineFire.setVelocityY(this.selfPlayer.body.velocity.y);
            engineFire.on("animationcomplete", ()=> {
                engineFire.destroy();
            });*/

            fireEngines(this);
        } else if (this.cursors.down.isDown) {
            this.downKeyPressed = true;

            /*let engineFire = this.physics.add.sprite(this.selfPlayer.x, this.selfPlayer.y, 'engineFire').play('shipEngineFire');
            engineFire.setRotation(this.selfPlayer.rotation);
            engineFire.setVelocityX(this.selfPlayer.body.velocity.x);
            engineFire.setVelocityY(this.selfPlayer.body.velocity.y);
            engineFire.on("animationcomplete", ()=> {
                engineFire.destroy();
            });*/

            fireEngines(this);
        } else {
            this.upKeyPressed = false;
            this.downKeyPressed = false;
        }

        if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed) {
            this.socket.emit('playerInput', { left: this.leftKeyPressed, right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed });
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

    console.log(player);

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