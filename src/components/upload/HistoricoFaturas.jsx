import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, FileText, ChevronRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoricoFaturas({ meses, totalTransacoes, onDeleteMonth, onReanalyzeMonth, isLoading }) {
    const formatMes = (mes) => {
        const [ano, mesNum] = mes.split("-");
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${mesesNomes[parseInt(mesNum) - 1]} / ${ano}`;
    };

    const getContagemTransacoes = (mes) => {
        return totalTransacoes.filter(t => t.fatura_mes_ref === mes).length;
    };

    return (
        <Card className="border-0 shadow-sm mt-6">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Faturas Importadas
                </h3>

                <div className="space-y-3">
                    {meses.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">
                            Nenhuma fatura importada ainda.
                        </p>
                    ) : (
                        meses.map((mes, index) => (
                            <motion.div
                                key={mes}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">{formatMes(mes)}</p>
                                        <p className="text-xs text-slate-500">
                                            {getContagemTransacoes(mes)} transações detectadas
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onReanalyzeMonth(mes)}
                                    disabled={isLoading}
                                    className="text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                                    title="Reanalisar (apagar e reimportar)"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (window.confirm(`Tem certeza que deseja excluir TODAS as transações de ${formatMes(mes)}?`)) {
                                            onDeleteMonth(mes);
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}
