// Gera uma imagem de capa (poster) para um vídeo direto no navegador,
// sem depender de nenhum serviço externo: carrega o arquivo num <video>
// oculto, avança até um frame representativo e captura via <canvas>.
// Usado no upload do portfólio para que a miniatura de um vídeo seja uma
// imagem leve, em vez do navegador ter que baixar o vídeo inteiro só
// para mostrar uma prévia estática.
const MAX_POSTER_WIDTH = 900;

export function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    let settled = false;
    function finish(blob: Blob | null) {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.remove();
      resolve(blob);
    }

    // Se o navegador não conseguir decodificar/carregar o vídeo por
    // qualquer motivo, não trava o upload — só fica sem poster.
    const timeout = setTimeout(() => finish(null), 8000);

    video.addEventListener("loadedmetadata", () => {
      // Evita o primeiro frame (às vezes preto/em branco) sem ir longe
      // demais em vídeos curtos.
      video.currentTime = Math.min(1, Math.max(0.1, video.duration / 4 || 0));
    });

    video.addEventListener("seeked", () => {
      try {
        const scale = Math.min(1, MAX_POSTER_WIDTH / video.videoWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            finish(blob);
          },
          "image/jpeg",
          0.82
        );
      } catch {
        clearTimeout(timeout);
        finish(null);
      }
    });

    video.addEventListener("error", () => {
      clearTimeout(timeout);
      finish(null);
    });
  });
}
