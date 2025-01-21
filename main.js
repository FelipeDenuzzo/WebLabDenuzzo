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
    this.scale.refresh(); // Atualiza o tamanho do jogo com base na tela atual

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
    this.timerText = this.add.text(10, 10, 'Tempo: 0s', {
      font: '20px Arial',
      fill: '#000',
    });

    // Configurar controles do teclado
    this.cursors = this.input.keyboard.createCursorKeys();

    // Garantir que a câmera cobre apenas o labirinto
    this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);

    // Atualizar layout ao redimensionar a tela
    this.scale.on('resize', this.onResize, this);
  }

  update() {
    // Atualizar a movimentação do jogador
    this.updatePlayerMovement();

    // Atualizar o temporizador
    const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
    this.timerText.setText(`Tempo: ${elapsedTime}s`);
  }

  onResize(gameSize) {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);

    // Reposicionar elementos fixos (como o texto do temporizador)
    this.timerText.setPosition(10, 10);
  }

  generateMaze(wallsGroup) {
    const mazeWidth = 16;
    const mazeHeight = 12;
    const cellSize = Math.min(this.scale.width / mazeWidth, this.scale.height / mazeHeight);

    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        if (
          Math.random() < 0.3 || // Probabilidade de criar uma parede
          x === 0 || y === 0 || x === mazeWidth - 1 || y === mazeHeight - 1
        ) {
          const wall = this.add.rectangle(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            cellSize,
            cellSize / 2, // Ajusta a espessura das paredes
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
    const cellSize = Math.min(this.scale.width / mazeWidth, this.scale.height / mazeHeight);

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
    this.scene.restart(); // Reinicia o jogo
  }

  updatePlayerMovement() {
    const speed = 200;
    this.player.setVelocity(0);

    // Movimentação pelo teclado
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
  scale: {
    mode: Phaser.Scale.RESIZE, // Ativa redimensionamento automático
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centraliza o jogo na tela
  },
  scene: [MainScene],
};

const game = new Phaser.Game(config);
