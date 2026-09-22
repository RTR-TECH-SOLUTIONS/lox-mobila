/**
 * Micsoreaza poza in browser inainte de upload (economie de date pe telefon): maximum 2400 px,
 * JPEG 0,9. Serverul o prelucreaza oricum din nou. Daca browserul nu o poate citi, trimite originalul.
 */
export async function downscale(file: File, max = 2400): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.9),
  );
}
