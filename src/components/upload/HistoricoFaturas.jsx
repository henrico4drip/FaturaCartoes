import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, FileText, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoricoFaturas({ meses, totalTransacoes, faturasDb, onDeleteMonth, onReanalyzeMonth, isLoading }) {
    const formatMesShort = (mes) => {
        const [ano, mesNum] = mes.split("-");
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${mesesNomes[parseInt(mesNum) - 1]} / ${ano}`;
    };

    const getContagemTransacoes = (mes) => {
        return totalTransacoes.filter(t => t.fatura_mes_ref === mes).length;
    };

    const getArquivoNome = (mes) => {
        const fatura = faturasDb.find(f => f.mes_referencia === mes);
        return fatura?.arquivo_nome || "Arquivo não registrado";
    };

    return (
        <Card className="border-0 shadow-sm mt-6">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Histórico de Importações
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
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                {formatMesShort(mes)}
                                            </span>
                                            <p className="font-semibold text-slate-800 truncate" title={getArquivoNome(mes)}>
                                                {getArquivoNome(mes)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {getContagemTransacoes(mes)} transações detectadas para este mês de referência
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    {onReanalyzeMonth && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onReanalyzeMonth(mes)}
                                            disabled={isLoading}
                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            title="Reanalisar (apagar e reimportar)"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (window.confirm(`Tem certeza que deseja excluir TODAS as transações de ${formatMesShort(mes)}?`)) {
                                                onDeleteMonth(mes);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Excluir importação"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}
