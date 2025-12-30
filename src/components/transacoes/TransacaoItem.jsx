import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Users, HelpCircle, Check, Edit2, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TransacaoItem({ transacao, onClassificar, onEdit, isLoading }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValor, setEditedValor] = useState(transacao.valor);
    const [editedData, setEditedData] = useState(transacao.data);

    const handleSaveEdit = () => {
        if (editedValor !== transacao.valor || editedData !== transacao.data) {
            onEdit(transacao.id, {
                valor: parseFloat(editedValor),
                data: editedData
            });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedValor(transacao.valor);
        setEditedData(transacao.data);
        setIsEditing(false);
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return "—";
        try {
            const parts = dateString.split("-");
            if (parts.length !== 3) return dateString;
            const [year, month, day] = parts;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (isNaN(date.getTime())) return dateString;
            return format(date, "dd MMM yyyy", { locale: ptBR });
        } catch (e) {
            console.error("Erro ao formatar data:", dateString, e);
            return dateString;
        }
    };

    const getDonoDisplay = () => {
        switch (transacao.dono) {
            case "eu":
                return { label: "Eu", color: "bg-blue-100 text-blue-700", icon: User };
            case "dinda":
                return { label: "Dinda", color: "bg-purple-100 text-purple-700", icon: Users };
            default:
                return { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: HelpCircle };
        }
    };

    const donoInfo = getDonoDisplay();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100"
        >
            {isEditing ? (
                <div className="space-y-3">
                    <p className="font-medium text-slate-800">{transacao.descricao}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Data:</label>
                            <Input
                                type="date"
                                value={editedData}
                                onChange={(e) => setEditedData(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Valor:</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={editedValor}
                                onChange={(e) => setEditedValor(e.target.value)}
                                className="w-32"
                            />
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={isLoading}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Salvar
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">
                                    {transacao.descricao}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                    <span>
                                        {formatDisplayDate(transacao.data)}
                                    </span>
                                    {transacao.parcela_atual && transacao.parcela_total && (
                                        <span className="text-slate-400">
                                            • {transacao.parcela_atual}/{transacao.parcela_total}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-slate-800 whitespace-nowrap">
                                R$ {transacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsEditing(true)}
                                className="w-8 h-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={transacao.dono === "eu" ? "default" : "outline"}
                                onClick={() => onClassificar(transacao.id, "eu")}
                                disabled={isLoading}
                                className={transacao.dono === "eu"
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                }
                            >
                                <User className="w-4 h-4 mr-1" />
                                Eu
                            </Button>
                            <Button
                                size="sm"
                                variant={transacao.dono === "dinda" ? "default" : "outline"}
                                onClick={() => onClassificar(transacao.id, "dinda")}
                                disabled={isLoading}
                                className={transacao.dono === "dinda"
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                                }
                            >
                                <Users className="w-4 h-4 mr-1" />
                                Dinda
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
