import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function SaldoCard({ titulo, valor, tipo, descricao, delay = 0 }) {
    const isPositive = valor <= 0; // Se o valor devedor é <= 0, significa que não deve nada ou tem crédito

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${tipo === "eu" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                            }`}>
                            {tipo === "eu" ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${valor > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                            }`}>
                            {valor > 0 ? (
                                <>
                                    <ArrowUpRight className="w-3 h-3" />
                                    Devedor
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="w-3 h-3" />
                                    Pago
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{titulo}</p>
                        <h3 className={`text-2xl font-bold ${valor > 0 ? "text-slate-800" : "text-emerald-600"
                            }`}>
                            R$ {Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {valor < 0 && <span className="text-sm ml-1">(Crédito)</span>}
                        </h3>
                        {descricao && (
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                {descricao}
                            </p>
                        )}
                    </div>
                </div>

                <div className={`h-1.5 w-full ${tipo === "eu" ? "bg-blue-500" : "bg-purple-500"
                    } opacity-20`} />
            </Card>
        </motion.div>
    );
}
