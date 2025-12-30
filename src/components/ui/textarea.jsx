import React from 'react'
import clsx from 'clsx'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx('w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400', className)}
      {...props}
    />
  )
}
