const players = {};

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    width: 800,
    height: 450,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    autoFocus: false
};

function preload() {
    this.load.image('blueShip', 'assets/blueShip.png');
    this.load.image('orangeShip', 'assets/orangeShip.png');
    this.load.image('laser', 'assets/laser.png');
    this.load.image('tiles', 'assets/spaceTiles-extruded.png');
    this.load.tilemapTiledJSON('map', 'assets/subspace2Map2.json');
}

function create() {
    const self = this;
    this.players = this.physics.add.group();
    this.projectiles = this.physics.add.group({ runChildUpdate: true });

    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('spaceTiles', 'tiles', 16, 16, 1, 2);
    const spaceLayer = map.createStaticLayer('space', tileset, 0, 0).setScale(1.2);
    const structureLayer = map.createStaticLayer('structure', tileset, 0, 0).setScale(1.2);

    spaceLayer.scrollFactorX = 0.2;
    spaceLayer.scrollFactorY = 0.2;

    structureLayer.setCollisionByProperty({ collides: true });

    this.physics.add.collider(this.players, structureLayer);
    this.physics.add.collider(this.players, this.projectiles);

    io.on('connection', socket => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
            removePlayer(self, socket.id);
            delete players[socket.id];
            io.emit('disconnect', socket.id);
        });

        socket.on('playerInput', inputData => {
            handlePlayerInput(self, socket.id, inputData);
        });

        players[socket.id] = {
            rotation: 0,
            x: 400,
            y: 400,
            playerId: socket.id,
            input: {
                left: false,
                right: false,
                up: false,
                down: false,
                space: false
            },
            weaponCooldown: 0
        };

        addPlayer(self, players[socket.id]);

        socket.emit('currentPlayers', players);

        socket.broadcast.emit('newPlayer', players[socket.id]);

        //shooting weapons
        socket.on('weaponFired', (player) => {
            fireWeapon(self, player);
        });
    });
}

function update(time, delta) {
    this.players.getChildren().forEach(player => {
        const input = players[player.playerId].input;
        if (input.left) {
            player.setAngularVelocity(-300);
        } else if(input.right) {
            player.setAngularVelocity(300);
        } else {
            player.setAngularVelocity(0);
        }
        
        if (input.up) {
            this.physics.velocityFromRotation(player.rotation, 200, player.body.acceleration);
        } else if (input.down) {
            this.physics.velocityFromRotation(player.rotation, -200, player.body.acceleration);
        } else {
            player.setAcceleration(0);
        }

        if (input.space) {
            if(players[player.playerId].weaponCooldown <= 0) {
                io.emit('weaponFired', player);
                players[player.playerId].weaponCooldown = 300;
                console.log(players[player.playerId].weaponCooldown);
                console.log('weapon shot by ', player.playerId);
            } else {
                console.log('weapon on cooldown');
            }
        }

        players[player.playerId].weaponCooldown -= delta;

        players[player.playerId].x = player.x;
        players[player.playerId].y = player.y;
        players[player.playerId].rotation = player.rotation;
    });

    io.emit('playerUpdates', players);
}

function handlePlayerInput(self, playerId, input) {
    self.players.getChildren().forEach(player => {
        if (playerId === player.playerId) {
            players[player.playerId].input = input;
        }
    });
}

function addPlayer(self, playerInfo) {
    const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'blueShip');
    player.setMaxVelocity(200);
    player.setScale(0.75);
    player.setCircle(15);
    player.setOffset(1, 1);
    player.playerId = playerInfo.playerId;
    self.players.add(player);
    player.setBounce(0.75);
    player.body.enable = true;
}

function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            player.destroy();
        }
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


    //console.log(player.rotation);

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
        return player.x + 20;
    } else if (player.rotation === (Math.PI/2) * -1) { //up
        return player.x;
    } else if (player.rotation === Math.PI) { //left
        return player.x - 20;
    } else if (player.rotation === (Math.PI / 2)) { //down
        return player.x;
    } else if (player.rotation < 0 && player.rotation > (Math.PI/2) * -1) {  //up-right
        return player.x + (20 * Math.cos(Math.abs(player.rotation)));
    } else if (player.rotation < (Math.PI/2) * -1 && player.rotation > Math.PI * -1) { //up-left
        return player.x + (20 * Math.cos(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI && player.rotation > Math.PI / 2) { //down-left
        return player.x + (20 * Math.cos(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI / 2 && player.rotation > 0) { //down-right
        return player.x + (20 * Math.cos(Math.abs(player.rotation)));
    }
}

function calcWeaponStartPositionY(player) {
    if (player.rotation === 0) {  //right
        return player.y;
    } else if (player.rotation === (Math.PI/2) * -1) {  //up
        return player.y - 20;
    } else if (player.rotation === Math.PI) {  //left
        return player.y;
    } else if (player.rotation === (Math.PI / 2)) {  //down
        return player.y + 20;
    } else if (player.rotation < 0 && player.rotation > (Math.PI/2) * -1) {  //up-right
        return player.y - (20 * Math.sin(Math.abs(player.rotation)));
    } else if (player.rotation < ((Math.PI/2) * -1) && player.rotation > (Math.PI * -1)) {  //up-left
        return player.y - (20 * Math.sin(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI && player.rotation > Math.PI / 2) {  //down-left
        return player.y + (20 * Math.sin(Math.abs(player.rotation)));
    } else if (player.rotation < Math.PI / 2 && player.rotation > 0) {  //down-right
        return player.y + (20 * Math.sin(Math.abs(player.rotation)));
    }
}
const game = new Phaser.Game(config);

window.gameLoaded();