class Laser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, player){
        super(scene, player.x, player.y, 'laser');
        scene.add.sprite(this);
        scene.physics.world.enableBody(this);
        this.shooterId = player.playerId;
        this.setSize(4, 4);
        this.setRotation(player.rotation);
        this.setScale(1);
        this.setVisible(true);
        this.setActive(true);
        this.body.enable = true;
        this.body.setMass(0.01);
        //scene.physics.velocityFromRotation(player.rotation, 500, this.body.velocity);
        //scene.projectiles.add(this);
        console.log('check');
    }
}