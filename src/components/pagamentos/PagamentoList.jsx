import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, User, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function PagamentosList({ pagamentos, onDelete, isLoading }) {
  const formatDisplayDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return "—";
    try {
      const parts = dateString.split("-");
      if (parts.length !== 3) return dateString;
      const [year, month, day] = parts;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) return dateString;
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar data de pagamento:", dateString, e);
      return dateString;
    }
  };

  const formatMes = (mes) => {
    if (!mes) return "—";
    const [ano, mesNum] = mes.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[parseInt(mesNum) - 1]} ${ano}`;
  };

  if (!pagamentos.length) {
    return (
      <Card className="border-0 shadow-sm p-8 text-center">
        <p className="text-slate-500">Nenhum pagamento registrado ainda.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {pagamentos.map((pagamento, index) => (
          <motion.div
            key={pagamento.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pagamento.quem_pagou === "eu" ? "bg-blue-100" : "bg-purple-100"
                    }`}>
                    {pagamento.quem_pagou === "eu" ? (
                      <User className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Users className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDisplayDate(pagamento.data)}</span>
                      <span>•</span>
                      <span>Ref: {formatMes(pagamento.mes_referencia)}</span>
                    </div>
                    {pagamento.observacao && (
                      <p className="text-sm text-slate-400 mt-1">{pagamento.observacao}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={`${pagamento.quem_pagou === "eu"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                    }`}>
                    {pagamento.quem_pagou === "eu" ? "Eu" : "Dinda"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(pagamento.id)}
                    disabled={isLoading}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
