class EngineFire extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        super(scene, 0, 0, 'engineFire');

        this.lifespan = 1200;
    }

    fire (ship) {
        this.setScale(1);
        this.setDepth(2);
        this.setPostion(ship.x, ship.y);
        this.setRotation(ship.rotation);
        this.setMaxVelocity(225);
        this.setVelocity(ship.body.velocity.x);
        this.setVelocityY(ship.body.velocity.y);
    }

    update (time, delta) {
        this.lifespan -= delta;

        if (this.lifespan <= 0 ) {
            this.destroy();
        }
    }
}