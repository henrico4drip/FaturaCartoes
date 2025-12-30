import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CreditCard, DollarSign, TrendingUp, Loader2, Search, Wallet, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

import SaldoCard from "@/components/dashboard/SaldoCard";
import ResumoMensal from "@/components/dashboard/ResumoMensal";
import TransacaoItem from "@/components/transacoes/TransacaoItem";
import FiltrosTransacoes from "@/components/transacoes/FiltrosTrasacoes";
import FaturaUploader from "@/components/upload/FaturaUploader";
import HistoricoFaturas from "@/components/upload/HistoricoFaturas";
import PagamentoForm from "@/components/pagamentos/PagamentoForm";
import PagamentosList from "@/components/pagamentos/PagamentoList";
import SaqueForm from "@/components/saques/SaqueForm";
import SaqueList from "@/components/saques/SaqueList";

export default function Dashboard() {
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({
    busca: "",
    dono: "todos",
    valorMin: "",
    valorMax: "",
    dataInicio: "",
    dataFim: ""
  });
  const queryClient = useQueryClient();

  const { data: transacoes = [], isLoading: loadingTransacoes } = useQuery({
    queryKey: ["transacoes"],
    queryFn: () => base44.entities.Transacao.list("-data"),
  });

  const { data: pagamentos = [], isLoading: loadingPagamentos } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: () => base44.entities.Pagamento.list("-data"),
  });

  const { data: saques = [], isLoading: loadingSaques } = useQuery({
    queryKey: ["saques"],
    queryFn: () => base44.entities.Saque.list("-data"),
  });

  const { data: fechamentos = [] } = useQuery({
    queryKey: ["fechamentos"],
    queryFn: () => base44.entities.Fechamento.list("-mes"),
  });

  const { data: regras = [] } = useQuery({
    queryKey: ["regras"],
    queryFn: () => base44.entities.RegraClassificacao.list(),
  });

  const createTransacao = useMutation({
    mutationFn: (data) => base44.entities.Transacao.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transacoes"] }),
    onError: (error) => alert("Erro ao criar transação: " + error.message),
  });

  const updateTransacao = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transacao.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transacoes"] }),
    onError: (error) => alert("Erro ao atualizar transação: " + error.message),
  });

  const updateManyTransacoes = useMutation({
    mutationFn: ({ ids, data }) => base44.entities.Transacao.updateMany(ids, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transacoes"] }),
    onError: (error) => alert("Erro ao atualizar várias transações: " + error.message),
  });

  const deleteTransacaoMes = useMutation({
    mutationFn: (mes) => base44.entities.Transacao.deleteByMonth(mes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
    },
    onError: (error) => alert("Erro ao excluir faturas do mês: " + error.message),
  });

  const createPagamento = useMutation({
    mutationFn: (data) => base44.entities.Pagamento.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pagamentos"] }),
    onError: (error) => alert("Erro ao salvar pagamento: " + error.message),
  });

  const deletePagamento = useMutation({
    mutationFn: (id) => base44.entities.Pagamento.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pagamentos"] }),
    onError: (error) => alert("Erro ao excluir pagamento: " + error.message),
  });

  const createSaque = useMutation({
    mutationFn: (data) => base44.entities.Saque.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saques"] }),
    onError: (error) => alert("Erro ao registrar saque: " + error.message),
  });

  const deleteSaque = useMutation({
    mutationFn: (id) => base44.entities.Saque.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saques"] }),
    onError: (error) => alert("Erro ao excluir saque: " + error.message),
  });

  const createRegra = useMutation({
    mutationFn: (data) => base44.entities.RegraClassificacao.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regras"] }),
    onError: (error) => alert("Erro ao criar regra: " + error.message),
  });

  const transacoesMes = useMemo(() => {
    return transacoes.filter(t => t.fatura_mes_ref === mesAtual);
  }, [transacoes, mesAtual]);

  const transacoesFiltradas = useMemo(() => {
    let resultado = [...transacoesMes];
    if (filtros.busca) {
      resultado = resultado.filter(t =>
        t.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
      );
    }
    if (filtros.dono !== "todos") {
      resultado = resultado.filter(t => t.dono === filtros.dono);
    }
    if (filtros.valorMin) {
      resultado = resultado.filter(t => t.valor >= parseFloat(filtros.valorMin));
    }
    if (filtros.valorMax) {
      resultado = resultado.filter(t => t.valor <= parseFloat(filtros.valorMax));
    }
    if (filtros.dataInicio) {
      resultado = resultado.filter(t => t.data >= filtros.dataInicio);
    }
    if (filtros.dataFim) {
      resultado = resultado.filter(t => t.data <= filtros.dataFim);
    }
    return resultado;
  }, [transacoesMes, filtros]);

  const pagamentosMes = useMemo(() => {
    return pagamentos.filter(p => p.mes_referencia === mesAtual);
  }, [pagamentos, mesAtual]);

  const saquesMes = useMemo(() => {
    return saques.filter(s => s.mes_referencia === mesAtual);
  }, [saques, mesAtual]);

  const calculos = useMemo(() => {
    // --- CÁLCULO DINÂMICO DE SALDO ACUMULADO ---
    // Identifica todos os meses que possuem dados para calcular o histórico
    const todosMesesSet = new Set();
    transacoes.forEach(t => t.fatura_mes_ref && todosMesesSet.add(t.fatura_mes_ref));
    pagamentos.forEach(p => p.mes_referencia && todosMesesSet.add(p.mes_referencia));
    saques.forEach(s => s.mes_referencia && todosMesesSet.add(s.mes_referencia));
    todosMesesSet.add(mesAtual);
    const timelineMeses = Array.from(todosMesesSet).sort(); // Ordem cronológica

    let saldoAcumuladoEu = 0;
    let saldoAcumuladoDinda = 0;
    let creditoAnteriorEu = 0;
    let creditoAnteriorDinda = 0;
    let dividaAnteriorEu = 0;
    let dividaAnteriorDinda = 0;

    // Percorre todos os meses até o mês anterior ao atual para calcular o saldo de abertura
    for (const mes of timelineMeses) {
      if (mes === mesAtual) break;

      const gastosM = transacoes.filter(t => t.fatura_mes_ref === mes);
      const pagosM = pagamentos.filter(p => p.mes_referencia === mes);
      const saquesM = saques.filter(s => s.mes_referencia === mes);

      const pEu = gastosM.filter(t => t.dono === "eu").reduce((sum, t) => sum + (t.valor || 0), 0);
      const pDi = gastosM.filter(t => t.dono === "dinda").reduce((sum, t) => sum + (t.valor || 0), 0);

      const pgEu = pagosM.filter(p => p.quem_pagou === "eu").reduce((sum, p) => sum + (p.valor || 0), 0);
      const pgDi = pagosM.filter(p => p.quem_pagou === "dinda").reduce((sum, p) => sum + (p.valor || 0), 0);

      const sqEu = saquesM.filter(s => s.quem_pagou === "eu").reduce((sum, s) => sum + (s.valor || 0), 0);
      const sqDi = saquesM.filter(s => s.quem_pagou === "dinda").reduce((sum, s) => sum + (s.valor || 0), 0);

      // Lógica de Pagamento Efetivo para o histórico
      const pgEfetivoEu = pgEu + sqDi - sqEu;
      const pgEfetivoDi = pgDi + sqEu; // Cartão é da Dinda, ela não desconta o que ela mesma pega

      saldoAcumuladoEu += pEu - pgEfetivoEu;
      saldoAcumuladoDinda += pDi - pgEfetivoDi;
    }

    // O saldo acumulado até o mês anterior define se há CRÉDITO ou DÍVIDA inicial APENAS para "Eu"
    creditoAnteriorEu = saldoAcumuladoEu < 0 ? Math.abs(saldoAcumuladoEu) : 0;
    creditoAnteriorDinda = 0;
    dividaAnteriorEu = saldoAcumuladoEu > 0 ? saldoAcumuladoEu : 0;
    dividaAnteriorDinda = 0;

    // --- CÁLCULOS DO MÊS ATUAL ---
    const totalFatura = transacoesMes.reduce((sum, t) => sum + (t.valor || 0), 0);
    const parteEu = transacoesMes
      .filter(t => t.dono === "eu")
      .reduce((sum, t) => sum + (t.valor || 0), 0);
    const parteDinda = transacoesMes
      .filter(t => t.dono === "dinda")
      .reduce((sum, t) => sum + (t.valor || 0), 0);
    const pendentes = transacoesMes.filter(t => t.dono === "pendente").length;

    const pagoEu = pagamentosMes
      .filter(p => p.quem_pagou === "eu")
      .reduce((sum, p) => sum + (p.valor || 0), 0);
    const pagoDinda = pagamentosMes
      .filter(p => p.quem_pagou === "dinda")
      .reduce((sum, p) => sum + (p.valor || 0), 0);

    const saqueEu = saquesMes
      .filter(s => s.quem_pagou === "eu")
      .reduce((sum, s) => sum + (s.valor || 0), 0);
    const saqueDinda = saquesMes
      .filter(s => s.quem_pagou === "dinda")
      .reduce((sum, s) => sum + (s.valor || 0), 0);

    const totalTerminam = transacoesMes
      .filter(t => t.parcela_atual && t.parcela_total && t.parcela_atual === t.parcela_total)
      .reduce((sum, t) => sum + (t.valor || 0), 0);

    // Soma o crédito do mês passado apenas para "Eu"
    const pagoEfetivoEu = pagoEu + saqueDinda - saqueEu + creditoAnteriorEu;
    const pagoEfetivoDinda = pagoDinda + saqueEu;

    // Saldo atual de "Eu" considera o acumulado. O da Dinda apenas o mês atual.
    const saldoAtualEu = dividaAnteriorEu + parteEu - (pagoEu + saqueDinda - saqueEu + creditoAnteriorEu);
    const saldoAtualDinda = parteDinda - (pagoDinda + saqueEu);

    return {
      totalFatura,
      parteEu,
      parteDinda,
      pendentes,
      pagoEu,
      pagoDinda,
      pagoEfetivoEu,
      pagoEfetivoDinda,
      saqueEu,
      saqueDinda,
      saldoAnteriorEu: saldoAcumuladoEu,
      saldoAnteriorDinda: 0,
      creditoAnteriorEu,
      creditoAnteriorDinda: 0,
      dividaAnteriorEu,
      dividaAnteriorDinda: 0,
      saldoAtualEu,
      saldoAtualDinda,
      totalTerminam
    };
  }, [transacoesMes, pagamentosMes, saquesMes, transacoes, pagamentos, saques, mesAtual]);

  const closeMonth = useMutation({
    mutationFn: async () => {
      // Cria registros de fechamento
      await base44.entities.Fechamento.create({
        mes: mesAtual,
        usuario: "eu",
        saldo_final: calculos.saldoAtualEu
      });
      await base44.entities.Fechamento.create({
        mes: mesAtual,
        usuario: "dinda",
        saldo_final: calculos.saldoAtualDinda
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fechamentos"] });
      alert("Mês fechado com sucesso! Os saldos agora serão levados para o próximo mês.");
    },
    onError: (error) => alert("Erro ao fechar mês: " + error.message),
  });

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set();
    transacoes.forEach(t => t.fatura_mes_ref && meses.add(t.fatura_mes_ref));
    pagamentos.forEach(p => p.mes_referencia && meses.add(p.mes_referencia));
    saques.forEach(s => s.mes_referencia && meses.add(s.mes_referencia));
    meses.add(mesAtual);
    return Array.from(meses).sort().reverse();
  }, [transacoes, pagamentos, saques, mesAtual]);

  const faturasImportadas = useMemo(() => {
    const meses = new Set();
    transacoes.forEach(t => t.fatura_mes_ref && meses.add(t.fatura_mes_ref));
    return Array.from(meses).sort().reverse();
  }, [transacoes]);

  function getMesAnterior(mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    const novoMes = mesNum === 1 ? 12 : mesNum - 1;
    const novoAno = mesNum === 1 ? ano - 1 : ano;
    return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
  }

  const handleUploadSuccess = async (transacoesExtraidas, mesRef) => {
    for (const t of transacoesExtraidas) {
      const hash = `${t.data}_${t.valor}_${t.descricao}_${t.parcela_atual || 0}`;
      const existe = transacoes.find(existing => existing.hash_unico === hash);
      if (existe) continue;

      const regra = regras.find(r =>
        t.descricao.toLowerCase().includes(r.descricao_padrao.toLowerCase())
      );

      try {
        await createTransacao.mutateAsync({
          ...t,
          hash_unico: hash,
          fatura_mes_ref: mesRef,
          dono: regra?.dono_sugerido || "pendente",
          categoria: regra?.categoria || ""
        });
      } catch (error) {
        // Se for erro de duplicidade (23505), apenas ignoramos e continuamos
        if (error.code === '23505') {
          console.log('Transação já existe, pulando:', t.descricao);
        } else {
          console.error('Erro ao salvar transação:', error);
        }
      }
    }
  };

  const handleClassificar = async (id, dono) => {
    const transacao = transacoes.find(t => t.id === id);
    await updateTransacao.mutateAsync({ id, data: { dono } });
    const existeRegra = regras.find(
      r => r.descricao_padrao.toLowerCase() === transacao.descricao.toLowerCase()
    );
    if (!existeRegra) {
      await createRegra.mutateAsync({
        descricao_padrao: transacao.descricao,
        dono_sugerido: dono
      });
    }
  };

  const handleEditTransacao = async (id, data) => {
    await updateTransacao.mutateAsync({ id, data });
  };

  const handleLimparFiltros = () => {
    setFiltros({
      busca: "",
      dono: "todos",
      valorMin: "",
      valorMax: "",
      dataInicio: "",
      dataFim: ""
    });
  };

  const formatMes = (mes) => {
    const [ano, mesNum] = mes.split("-");
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${meses[parseInt(mesNum) - 1]} ${ano}`;
  };

  const isLoading = loadingTransacoes || loadingPagamentos || loadingSaques;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">Eu & Dinda</h1>
          <p className="text-slate-500 mt-1">Gestão compartilhada de cartão de crédito</p>
        </motion.div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 ml-1">Fatura de referência:</span>
            <Select value={mesAtual} onValueChange={setMesAtual}>
              <SelectTrigger className="w-56 bg-white border-slate-200">
                <SelectValue>{formatMes(mesAtual)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {mesesDisponiveis.map(mes => (
                  <SelectItem key={mes} value={mes}>
                    {formatMes(mes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {calculos.pendentes > 0 && (
            <div className="mt-5">
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 italic">
                {calculos.pendentes} pendente{calculos.pendentes > 1 ? "s" : ""} para classificar
              </span>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg">
              <TrendingUp className="w-4 h-4 mr-2" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="transacoes" className="rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="rounded-lg">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="saques" className="rounded-lg">
              <Wallet className="w-4 h-4 mr-2" />
              Dinheiro Pego
            </TabsTrigger>
            <TabsTrigger value="importar" className="rounded-lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Importar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <ResumoMensal
                  mesAtual={mesAtual}
                  totalFatura={calculos.totalFatura}
                  parteEu={calculos.parteEu}
                  parteDinda={calculos.parteDinda}
                  totalTerminam={calculos.totalTerminam}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SaldoCard
                    titulo="Meu Saldo"
                    valor={calculos.saldoAtualEu}
                    tipo="eu"
                    descricao={
                      <>
                        Pago Efetivo: R$ {calculos.pagoEfetivoEu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {calculos.creditoAnteriorEu > 0 && (
                          <span className="block text-[10px] text-emerald-500 font-medium">
                            (+ R$ {calculos.creditoAnteriorEu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de crédito anterior)
                          </span>
                        )}
                      </>
                    }
                    delay={0.2}
                  />
                  <SaldoCard
                    titulo="Saldo da Dinda"
                    valor={calculos.saldoAtualDinda}
                    tipo="dinda"
                    descricao={
                      <>
                        Pago Efetivo: R$ {calculos.pagoEfetivoDinda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {calculos.creditoAnteriorDinda > 0 && (
                          <span className="block text-[10px] text-emerald-500 font-medium">
                            (+ R$ {calculos.creditoAnteriorDinda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de crédito anterior)
                          </span>
                        )}
                      </>
                    }
                    delay={0.3}
                  />
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => {
                      if (window.confirm(`Deseja fechar o mês de ${formatMes(mesAtual)}? Os saldos atuais serão levados para o próximo mês.`)) {
                        closeMonth.mutate();
                      }
                    }}
                    disabled={closeMonth.isPending}
                    className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8"
                  >
                    {closeMonth.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Fechar Mês e Salvar Saldos
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="transacoes" className="space-y-4">
            <FiltrosTransacoes
              filtros={filtros}
              setFiltros={setFiltros}
              onLimpar={handleLimparFiltros}
              mostrarFiltros={mostrarFiltros}
              setMostrarFiltros={setMostrarFiltros}
            />
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : transacoesMes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhuma transação neste mês.</p>
                  <p className="text-sm mt-1">Importe uma fatura para começar.</p>
                </div>
              ) : transacoesFiltradas.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhuma transação encontrada com esses filtros.</p>
                  <Button
                    variant="link"
                    onClick={handleLimparFiltros}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <>
                  {transacoesFiltradas.map((transacao) => (
                    <TransacaoItem
                      key={transacao.id}
                      transacao={transacao}
                      onClassificar={handleClassificar}
                      onEdit={handleEditTransacao}
                      isLoading={updateTransacao.isPending}
                    />
                  ))}

                  {transacoesFiltradas.some(t => t.dono === "pendente") && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-4 border-t border-slate-200 mt-6 flex justify-center"
                    >
                      <Button
                        variant="outline"
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800 transition-colors gap-2"
                        onClick={async () => {
                          const ids = transacoesFiltradas
                            .filter(t => t.dono === "pendente")
                            .map(t => t.id);
                          if (ids.length > 0) {
                            if (window.confirm(`Deseja marcar as ${ids.length} transações pendentes como "Dinda"?`)) {
                              await updateManyTransacoes.mutateAsync({ ids, data: { dono: "dinda" } });
                            }
                          }
                        }}
                        disabled={updateManyTransacoes.isPending}
                      >
                        {updateManyTransacoes.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        Marcar pendentes como "Dinda"
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-6">
            <PagamentoForm
              onSave={(data) => createPagamento.mutate(data)}
              isLoading={createPagamento.isPending}
              mesReferenciaDefault={mesAtual}
            />
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Pagamentos de {formatMes(mesAtual)}
              </h3>
              <PagamentosList
                pagamentos={pagamentosMes}
                onDelete={(id) => deletePagamento.mutate(id)}
                isLoading={deletePagamento.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="saques" className="space-y-6">
            <SaqueForm
              onSave={(data) => createSaque.mutate(data)}
              isLoading={createSaque.isPending}
              mesReferenciaDefault={mesAtual}
            />
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Dinheiro Pego em {formatMes(mesAtual)}
              </h3>
              <SaqueList
                saques={saquesMes}
                onDelete={(id) => deleteSaque.mutate(id)}
                isLoading={deleteSaque.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="importar">
            <FaturaUploader
              onUploadSuccess={handleUploadSuccess}
              mesReferencia={mesAtual}
              setMesReferencia={setMesAtual}
            />
            <HistoricoFaturas
              meses={faturasImportadas}
              totalTransacoes={transacoes}
              onDeleteMonth={(mes) => deleteTransacaoMes.mutate(mes)}
              isLoading={deleteTransacaoMes.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
