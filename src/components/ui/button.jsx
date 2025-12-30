import React from 'react'
import clsx from 'clsx'

export function Button({ className, variant = 'default', children, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-400',
    link: 'text-slate-700 hover:underline',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50'
  }
  return (
    <button className={clsx(base, variants[variant], 'px-3 py-2', className)} {...props}>
      {children}
    </button>
  )
}
