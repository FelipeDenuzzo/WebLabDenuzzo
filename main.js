// Phaser 3: Labirinto com paredes contínuas e timer visível.

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

    // Criar grupo de paredes (usando gráficos para paredes contínuas)
    this.wallGraphics = this.add.graphics();
    this.wallGraphics.lineStyle(2, 0x444444, 1); // Linhas contínuas e finas
    this.generateMaze();

    this.walls = this.physics.add.staticGroup();
    this.createCollidableWalls();

    // Jogador
    this.player = this.physics.add.sprite(this.cellSize / 2, this.cellSize / 2, 'player');
    this.player.setScale(0.5).setCollideWorldBounds(true);
    this.checkPlayerStartPosition();

    this.physics.add.collider(this.player, this.walls);

    // Objetivo
    const goalPosition = this.getGoalPosition();
    this.goal = this.physics.add.staticSprite(goalPosition.x, goalPosition.y, 'goal').setScale(0.5);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    // Temporizador
    this.startTime = this.time.now;
    this.timerText = this.add.text(10, 10, 'Tempo: 0s', { font: '20px Arial', fill: '#000' });
    this.timerText.setDepth(1); // Tornar visível acima da máscara

    // Máscara de luz
    this.lightMask = this.make.graphics();

    // Configurar controles do teclado
    this.cursors = this.input.keyboard.createCursorKeys();

    // Ajustar câmera
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

  generateMaze() {
    // Geração do labirinto usando linhas contínuas
    const maze = Array.from({ length: this.mazeHeight }, () => Array(this.mazeWidth).fill(1));

    const carvePassages = (x, y) => {
      const directions = Phaser.Utils.Array.Shuffle([
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ]);

      for (const { dx, dy } of directions) {
        const nx = x + dx * 2;
        const ny = y + dy * 2;

        if (ny > 0 && ny < this.mazeHeight && nx > 0 && nx < this.mazeWidth && maze[ny][nx] === 1) {
          maze[y + dy][x + dx] = 0; // Remover parede intermediária
          maze[ny][nx] = 0; // Marcar célula como passagem
          carvePassages(nx, ny);
        }
      }
    };

    maze[1][1] = 0; // Início do labirinto
    carvePassages(1, 1);

    for (let y = 0; y < this.mazeHeight; y++) {
      for (let x = 0; x < this.mazeWidth; x++) {
        if (maze[y][x] === 1) {
          this.wallGraphics.strokeRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
  }

  createCollidableWalls() {
    // Criar paredes colidíveis com base nos gráficos do labirinto
    const maze = this.wallGraphics.geometryMask.geometry.data;

    maze.forEach(segment => {
      const wall = this.add.rectangle(segment.x, segment.y, segment.width, segment.height, 0x444444);
      this.physics.add.existing(wall, true);
      this.walls.add(wall);
    });
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

  getGoalPosition() {
    let goalX, goalY;
    do {
      goalX = Phaser.Math.Between(1, this.mazeWidth - 2) * this.cellSize + this.cellSize / 2;
      goalY = Phaser.Math.Between(1, this.mazeHeight - 2) * this.cellSize + this.cellSize / 2;
    } while (
      Phaser.Math.Distance.Between(goalX, goalY, this.player.x, this.player.y) < this.cellSize * 5
    );

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
