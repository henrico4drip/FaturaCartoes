import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Wallet, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SaqueList({ saques, onDelete, isLoading }) {
    const formatCurrency = (value) => {
        return value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };

    if (saques.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nenhum saque registrado neste mês.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {saques.map((saque) => (
                    <motion.div
                        key={saque.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${saque.quem_pagou === "eu" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                                        }`}>
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">
                                                {formatCurrency(saque.valor)}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                                                {saque.quem_pagou}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(saque.data)}
                                            </span>
                                            {saque.observacao && <span>• {saque.observacao}</span>}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => onDelete(saque.id)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
