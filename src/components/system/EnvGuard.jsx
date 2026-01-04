import React from "react";

export default function EnvGuard({ children }) {
  const hasSupabase =
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-800">Configuração incompleta</h2>
          <p className="text-sm text-amber-700 mt-2">
            Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
