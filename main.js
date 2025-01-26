class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('goal', 'assets/goal.png');
  }

  create() {
    // Ajuste para dispositivos responsivos
    this.cellSize = Math.min(this.scale.width / 16, this.scale.height / 12);
    this.mazeWidth = Math.floor(this.scale.width / this.cellSize);
    this.mazeHeight = Math.floor(this.scale.height / this.cellSize);

    // Criar grupo de paredes (agora com gráficos)
    this.wallGraphics = this.add.graphics();

    // Gerar o labirinto contínuo
    this.generateContinuousMaze();

    // Criar o jogador
    this.player = this.physics.add.sprite(this.cellSize / 2, this.cellSize / 2, 'player');
    this.player.setScale(0.5).setCollideWorldBounds(true);

    // Criar o objetivo
    const goalPosition = this.getGoalPosition();
    this.goal = this.physics.add.staticSprite(goalPosition.x, goalPosition.y, 'goal').setScale(0.5);

    // Detectar a colisão com o objetivo
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

    // Criar máscara de luz com raio reduzido
    this.lightMask = this.make.graphics();

    // Configurar controles do teclado
    this.cursors = this.input.keyboard.createCursorKeys();

    // Ajustar câmera ao labirinto
    this.cameras.main.setBounds(0, 0, this.mazeWidth * this.cellSize, this.mazeHeight * this.cellSize);
    this.cameras.main.startFollow(this.player);

    // Criar temporizador
    this.startTime = this.time.now;
    this.timerText = this.add.text(10, 10, 'Tempo: 0s', { font: '20px Arial', fill: '#000' }).setScrollFactor(0);

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

  generateContinuousMaze() {
    const maze = this.createMazeGrid();

    // Configurar o estilo das paredes
    this.wallGraphics.lineStyle(1, 0x444444, 1); // Linhas finas e contínuas

    for (let y = 0; y < this.mazeHeight; y++) {
      for (let x = 0; x < this.mazeWidth; x++) {
        if (maze[y][x] === 1) {
          // Desenhar as paredes como linhas contínuas
          this.drawWall(x, y);
        }
      }
    }
  }

  drawWall(x, y) {
    const x1 = x * this.cellSize;
    const y1 = y * this.cellSize;
    const x2 = x1 + this.cellSize;
    const y2 = y1 + this.cellSize;

    // Desenhar a parede como um retângulo de linhas
    this.wallGraphics.strokeRect(x1, y1, this.cellSize, this.cellSize);
  }

  createMazeGrid() {
    // Algoritmo de criação de labirinto (ex.: divisão recursiva)
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

    // Começar a esculpir no ponto inicial
    maze[1][1] = 0;
    carvePassages(1, 1);

    return maze;
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
    this.lightMask.arc(this.player.x, this.player.y, this.cellSize * 1.5, 0, Math.PI * 2); // Reduzir raio da luz
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
