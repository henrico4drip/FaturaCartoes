import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

const SelectCtx = createContext({
  value: '',
  onValueChange: () => { },
  isOpen: false,
  setIsOpen: () => { },
  triggerRef: null
})

export function Select({ value, onValueChange, children }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)

  return (
    <SelectCtx.Provider value={{ value, onValueChange, isOpen, setIsOpen, triggerRef }}>
      <div className="relative w-full">{children}</div>
    </SelectCtx.Provider>
  )
}

export function SelectTrigger({ className, children }) {
  const { isOpen, setIsOpen, triggerRef } = useContext(SelectCtx)

  return (
    <button
      type="button"
      ref={triggerRef}
      onClick={() => setIsOpen(!isOpen)}
      className={clsx(
        'flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
      <ChevronDown className={clsx('h-4 w-4 opacity-50 transition-transform duration-200', isOpen && 'rotate-180')} />
    </button>
  )
}

export function SelectValue({ placeholder, children }) {
  const { value, triggerRef, isOpen } = useContext(SelectCtx)
  const [label, setLabel] = useState('')

  // Efeito para encontrar o texto do item selecionado
  // Apenas roda se não houver children e o menu estiver aberto 
  // (ou tentamos cachear o label)
  useEffect(() => {
    if (children) return;
    if (!value) {
      setLabel('')
      return
    }

    // Se o menu estiver aberto, tentamos pegar o texto do item
    const container = triggerRef.current?.closest('.relative')
    const item = container?.querySelector(`[data-select-item="${value}"]`)
    if (item) {
      setLabel(item.textContent)
    }
  }, [value, triggerRef, isOpen, children])

  return <span>{children || label || placeholder}</span>
}

export function SelectContent({ children, className }) {
  const { isOpen, setIsOpen } = useContext(SelectCtx)
  const contentRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        // Verifica se não clicou no trigger também
        const trigger = contentRef.current.previousElementSibling
        if (!trigger || !trigger.contains(event.target)) {
          setIsOpen(false)
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      className={clsx(
        'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SelectItem({ value, children, className }) {
  const ctx = useContext(SelectCtx)
  const isSelected = ctx.value === value

  return (
    <div
      className={clsx(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100',
        isSelected && 'bg-slate-50 font-medium text-slate-900',
        className
      )}
      onClick={() => {
        ctx.onValueChange?.(value)
        ctx.setIsOpen(false)
      }}
      data-select-item={value}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
        </span>
      )}
      {children}
    </div>
  )
}
