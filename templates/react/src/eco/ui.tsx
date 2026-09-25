import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, Leaf, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { severityLabels } from './data'
import type { Severity } from './types'

const ToastContext = createContext<(message: string) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 5500); return () => clearTimeout(timer) }, [message])
  useEffect(() => { const handler = () => setMessage('No queda espacio local. Tu último cambio podría perderse al cerrar. Exporta tu progreso desde Ajustes.'); window.addEventListener('eco-storage-error', handler); return () => window.removeEventListener('eco-storage-error', handler) }, [])
  return <ToastContext.Provider value={setMessage}>{children}{message && <div className="toast" role="status"><Check size={18} /><span>{message}</span><button className="icon-button" aria-label="Cerrar aviso" onClick={() => setMessage('')}><X size={17} /></button></div>}</ToastContext.Provider>
}
export const useToast = () => useContext(ToastContext)
export function LeafMark({ className = '' }: { className?: string }) { return <span aria-hidden="true" className={`leaf-mark ${className}`} /> }
export function Logo() { return <Link to="/" className="brand" aria-label="EcoBonus, inicio"><LeafMark /><span>Eco<span>Bonus</span></span></Link> }
export function Points({ value, small = false }: { value: number; small?: boolean }) { return <span className={`points ${small ? 'small' : ''}`}><Leaf size={small ? 13 : 17} /><b>{value.toLocaleString('es-PE')}</b><span>ECO</span></span> }
export function Badge({ severity }: { severity: Severity }) { return <span className={`badge ${severity}`}><span />{severityLabels[severity]}</span> }
export function PageTitle({ eyebrow, title, description, action, back = false }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; back?: boolean }) {
  const navigate = useNavigate()
  return <header className="page-title">{back && <button className="icon-button back-button" aria-label="Volver" onClick={() => navigate(-1)}><ArrowLeft size={21} /></button>}<div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</header>
}
export function Empty({ title, text, to, label = 'Explorar misiones' }: { title: string; text: string; to?: string; label?: string }) { return <div className="empty"><div className="empty-icon"><Leaf size={29} /></div><h3>{title}</h3><p>{text}</p>{to && <Link className="button primary" to={to}>{label}<ArrowRight size={16} /></Link>}</div> }
export function DemoNote({ children }: { children?: ReactNode }) { return <div className="demo-note"><CircleHelp size={16} /><span>{children ?? 'Modo demo. Datos y operaciones de ejemplo, sin transacciones reales en Stellar.'}</span></div> }
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  return <dialog ref={dialog} className="modal" aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button></div>{children}</dialog>
}
export function Progress({ value, label }: { value: number; label: string }) { return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div> }
export function DownloadButton({ data, filename, children }: { data: unknown; filename: string; children: ReactNode }) {
  const download = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return <button className="button secondary" onClick={download}>{children}</button>
}
