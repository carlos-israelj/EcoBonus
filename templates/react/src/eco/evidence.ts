import type { Coordinates, Evidence } from './types'

export async function readEvidence(file: File, coordinates: Coordinates, accuracy: number, demo = false): Promise<Evidence> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elige una imagen JPG, PNG o WebP.')
  if (file.size > 12 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 12 MB.')
  const bytes = await file.arrayBuffer()
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 680 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return { url: canvas.toDataURL('image/jpeg', 0.7), hash, timestamp: new Date().toISOString(), coordinates, accuracy, demo }
}
export async function demoEvidence(kind: 'before' | 'after', coordinates: Coordinates) {
  const response = await fetch(kind === 'before' ? '/images/beach.jpg' : '/images/park.jpg')
  if (!response.ok) throw new Error('No se pudo cargar la imagen de demostración.')
  return readEvidence(new File([await response.blob()], `${kind}.jpg`, { type: 'image/jpeg' }), coordinates, 10, true)
}
