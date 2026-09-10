export async function uploadToImgBB(file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  
  if (!apiKey) {
    throw new Error('Falta VITE_IMGBB_API_KEY en .env');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen supera 5 MB');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten imágenes');
  }

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error('Error al subir imagen a ImgBB');
  }

  return data.data.url;
}