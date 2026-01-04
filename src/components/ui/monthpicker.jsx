import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function MonthPicker({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(parseInt(value?.split("-")[0] || new Date().getFullYear(), 10));
  const months = useMemo(() => [
    { label: "Jan", num: "01" },
    { label: "Fev", num: "02" },
    { label: "Mar", num: "03" },
    { label: "Abr", num: "04" },
    { label: "Mai", num: "05" },
    { label: "Jun", num: "06" },
    { label: "Jul", num: "07" },
    { label: "Ago", num: "08" },
    { label: "Set", num: "09" },
    { label: "Out", num: "10" },
    { label: "Nov", num: "11" },
    { label: "Dez", num: "12" },
  ], []);

  const currentLabel = useMemo(() => {
    if (!value) return "";
    const [y, m] = value.split("-");
    const i = parseInt(m, 10) - 1;
    const nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    return `${nomes[i]} ${y}`;
  }, [value]);

  return (
    <div className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-56 items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <span>{currentLabel}</span>
        <Calendar className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setYear(year - 1)}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700">{year}</span>
            <button
              type="button"
              onClick={() => setYear(year + 1)}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m) => {
              const v = `${year}-${m.num}`;
              const isSelected = v === value;
              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => {
                    onChange?.(v);
                    setIsOpen(false);
                  }}
                  className={`rounded-md px-3 py-2 text-sm border ${isSelected ? "border-slate-900 bg-slate-50 font-semibold" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
