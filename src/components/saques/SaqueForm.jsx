import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SaqueForm({ onSave, isLoading, mesReferenciaDefault }) {
    const [form, setForm] = useState({
        data: new Date().toISOString().split("T")[0],
        valor: "",
        quem_pagou: "",
        mes_referencia: mesReferenciaDefault || new Date().toISOString().slice(0, 7),
        observacao: ""
    });

    // ... sync ...
    React.useEffect(() => {
        if (mesReferenciaDefault) {
            setForm(prev => ({ ...prev, mes_referencia: mesReferenciaDefault }));
        }
    }, [mesReferenciaDefault]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.valor || !form.quem_pagou || !form.mes_referencia) return;

        onSave({
            ...form,
            valor: parseFloat(form.valor)
        });

        setForm(prev => ({
            ...prev,
            valor: "",
            observacao: ""
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="border-0 shadow-sm">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Registrar Dinheiro Pego (Saque)</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="quem_pagou">Quem pegou o dinheiro?</Label>
                                <Select
                                    value={form.quem_pagou}
                                    onValueChange={(value) => setForm(prev => ({ ...prev, quem_pagou: value }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione">
                                            {form.quem_pagou === 'eu' ? 'Eu' : form.quem_pagou === 'dinda' ? 'Dinda' : ''}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="eu">Eu</SelectItem>
                                        <SelectItem value="dinda">Dinda</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="valor">Valor (R$)</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.valor}
                                    onChange={(e) => setForm(prev => ({ ...prev, valor: e.target.value }))}
                                    placeholder="0,00"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="data">Data</Label>
                                <Input
                                    id="data"
                                    type="date"
                                    value={form.data}
                                    onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="mes_referencia">Mês de Referência</Label>
                                <Input
                                    id="mes_referencia"
                                    type="month"
                                    value={form.mes_referencia}
                                    onChange={(e) => setForm(prev => ({ ...prev, mes_referencia: e.target.value }))}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="observacao">Para que foi?</Label>
                            <Textarea
                                id="observacao"
                                value={form.observacao}
                                onChange={(e) => setForm(prev => ({ ...prev, observacao: e.target.value }))}
                                placeholder="Ex: Dinheiro para o pão, feira, etc."
                                className="mt-1 h-20"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !form.valor || !form.quem_pagou}
                            className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Registrar Saque
                        </Button>
                    </form>
                </div>
            </Card>
        </motion.div>
    );
}
