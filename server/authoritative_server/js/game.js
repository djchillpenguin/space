const players = {};

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    width: 800,
    height: 450,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
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

    this.load.image('tiles', 'assets/spaceTiles-extruded.png');
    this.load.tilemapTiledJSON('map', 'assets/subspace2Map2.json');
}

function create() {
    const self = this;
    this.players = this.physics.add.group();

    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('spaceTiles', 'tiles', 16, 16, 1, 2);
    const spaceLayer = map.createStaticLayer('space', tileset, 0, 0).setScale(1);
    const structureLayer = map.createStaticLayer('structure', tileset, 0, 0).setScale(1);

    spaceLayer.scrollFactorX = 0.2;
    spaceLayer.scrollFactorY = 0.2;

    structureLayer.setCollisionByProperty({ collides: true });

    this.physics.add.collider(this.players, structureLayer);

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
            x: 200,
            y: 200,
            playerId: socket.id,
            input: {
                left: false,
                right: false,
                up: false,
                down: false
            }
        };

        addPlayer(self, players[socket.id]);

        socket.emit('currentPlayers', players);

        socket.broadcast.emit('newPlayer', players[socket.id]);
    });
}

function update() {
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

const game = new Phaser.Game(config);

window.gameLoaded();