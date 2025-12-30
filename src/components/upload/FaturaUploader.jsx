import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function FaturaUploader({ onUploadSuccess, mesReferencia, setMesReferencia }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [fileName, setFileName] = useState("");

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file) => {
        if (!mesReferencia) {
            setUploadStatus({ type: "error", message: "Selecione o mês de referência primeiro" });
            return;
        }

        setIsUploading(true);
        setFileName(file.name);
        setUploadStatus(null);

        try {
            const { file_url, file: originalFile } = await base44.integrations.Core.UploadFile({ file });
            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: `Analise esta fatura de cartão de crédito e extraia TODAS as transações.
        Para cada transação, identifique:
        - data: no formato YYYY-MM-DD
        - descricao: nome do estabelecimento/descrição
        - valor: valor em reais (apenas número positivo, sem R$)
        - parcela_atual: se for parcelado, o número da parcela atual (ex: 2)
        - parcela_total: se for parcelado, o total de parcelas (ex: 10)
        IMPORTANTE: 
        - Extraia TODAS as transações da fatura, não apenas algumas
        - Ignore totais, resumos e informações de pagamento
        - Para compras não parceladas, não preencha parcela_atual e parcela_total
        - Valores devem ser numéricos sem símbolos`,
                file_urls: [file_url],
                file: originalFile,
                response_json_schema: {
                    type: "object",
                    properties: {
                        transacoes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    data: { type: "string" },
                                    descricao: { type: "string" },
                                    valor: { type: "number" },
                                    parcela_atual: { type: "number" },
                                    parcela_total: { type: "number" }
                                },
                                required: ["data", "descricao", "valor"]
                            }
                        }
                    }
                }
            });

            if (resultado?.transacoes && resultado.transacoes.length > 0) {
                onUploadSuccess(resultado.transacoes, mesReferencia);
                setUploadStatus({ type: "success", message: `${resultado.transacoes.length} transações extraídas com IA` });
            } else {
                setUploadStatus({ type: "error", message: "Nenhuma transação encontrada na fatura" });
            }
        } catch (error) {
            setUploadStatus({ type: "error", message: "Erro ao analisar a fatura: " + (error.message || "tente novamente") });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [mesReferencia]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    return (
        <Card className="border-0 shadow-sm">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Importar Fatura</h3>

                <div className="mb-4">
                    <Label htmlFor="mes" className="text-sm font-medium text-slate-600">
                        Mês de Referência
                    </Label>
                    <Input
                        id="mes"
                        type="month"
                        value={mesReferencia}
                        onChange={(e) => setMesReferencia(e.target.value)}
                        className="mt-1 max-w-xs"
                    />
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"}
            ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}
          `}
                >
                    <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                    />

                    <AnimatePresence mode="wait">
                        {isUploading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                                <p className="text-slate-600">Processando {fileName}...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-6 h-6 text-slate-500" />
                                </div>
                                <p className="text-slate-700 font-medium">
                                    Arraste sua fatura aqui
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    ou clique para selecionar (PDF ou imagem)
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    A IA analisará automaticamente sua fatura
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {uploadStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${uploadStatus.type === "success"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                        >
                            {uploadStatus.type === "success" ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">{uploadStatus.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}
