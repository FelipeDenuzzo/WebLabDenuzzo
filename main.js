import os
import math
import sys
from PIL import Image, ImageQt
from PyQt6.QtWidgets import (QApplication, QMainWindow, QLabel, QPushButton, QFileDialog, QVBoxLayout, QWidget, QProgressBar, QHBoxLayout, QMessageBox, QInputDialog, QSlider)
from PyQt6.QtCore import QThread, pyqtSignal, Qt

# Thread para Processamento em Segundo Plano
class MosaicoThread(QThread):
    progress = pyqtSignal(int)
    completed = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, largura_cm, altura_cm, tamanho_base_px, espaco_px, repeticoes, imagens_disponiveis, imagem_referencia, pasta_imagens_base):
        super().__init__()
        self.largura_cm = largura_cm
        self.altura_cm = altura_cm
        self.tamanho_base_px = tamanho_base_px
        self.espaco_px = espaco_px
        self.repeticoes = repeticoes
        self.imagens_disponiveis = imagens_disponiveis
        self.imagem_referencia = imagem_referencia
        self.pasta_imagens_base = pasta_imagens_base

    def calcular_imagens_necessarias(self):
        # Conversão de tamanho total da célula para pixels considerando espaçamento
        celula_total_px = self.tamanho_base_px + self.espaco_px

        # Conversão de largura e altura para pixels
        largura_px = int(self.largura_cm * 118)  # 118 pixels/cm
        altura_px = int(self.altura_cm * 118)

        # Número total de células necessárias no mosaico
        total_celulas = (largura_px // celula_total_px) * (altura_px // celula_total_px)

        # Ajuste considerando o número de repetições permitidas
        total_imagens_necessarias = math.ceil(total_celulas / self.repeticoes)

        return total_imagens_necessarias

    def calcular_cor_media(self, imagem):
        imagem = imagem.resize((1, 1))  # Reduz para 1x1 pixel
        return imagem.getpixel((0, 0))

    def encontrar_melhor_cor(self, cor, cores_medias):
        melhor_cor = None
        menor_diferenca = float("inf")
        for caminho, cor_base in cores_medias:
            diferenca = math.sqrt(sum((cor[i] - cor_base[i]) ** 2 for i in range(3)))
            if diferenca < menor_diferenca:
                menor_diferenca = diferenca
                melhor_cor = caminho
        return melhor_cor

    def run(self):
        try:
            largura_px = int(self.largura_cm * 118)
            altura_px = int(self.altura_cm * 118)

            imagens_necessarias = self.calcular_imagens_necessarias()
            if self.imagens_disponiveis < imagens_necessarias:
                self.error.emit(f"Faltam {imagens_necessarias - self.imagens_disponiveis} imagens base.")
                return

            # Redimensionar imagens base
            pasta_redimensionada = os.path.join(self.pasta_imagens_base, "resized")
            os.makedirs(pasta_redimensionada, exist_ok=True)

            imagens_redimensionadas = []
            cores_medias = []
            arquivos = [f for f in os.listdir(self.pasta_imagens_base) if f.lower().endswith((".png", ".jpg", ".jpeg"))]

            for i, nome_arquivo in enumerate(arquivos):
                caminho_arquivo = os.path.join(self.pasta_imagens_base, nome_arquivo)
                with Image.open(caminho_arquivo) as img:
                    img = img.convert("RGBA")
                    img_redimensionada = img.resize((self.tamanho_base_px, self.tamanho_base_px), Image.Resampling.LANCZOS)
                    caminho_salvo = os.path.join(pasta_redimensionada, nome_arquivo)
                    img_redimensionada.save(caminho_salvo)
                    imagens_redimensionadas.append(caminho_salvo)
                    cores_medias.append((caminho_salvo, self.calcular_cor_media(img_redimensionada)))
                self.progress.emit(int((i + 1) / len(arquivos) * 50))

            # Criar mosaico
            mosaico = Image.new("RGBA", (largura_px, altura_px), "white")
            with Image.open(self.imagem_referencia) as img_ref:
                img_ref = img_ref.resize((largura_px, altura_px), Image.Resampling.LANCZOS)

            celula_total_px = self.tamanho_base_px + self.espaco_px
            largura_mosaico = largura_px // celula_total_px
            altura_mosaico = altura_px // celula_total_px

            for y in range(altura_mosaico):
                for x in range(largura_mosaico):
                    x1, y1 = x * celula_total_px, y * celula_total_px
                    x2, y2 = x1 + self.tamanho_base_px, y1 + self.tamanho_base_px
                    celula = img_ref.crop((x1, y1, x2, y2))
                    cor_media_celula = self.calcular_cor_media(celula)

                    if cor_media_celula == (255, 255, 255):
                        continue

                    caminho_imagem_base = self.encontrar_melhor_cor(cor_media_celula, cores_medias)
                    with Image.open(caminho_imagem_base) as img_base:
                        img_base = img_base.convert("RGBA")
                        mosaico.paste(img_base, (x1, y1), mask=img_base.split()[3])

                self.progress.emit(50 + int((y + 1) / altura_mosaico * 50))

            caminho_saida = os.path.join(os.path.expanduser("~/Downloads"), "mosaico_final.png")
            mosaico.save(caminho_saida)
            self.completed.emit(caminho_saida)

        except Exception as e:
            self.error.emit(str(e))

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Mosaico de Imagens")
        self.setGeometry(100, 100, 800, 600)
        self.initUI()

    def initUI(self):
        layout = QVBoxLayout()

        self.ref_button = QPushButton("Selecionar Imagem de Referência")
        self.ref_button.clicked.connect(self.select_reference_image)
        layout.addWidget(self.ref_button)

        self.base_button = QPushButton("Selecionar Pasta de Imagens Base")
        self.base_button.clicked.connect(self.select_base_folder)
        layout.addWidget(self.base_button)

        self.slider = QSlider(Qt.Orientation.Horizontal)
        self.slider.setMinimum(50)  # Mínimo de 50 pixels por célula
        self.slider.setValue(118)  # Valor inicial (aproximadamente 1 cm em resolução 118 px/cm)
        self.slider.setTickInterval(10)
        self.slider.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.slider.valueChanged.connect(self.update_slider_label)
        layout.addWidget(self.slider)

        self.slider_label = QLabel("Tamanho da célula: 118 pixels")
        layout.addWidget(self.slider_label)

        self.space_slider = QSlider(Qt.Orientation.Horizontal)
        self.space_slider.setMinimum(0)  # Sem espaçamento mínimo
        self.space_slider.setMaximum(100)  # Máximo de 100 pixels de espaçamento
        self.space_slider.setValue(0)  # Valor inicial sem espaçamento
        self.space_slider.setTickInterval(10)
        self.space_slider.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.space_slider.valueChanged.connect(self.update_space_slider_label)
        layout.addWidget(self.space_slider)

        self.space_slider_label = QLabel("Espaçamento entre células: 0 pixels")
        layout.addWidget(self.space_slider_label)

        self.start_button = QPushButton("Iniciar Mosaico")
        self.start_button.clicked.connect(self.start_mosaic)
        self.start_button.setEnabled(False)
        layout.addWidget(self.start_button)

        self.progress_bar = QProgressBar()
        layout.addWidget(self.progress_bar)

        self.label = QLabel("Selecione os arquivos necessários para iniciar o mosaico.")
        layout.addWidget(self.label)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

    def select_reference_image(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Selecione a Imagem de Referência", "", "Imagens (*.jpg *.jpeg *.png)")
        if file_path:
            self.reference_image_path = file_path
            self.label.setText(f"Imagem de referência selecionada: {file_path}")
            self.check_ready()

    def select_base_folder(self):
        folder_path = QFileDialog.getExistingDirectory(self, "Selecione a Pasta de Imagens Base")
        if folder_path:
            self.base_images_folder = folder_path
            self.label.setText(f"Pasta de imagens base selecionada: {folder_path}")

            # Determina o tamanho máximo das imagens base
            arquivos = [f for f in os.listdir(self.base_images_folder) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
            tamanhos = []
            for arquivo in arquivos:
                caminho = os.path.join(self.base_images_folder, arquivo)
                with Image.open(caminho) as img:
                    tamanhos.append(min(img.size))

            if tamanhos:
                max_tamanho = min(tamanhos)
                self.slider.setMaximum(max_tamanho)

            self.check_ready()

    def update_slider_label(self):
        value = self.slider.value()
        self.slider_label.setText(f"Tamanho da célula: {value} pixels")

    def update_space_slider_label(self):
        value = self.space_slider.value()
        self.space_slider_label.setText(f"Espaçamento entre células: {value} pixels")

    def check_ready(self):
        if hasattr(self, 'reference_image_path') and hasattr(self, 'base_images_folder'):
            self.start_button.setEnabled(True)

    def start_mosaic(self):
        try:
            # Solicita entrada do número de imagens base disponíveis
            imagens_disponiveis, ok = QInputDialog.getInt(self, "Imagens Disponíveis", "Quantas imagens base você tem disponíveis?")
            if not ok:
                return  # Se o usuário cancelar, não inicia o mosaico

            # Solicita entrada do número de repetições permitidas
            repeticoes, ok = QInputDialog.getInt(self, "Repetições Permitidas", "Quantas vezes cada imagem base pode ser reutilizada?", value=3, min=1)
            if not ok:
                return  # Se o usuário cancelar, não inicia o mosaico

            tamanho_base_px = self.slider.value()
            espaco_px = self.space_slider.value()

            self.thread = MosaicoThread(100, 150, tamanho_base_px, espaco_px, repeticoes, imagens_disponiveis, self.reference_image_path, self.base_images_folder)
            self.thread.progress.connect(self.progress_bar.setValue)
            self.thread.completed.connect(self.on_mosaic_completed)
            self.thread.error.connect(self.on_mosaic_error)
            self.thread.start()

        except Exception as e:
            QMessageBox.critical(self, "Erro", str(e))

    def on_mosaic_completed(self, path):
        QMessageBox.information(self, "Concluído", f"Mosaico criado com sucesso em: {path}")

    def on_mosaic_error(self, message):
        QMessageBox.critical(self, "Erro", message)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
