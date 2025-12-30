import React from 'react'
import clsx from 'clsx'

export function Badge({ className, children }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700', className)}>
      {children}
    </span>
  )
}
