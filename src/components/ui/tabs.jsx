import React, { createContext, useContext } from 'react'
import clsx from 'clsx'

const TabsCtx = createContext({ value: '', onValueChange: () => { } })

export function Tabs({ value, onValueChange, className, children }) {
  return (
    <TabsCtx.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ className, children }) {
  return <div className={clsx('flex gap-2', className)}>{children}</div>
}

export function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsCtx)
  const isActive = ctx.value === value
  return (
    <button
      data-tabs-trigger={value}
      className={clsx(
        'px-3 py-2 rounded-md transition-all text-sm font-medium',
        isActive
          ? 'bg-slate-900 text-white shadow-sm'
          : 'bg-transparent text-slate-600 hover:bg-slate-100',
        className
      )}
      onClick={() => ctx.onValueChange?.(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsCtx)
  if (ctx.value !== value) return null
  return <div data-tabs-content={value} className={className}>{children}</div>
}
