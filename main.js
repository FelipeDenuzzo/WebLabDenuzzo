from flask import Flask, jsonify, request
import random

app = Flask(__name__)

# Configuração inicial do labirinto
CELL_SIZE = 50  # Tamanho de cada célula do labirinto
MAZE_WIDTH = 16  # Número de células na largura
MAZE_HEIGHT = 12  # Número de células na altura

# Função para gerar o labirinto
def generate_maze(width, height):
    maze = [[1 for _ in range(width)] for _ in range(height)]

    def carve_passages(x, y):
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        random.shuffle(directions)

        for dx, dy in directions:
            nx, ny = x + dx * 2, y + dy * 2
            if 0 <= ny < height and 0 <= nx < width and maze[ny][nx] == 1:
                maze[y + dy][x + dx] = 0  # Remove parede intermediária
                maze[ny][nx] = 0  # Marcar célula como passagem
                carve_passages(nx, ny)

    maze[1][1] = 0  # Início do labirinto
    carve_passages(1, 1)
    return maze

# Rota para gerar o labirinto
@app.route('/generate-maze', methods=['GET'])
def generate_maze_route():
    maze = generate_maze(MAZE_WIDTH, MAZE_HEIGHT)
    return jsonify({"maze": maze})

# Rota para obter o estado inicial do jogo
@app.route('/get-initial-state', methods=['GET'])
def get_initial_state():
    player_start = {"x": CELL_SIZE // 2, "y": CELL_SIZE // 2}
    goal_position = {
        "x": random.randint(1, MAZE_WIDTH - 2) * CELL_SIZE + CELL_SIZE // 2,
        "y": random.randint(1, MAZE_HEIGHT - 2) * CELL_SIZE + CELL_SIZE // 2
    }
    return jsonify({
        "player_start": player_start,
        "goal_position": goal_position
    })

# Rota para validar o movimento do jogador (opcional)
@app.route('/player-move', methods=['POST'])
def player_move():
    data = request.json
    player_position = data.get('player_position')
    move = data.get('move')  # Ex: {"x": 1, "y": 0}

    # Lógica para validar movimento (se necessário)
    # Exemplo: Garantir que o jogador não atravessa paredes

    return jsonify({"valid": True, "new_position": player_position})

if __name__ == '__main__':
    app.run(debug=True)
