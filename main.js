// Phaser 3: Jogo de labirinto responsivo com paredes finas, reinício automático, e suporte para dispositivos móveis

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('goal', 'assets/goal.png');
    this.load.image('buttonUp', 'assets/buttontop.png');
    this.load.image('buttonDown', 'assets/buttondown.png');
    this.load.image('buttonLeft', 'assets/buttonleft.png');
    this.load.image('buttonRight', 'assets/buttonright.png');
  }

  create() {
    // Ajuste para dispositivos responsivos
    this.cellSize = Math.min(this.scale.width / 16, this.scale.height / 12);
    this.mazeWidth = Math.floor(this.scale.width / this.cellSize);
    this.mazeHeight = Math.floor(this.scale.height / this.cellSize);

    // Criar grupo de paredes
    this.walls = this.physics.add.staticGroup();

    // Gerar o labirinto
    this.generateMaze(this.walls);

    // Criar o jogador
    this.player = this.physics.add.sprite(this.cellSize / 2, this.cellSize / 2, 'player');
    this.player.setScale(0.5).setCollideWorldBounds(true);
    this.checkPlayerStartPosition();

    // Adicionar colisão entre o jogador e as paredes
    this.physics.add.collider(this.player, this.walls);

    // Criar o objetivo
    const goalPosition = this.getGoalPosition(this.walls);
    this.goal = this.physics.add.staticSprite(goalPosition.x, goalPosition.y, 'goal').setScale(0.5);

    // Detectar a colisão com o objetivo
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    // Criar o temporizador
    this.startTime = this.time.now;
    this.timerText = this.add.text(10, 10, 'Tempo: 0s', { font: '20px Arial', fill: '#000' }).setScrollFactor(0);

    // Criar máscara de luz
    this.lightMask = this.make.graphics();

    // Configurar controles do teclado
    this.cursors = this.input.keyboard.createCursorKeys();

    // Ajustar câmera ao labirinto
    this.cameras.main.setBounds(0, 0, this.mazeWidth * this.cellSize, this.mazeHeight * this.cellSize);
    this.cameras.main.startFollow(this.player);

    // Evento de redimensionamento
    this.scale.on('resize', this.resizeGame, this);
  }

  update() {
    // Atualizar movimentação
    this.updatePlayerMovement();

    // Atualizar temporizador
    const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
    this.timerText.setText(`Tempo: ${elapsedTime}s`);

    // Atualizar máscara de luz
    this.updateLighting();
  }

  generateMaze(wallsGroup) {
    for (let y = 0; y < this.mazeHeight; y++) {
      for (let x = 0; x < this.mazeWidth; x++) {
        if (
          Math.random() < 0.3 || // Probabilidade de criar uma parede
          x === 0 || y === 0 || x === this.mazeWidth - 1 || y === this.mazeHeight - 1
        ) {
          const wall = this.add.rectangle(
            x * this.cellSize + this.cellSize / 2,
            y * this.cellSize + this.cellSize / 2,
            this.cellSize * 0.8,
            this.cellSize * 0.8,
            0x444444
          );
          this.physics.add.existing(wall, true);
          wallsGroup.add(wall);
        }
      }
    }
  }

  checkPlayerStartPosition() {
    const playerBounds = this.player.getBounds();
    this.walls.children.iterate(wall => {
      const wallBounds = wall.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, wallBounds)) {
        this.player.setPosition(this.cellSize / 2, this.cellSize / 2);
      }
    });
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

    if (this.cursors.left.isDown || buttonStates.left) {
      this.player.setVelocityX(-speed).setRotation(Math.PI);
    } else if (this.cursors.right.isDown || buttonStates.right) {
      this.player.setVelocityX(speed).setRotation(0);
    }

    if (this.cursors.up.isDown || buttonStates.up) {
      this.player.setVelocityY(-speed).setRotation(-Math.PI / 2);
    } else if (this.cursors.down.isDown || buttonStates.down) {
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

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
  }

  preload() {
    this.load.image('buttonUp', 'assets/buttontop.png');
    this.load.image('buttonDown', 'assets/buttondown.png');
    this.load.image('buttonLeft', 'assets/buttonleft.png');
    this.load.image('buttonRight', 'assets/buttonright.png');
  }

  create() {
    const buttonSize = Math.min(this.scale.width, this.scale.height) / 10;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    this.controlButtons = {
      up: this.add
        .image(screenWidth / 2, screenHeight - buttonSize * 2.5, 'buttonUp')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
      down: this.add
        .image(screenWidth / 2, screenHeight - buttonSize / 2, 'buttonDown')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
      left: this.add
        .image(screenWidth / 2 - buttonSize, screenHeight - buttonSize * 1.5, 'buttonLeft')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
      right: this.add
        .image(screenWidth / 2 + buttonSize, screenHeight - buttonSize * 1.5, 'buttonRight')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
    };

    Object.values(this.controlButtons).forEach(button => {
      button.setScrollFactor(0);
    });

    this.controlButtons.up.on('pointerdown', () => (buttonStates.up = true));
    this.controlButtons.up.on('pointerup', () => (buttonStates.up = false));

    this.controlButtons.down.on('pointerdown', () => (buttonStates.down = true));
    this.controlButtons.down.on('pointerup', () => (buttonStates.down = false));

    this.controlButtons.left.on('pointerdown', () => (buttonStates.left = true));
    this.controlButtons.left.on('pointerup', () => (buttonStates.left = false));

    this.controlButtons.right.on('pointerdown', () => (buttonStates.right = true));
    this.controlButtons.right.on('pointerup', () => (buttonStates.right = false));
  }
}

const buttonStates = { up: false, down: false, left: false, right: false };

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
  scene: [MainScene, UIScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
