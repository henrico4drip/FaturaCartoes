import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-800">Algo deu errado</h2>
            <p className="text-sm text-slate-600 mt-2">Tente recarregar a página. Se persistir, verifique as variáveis de ambiente.</p>
            <p className="text-xs text-slate-400 mt-3">{this.state.error?.message || ""}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
