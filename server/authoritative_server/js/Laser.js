class Laser extends Phaser.GameObjects.Sprite {
    constructor(scene, player){
        super(scene, player.x, player.y, 'laser');
        
        scene.add.sprite(this);
        scene.physics.world.enableBody(this);
        this.shooterId = player.playerId;
        this.setRotation(player.rotation);
        this.setScale(0.75);
        this.setDepth(10);
        this.setVisible(true);
        this.setActive(true);
        this.body.enable = true;
        this.body.setMass(0.01);
        //scene.physics.velocityFromRotation(player.rotation, 500, this.body.velocity);
        scene.projectiles.add(this);
    }
}