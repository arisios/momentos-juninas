import imageCompression from 'browser-image-compression';

export async function compressImage(file, onProgress) {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress,
  };
  const compressed = await imageCompression(file, options);
  return new File([compressed], file.name, { type: compressed.type });
}

export async function validateVideo(file) {
  if (file.size > 50 * 1024 * 1024) throw new Error('Vídeo deve ter no máximo 50MB');

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 30) reject(new Error('Vídeo deve ter no máximo 30 segundos'));
      else resolve(file);
    };
    video.onerror = () => reject(new Error('Não foi possível ler o vídeo'));
    video.src = URL.createObjectURL(file);
  });
}

export function isVideo(file) {
  return file.type.startsWith('video/');
}
