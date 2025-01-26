createContinuousWalls() {
  this.wallGraphics.clear(); // Limpa quaisquer gráficos existentes
  this.wallGraphics.lineStyle(2, 0x444444, 1); // Define espessura e cor das linhas

  // Desenho de paredes contínuas nas bordas do labirinto
  const width = this.mazeWidth * this.cellSize;
  const height = this.mazeHeight * this.cellSize;

  // Paredes superiores e inferiores
  this.wallGraphics.strokeLineShape(new Phaser.Geom.Line(0, 0, width, 0)); // Parede superior
  this.wallGraphics.strokeLineShape(new Phaser.Geom.Line(0, height, width, height)); // Inferior

  // Paredes laterais
  this.wallGraphics.strokeLineShape(new Phaser.Geom.Line(0, 0, 0, height)); // Esquerda
  this.wallGraphics.strokeLineShape(new Phaser.Geom.Line(width, 0, width, height)); // Direita

  // Adicionando colisões para essas paredes
  this.createCollidableWallsFromLines([
    new Phaser.Geom.Line(0, 0, width, 0),
    new Phaser.Geom.Line(0, height, width, height),
    new Phaser.Geom.Line(0, 0, 0, height),
    new Phaser.Geom.Line(width, 0, width, height),
  ]);
}

createCollidableWallsFromLines(lines) {
  lines.forEach(line => {
    const wall = this.add.rectangle(
      (line.x1 + line.x2) / 2,
      (line.y1 + line.y2) / 2,
      Math.abs(line.x2 - line.x1) || 2, // Se for uma linha vertical, largura mínima
      Math.abs(line.y2 - line.y1) || 2, // Se for uma linha horizontal, altura mínima
      0x444444
    );

    this.physics.add.existing(wall, true); // Torna a parede estática
    this.walls.add(wall);
  });
}
