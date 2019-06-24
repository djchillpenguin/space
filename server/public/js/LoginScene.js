class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: "LoginScene" })
    }

    preload() {
        this.load.image('blueShip', 'assets/blueShip.png');
        this.load.image('orangeShip', 'assets/orangeShip.png');
        this.load.image('greenShip', 'assets/greenShip.png');
        this.load.image('purpleShip', 'assets/purpleShip.png');
        this.load.image('redShip', 'assets/redShip.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('tiles', 'assets/spaceTiles-extruded.png');
        this.load.tilemapTiledJSON('map', 'assets/subspace2Map2.json');

        this.load.image('loginButton', 'assets/loginButton.png');
        this.load.image('leftButton', 'assets/leftButton.png');
        this.load.image('rightButton', 'assets/rightButton.png');

        this.load.spritesheet('engineFire', 'assets/engineFire.png', { frameWidth: 32, frameHeight: 32 });

        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('engine', 'assets/sounds/engine.wav');
        this.load.audio('shipHit', 'assets/sounds/shipHit.wav');
        this.load.audio('explosion', 'assets/sounds/explosion.wav');
        this.load.audio('wallBounceSound', 'assets/sounds/wallBounce.wav');
    }

    create() {
        let shipChoices = [
            'blueShip',
            'orangeShip',
            'greenShip',
            'purpleShip',
            'redShip'
        ];

        let loginButtonText = this.add.text((this.game.renderer.width / 2) - 36, 234, 'LOGIN',
                          { font: '24px monospace', fill: '#ffffff'});
        loginButtonText.setDepth(2);
        let loginButton = this.add.sprite(this.game.renderer.width / 2, 250, 'loginButton').setInteractive().setScale(4);
        let leftButton = this.add.sprite((this.game.renderer.width / 2) - 100, 100, 'leftButton').setInteractive().setScale(4);
        let rightButton = this.add.sprite((this.game.renderer.width / 2) + 100, 100, 'rightButton').setInteractive().setScale(4);
        let shipChoice = this.add.sprite(this.game.renderer.width / 2, 100, shipChoices[0]).setScale(4);

        loginButton.on('pointerdown', function (pointer) {
            let pilotname = document.getElementById("pilotname").value;
            let shipModel = shipChoices[0];
            //this.socket.emit('login', pilotname);
            document.getElementById("title").disabled = true;
            document.getElementById("title").style.display = "none";
            document.getElementById("pilotname").disabled = true;
            document.getElementById("pilotname").style.display = "none";
            document.getElementById("pilotNameLabel").disabled = true;
            document.getElementById("pilotNameLabel").style.display = "none";
            this.scene.start('BattleScene');
        }, this);

        leftButton.on('pointerdown', function (pointer) {
            let temp = shipChoices.shift();
            shipChoice.setTexture(shipChoices[0]);
            shipChoices.push(temp);
        }, this);

        rightButton.on('pointerdown', function (pointer) {
            let temp = shipChoices.pop();
            shipChoice.setTexture(temp);
            shipChoices.unshift(temp);
        }, this);
    }

    update() {
        
    }
}