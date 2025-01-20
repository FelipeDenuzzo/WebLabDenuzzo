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
    // Criar grupo de paredes
    this.walls = this.physics.add.staticGroup();

    // Gerar o labirinto
    this.generateMaze(this.walls);

    // Criar o jogador
    this.player = this.physics.add.sprite(40, 40, 'player');
    this.player.setScale(0.5).setCollideWorldBounds(true);

    // Verificar a posição inicial do jogador
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
    this.timerText = this.add.text(10, 10, 'Tempo: 0s', { font: '20px Arial', fill: '#000' });

    // Criar o círculo de luz
    this.lightMask = this.make.graphics();

    // Configurar controles do teclado
    this.cursors = this.input.keyboard.createCursorKeys();

    // Garantir que a câmera cobre apenas o labirinto
    this.cameras.main.setBounds(0, 0, 800, 600);
  }

  update() {
    // Atualizar a movimentação do jogador
    this.updatePlayerMovement();

    // Atualizar o temporizador
    const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
    this.timerText.setText(`Tempo: ${elapsedTime}s`);

    // Atualizar a máscara de luz
    this.updateLighting();
  }

  generateMaze(wallsGroup) {
    const mazeWidth = 16;
    const mazeHeight = 12;
    const cellSize = 50;

    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        if (
          Math.random() < 0.3 || // Probabilidade de criar uma parede
          x === 0 || y === 0 || x === mazeWidth - 1 || y === mazeHeight - 1
        ) {
          const wall = this.add.rectangle(
            x * cellSize,
            y * cellSize,
            cellSize,
            cellSize,
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
        this.player.setPosition(40, 40);
      }
    });
  }

  getGoalPosition(wallsGroup) {
    const mazeWidth = 16;
    const mazeHeight = 12;
    const cellSize = 50;

    let goalX, goalY;
    let positionFound = false;

    while (!positionFound) {
      goalX = Math.floor(Math.random() * (mazeWidth - 1)) * cellSize + cellSize / 2;
      goalY = Math.floor(Math.random() * (mazeHeight - 1)) * cellSize + cellSize / 2;

      positionFound = true;
      wallsGroup.children.iterate(wall => {
        const wallBounds = wall.getBounds();
        const goalBounds = new Phaser.Geom.Rectangle(goalX - 25, goalY - 25, 50, 50);
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
  }

  updatePlayerMovement() {
    const speed = 200;
    this.player.setVelocity(0);
  
    // Movimentação pelo teclado
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
    this.lightMask.arc(this.player.x, this.player.y, 100, 0, Math.PI * 2);
    this.lightMask.fillPath();

    const mask = new Phaser.Display.Masks.GeometryMask(this, this.lightMask);
    this.cameras.main.setMask(mask);
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
    const buttonSize = 60;
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    this.controlButtons = {
      up: this.add
        .image(screenWidth / 2, 620, 'buttonUp')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
      down: this.add
        .image(screenWidth / 2, 680, 'buttonDown')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
      left: this.add
        .image(screenWidth / 2 - buttonSize, 650, 'buttonLeft')
        .setInteractive()
        .setDisplaySize(buttonSize, buttonSize),
      right: this.add
        .image(screenWidth / 2 + buttonSize, 650, 'buttonRight')
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
  width: 800,
  height: 700,
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [MainScene, UIScene],
};

const game = new Phaser.Game(config);
