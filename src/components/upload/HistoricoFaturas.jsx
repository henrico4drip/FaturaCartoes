import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, FileText, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoricoFaturas({ faturas, totalTransacoes, onDeleteImport, onReanalyzeMonth, isLoading }) {
    const formatMesShort = (mes) => {
        if (!mes) return "—";
        const [ano, mesNum] = mes.split("-");
        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${mesesNomes[parseInt(mesNum) - 1]} / ${ano}`;
    };

    const getContagemTransacoes = (mes, arquivo_nome) => {
        return totalTransacoes.filter(t =>
            t.fatura_mes_ref === mes &&
            (t.arquivo_nome === arquivo_nome || (!t.arquivo_nome && arquivo_nome === "Arquivo não registrado"))
        ).length;
    };

    return (
        <Card className="border-0 shadow-sm mt-6">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Histórico de Importações
                </h3>

                <div className="space-y-3">
                    {faturas.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">
                            Nenhuma fatura importada ainda.
                        </p>
                    ) : (
                        faturas.map((item, index) => {
                            const { mes, arquivo_nome } = item;
                            const contagem = getContagemTransacoes(mes, arquivo_nome);

                            return (
                                <motion.div
                                    key={`${mes}_${arquivo_nome}_${index}`}
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
                                                <p className="font-semibold text-slate-800 truncate" title={arquivo_nome || "Arquivo não registrado"}>
                                                    {arquivo_nome || "Arquivo não registrado"}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {contagem} transações detectadas neste arquivo
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
                                                const label = arquivo_nome ? `${arquivo_nome} (${formatMesShort(mes)})` : formatMesShort(mes);
                                                if (window.confirm(`Tem certeza que deseja excluir as transações de: ${label}?`)) {
                                                    onDeleteImport({ mes, arquivo_nome });
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
                            );
                        })
                    )}
                </div>
            </div>
        </Card>
    );
}
