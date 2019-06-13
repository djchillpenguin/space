//import { BattleScene } from "./BattleScene";

const battleScene = new BattleScene();

const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'gamediv',
        mode: Phaser.Scale.RESIZE,
        width: 800,
        height: 450
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [ battleScene ]
};

const game = new Phaser.Game(config);


