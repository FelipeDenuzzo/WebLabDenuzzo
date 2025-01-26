class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('goal', 'assets/goal.png');
  }

  create() {
    this.cellSize = Math.min(this.scale.width / 16, this.scale.height / 12);
    this.mazeWidth = Math.floor(this.scale.width / this.cellSize);
    this.mazeHeight = Math.floor(this.scale.height / this.cellSize);

    this.walls = this.physics.add.staticGroup();
    this.generateMaze(this.walls);

    this.player = this.physics.add.sprite(this.cellSize / 2, this.cellSize / 2, 'player');
    this.player.setScale(0.5).setCollideWorldBounds(true);
    this.checkPlayerStartPosition();

    this.physics.add.collider(this.player, this.walls);

    const goalPosition = this.getGoalPosition(this.walls);
    this.goal = this.physics.add.staticSprite(goalPosition.x, goalPosition.y, 'goal').setScale(0.5);

    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    this.startTime = this.time.now;
    this.timerText = this.add.text(10, 10, 'Tempo: 0s', { font: '20px Arial', fill: '#000' }).setScrollFactor(0);

    this.lightMask = this.make.graphics();
    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBounds(0, 0, this.mazeWidth * this.cellSize, this.mazeHeight * this.cellSize);
    this.cameras.main.startFollow(this.player);

    this.scale.on('resize', this.resizeGame, this);
  }

  update() {
    this.updatePlayerMovement();

    const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
    this.timerText.setText(`Tempo: ${elapsedTime}s`);

    this.updateLighting();
  }

  generateMaze(wallsGroup) {
    for (let y = 0; y < this.mazeHeight; y++) {
      for (let x = 0; x < this.mazeWidth; x++) {
        if (
          Math.random() < 0.3 ||
          x === 0 || y === 0 || x === this.mazeWidth - 1 || y === this.mazeHeight - 1
        ) {
          const wallWidth = this.cellSize * 0.5;
          const wallHeight = this.cellSize * 0.2;

          const wall = this.add.rectangle(
            x * this.cellSize + this.cellSize / 2,
            y * this.cellSize + this.cellSize / 2,
            wallWidth,
            wallHeight,
            0x444444
          );

          this.physics.add.existing(wall, true);
          wallsGroup.add(wall);
        }
      }
    }
  }

  checkPlayerStartPosition() {
    let isPositionValid = false;

    while (!isPositionValid) {
      const startX = Phaser.Math.Between(1, this.mazeWidth - 2) * this.cellSize + this.cellSize / 2;
      const startY = Phaser.Math.Between(1, this.mazeHeight - 2) * this.cellSize + this.cellSize / 2;

      const playerBounds = new Phaser.Geom.Rectangle(
        startX - this.player.width / 2,
        startY - this.player.height / 2,
        this.player.width,
        this.player.height
      );

      isPositionValid = true;
      this.walls.children.iterate(wall => {
        const wallBounds = wall.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, wallBounds)) {
          isPositionValid = false;
        }
      });

      if (isPositionValid) {
        this.player.setPosition(startX, startY);
      }
    }
  }

  getGoalPosition(wallsGroup) {
    let goalX, goalY;
    let positionFound = false;

    while (!positionFound) {
      goalX = Phaser.Math.Between(1, this.mazeWidth - 2) * this.cellSize + this.cellSize / 2;
      goalY = Phaser.Math.Between(1, this.mazeHeight - 2) * this.cellSize + this.cellSize / 2;

      positionFound = true;
      wallsGroup.children.iterate(wall => {
        const wallBounds = wall.getBounds();
        const goalBounds = new Phaser.Geom.Rectangle(goalX - this.cellSize / 2, goalY - this.cellSize / 2, this.cellSize, this.cellSize);
        if (Phaser.Geom.Intersects.RectangleToRectangle(goalBounds, wallBounds)) {
          positionFound = false;
        }
      });
    }

    return { x: goalX, y: goalY };
  }

  reachGoal() {
    const endTime = Math.floor((this.time.now - this.startTime) / 1000);
    alert(`Parabéns! Você chegou ao fim em ${endTime} segundos.`);
    this.scene.restart();
  }

  updatePlayerMovement() {
    const speed = 200;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed).setRotation(Math.PI);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed).setRotation(0);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed).setRotation(-Math.PI / 2);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed).setRotation(Math.PI / 2);
    }
  }

  updateLighting() {
    this.lightMask.clear();
    this.lightMask.fillStyle(0xffffff, 1);
    this.lightMask.beginPath();
    this.lightMask.arc(this.player.x, this.player.y, this.cellSize * 2, 0, Math.PI * 2);
    this.lightMask.fillPath();

    const mask = new Phaser.Display.Masks.GeometryMask(this, this.lightMask);
    this.cameras.main.setMask(mask);
  }

  resizeGame(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.resize(width, height);
    this.cellSize = Math.min(width / 16, height / 12);
    this.scene.restart();
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
