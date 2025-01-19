let player;
let cursors;
let lightMask;
let walls;
let goal;
let timerText;
let startTime;
let mazeVisible = false; // Variável para controlar a visibilidade do labirinto

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff', // Fundo branco
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

function preload() {
    // Carregar a imagem do jogador e do objetivo
    this.load.image('player', 'assets/player.png'); // Imagem do jogador
    this.load.image('goal', 'assets/goal.png'); // Imagem do ponto de chegada
}

function create() {
    // Criar grupo de paredes
    walls = this.physics.add.staticGroup();

    // Gerar o labirinto
    generateMaze(this, walls);

    // Criar o jogador como um sprite
    player = this.physics.add.sprite(40, 40, 'player');
    player.setScale(0.5); // Ajusta o tamanho do jogador
    player.setCollideWorldBounds(true); // Impede o jogador de sair da tela

    // Verificar se o jogador começa preso
    checkPlayerStartPosition(player, walls);

    // Configurar os controles com as setas do teclado
    cursors = this.input.keyboard.createCursorKeys();

    // Adicionar colisão entre o jogador e as paredes
    this.physics.add.collider(player, walls);

    // Criar o temporizador
    startTime = this.time.now;
    timerText = this.add.text(10, 10, 'Tempo: 0', {
        font: '20px Arial',
        fill: '#000000', // Cor preta para o timer
    });

    // Criar o círculo de luz ao redor do jogador
    lightMask = this.make.graphics();

    // Criar o objetivo com a imagem (ajustado para ser acessível)
    const goalPosition = getGoalPosition(walls); // Função para garantir a posição livre
    goal = this.add.sprite(goalPosition.x, goalPosition.y, 'goal'); // Usando imagem para o ponto de chegada
    goal.setScale(0.5); // Ajustar a escala da imagem do objetivo

    this.physics.add.existing(goal, true); // Tornar o objetivo imutável

    // Detectar a colisão do jogador com o objetivo
    this.physics.add.overlap(player, goal, () => {
        const endTime = Math.floor((this.time.now - startTime) / 1000);
        alert(`Parabéns! Você chegou ao fim em ${endTime} segundos.`);
        
        // Exibir o labirinto completo
        mazeVisible = true;

        // Remover a máscara de luz
        scene.cameras.main.setMask(null); // Exibir o labirinto completo sem a máscara de luz
    });

    // Definir limites da câmera
    this.cameras.main.setBounds(0, 0, config.width, config.height);
}

function update() {
    // Resetar a velocidade do jogador
    player.setVelocity(0);

    // Movimentação do jogador com as teclas de seta
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.setRotation(Math.PI); // Rotaciona o jogador para a esquerda
    }
    if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.setRotation(0); // Rotaciona o jogador para a direita
    }
    if (cursors.up.isDown) {
        player.setVelocityY(-200);
        player.setRotation(-Math.PI / 2); // Rotaciona o jogador para cima
    }
    if (cursors.down.isDown) {
        player.setVelocityY(200);
        player.setRotation(Math.PI / 2); // Rotaciona o jogador para baixo
    }

    // Atualizar o tempo decorrido no temporizador
    const elapsedTime = Math.floor((this.time.now - startTime) / 1000);
    timerText.setText(`Tempo: ${elapsedTime}s`);

    // Atualizar a luz ao redor do jogador
    updateLighting(this);
}

function generateMaze(scene, wallsGroup) {
    const mazeWidth = 16;
    const mazeHeight = 12;
    const cellSize = 50;

    // Gerar o labirinto com paredes
    for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
            if (
                Math.random() < 0.3 || // Probabilidade de criar uma parede
                x === 0 || // Paredes nas bordas
                y === 0 ||
                x === mazeWidth - 1 ||
                y === mazeHeight - 1
            ) {
                // Criar uma parede como retângulo
                const wall = scene.add.rectangle(
                    x * cellSize,
                    y * cellSize,
                    cellSize,
                    cellSize,
                    0x444444 // Cor cinza escuro para as paredes
                );
                scene.physics.add.existing(wall, true); // Tornar a parede física
                wallsGroup.add(wall);
            }
        }
    }
}

function checkPlayerStartPosition(player, walls) {
    // Verificar se o jogador está preso ao inicializar
    const playerBounds = player.getBounds();

    walls.children.iterate(wall => {
        const wallBounds = wall.getBounds();

        // Se o jogador está colidindo com uma parede na posição inicial, reposicionar
        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, wallBounds)) {
            player.setPosition(40, 40); // Reposicionar o jogador
        }
    });
}

function getGoalPosition(walls) {
    // Função para garantir uma posição livre para o objetivo
    const mazeWidth = 16;
    const mazeHeight = 12;
    const cellSize = 50;

    let positionFound = false;
    let goalX, goalY;

    while (!positionFound) {
        // Tentar uma posição aleatória
        goalX = Math.floor(Math.random() * (mazeWidth - 1)) * cellSize + cellSize / 2;
        goalY = Math.floor(Math.random() * (mazeHeight - 1)) * cellSize + cellSize / 2;

        // Verificar se a posição não colide com paredes
        positionFound = true;

        walls.children.iterate(wall => {
            const wallBounds = wall.getBounds();
            const goalBounds = new Phaser.Geom.Rectangle(goalX - 25, goalY - 25, 50, 50); // Considerar o tamanho do objetivo

            if (Phaser.Geom.Intersects.RectangleToRectangle(goalBounds, wallBounds)) {
                positionFound = false; // Se colidir, tentar novamente
            }
        });
    }

    return { x: goalX, y: goalY };
}

function updateLighting(scene) {
    if (mazeVisible) {
        return; // Não aplicar a máscara de luz se o labirinto for completamente iluminado
    }

    // Limpar a luz anterior
    lightMask.clear();

    // Desenhar uma máscara de luz circular ao redor do jogador
    const lightRadius = 100; // Ajustado para um círculo menor
    lightMask.fillStyle(0xffffff, 1);
    lightMask.fillCircle(player.x, player.y, lightRadius);

    // Criar uma máscara para a cena
    const mask = new Phaser.Display.Masks.GeometryMask(scene, lightMask);
    scene.cameras.main.setMask(mask);

    // Atualizar a visibilidade das paredes com base na área de luz
    walls.children.iterate(wall => {
        const wallBounds = wall.getBounds();
        const dx = wallBounds.centerX - player.x;
        const dy = wallBounds.centerY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        wall.visible = distance <= lightRadius;
    });
}
