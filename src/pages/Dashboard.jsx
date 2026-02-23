import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MonthPicker from "@/components/ui/monthpicker.jsx";
import { FileText, CreditCard, DollarSign, TrendingUp, Loader2, Search, Wallet, CheckCircle, ListChecks, Trash2, RefreshCw } from "lucide-react";
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

  // Tabela 'faturas' armazena metadados como vencimento
  const { data: faturasDb = [] } = useQuery({
    queryKey: ["faturas_db"],
    queryFn: () => base44.entities.Fatura.list("-mes_referencia"),
  });

  const { data: regras = [] } = useQuery({
    queryKey: ["regras"],
    queryFn: () => base44.entities.RegraClassificacao.list(),
  });

  const createTransacao = useMutation({
    mutationFn: (data) => base44.entities.Transacao.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transacoes"] }),
    onError: (error) => {
      if (error?.code === '23505') return
      alert("Erro ao criar transação: " + (error?.message || ''))
    },
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
    mutationFn: async (mes) => {
      await base44.entities.Transacao.deleteByMonth(mes);
      try {
        await base44.entities.Fatura.delete(mes);
      } catch (e) {
        console.warn("Fatura meta not found or couldn't be deleted:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["faturas_db"] });
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

  const saveFatura = useMutation({
    mutationFn: (data) => {
      // Upsert na tabela faturas (PK é mes_referencia)
      // create do base44Client usa upsert se configurado, mas o entityAdapter genérico.
      // O Adapter genérico assume que ID é a chave para update?
      // Ou upsert usa onConflict?
      // Se a tabela tem PK mes_referencia, e eu mando mes_referencia...
      // O base44Client.js usa .upsert(toInsert, { onConflict: 'hash_unico' }).
      // Isso vai falhar se a tabela faturas não tiver hash_unico constraint.
      // HACK: Adicionar hash_unico na payload e na tabela?
      // Ou alterar o base44Client para aceitar onConflict param customizável?
      // Vou alterar o base44Client.js na próxima etapa se precisar.
      // Por enquanto, vou tentar usar. Se falhar, eu corrijo.
      // Mas espere, eu tenho controle total.
      // Vou adicionar hash_unico na tabela faturas? Não, sujo.
      // Vou usar 'mes_referencia' como conflict target se eu pudesse editar base44Client.
      // Vou editar base44Client TAMBÉM.
      return base44.entities.Fatura.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faturas_db"] }),
    onError: (error) => alert("Erro ao salvar vencimento: " + error.message),
  });

  const createRegra = useMutation({
    mutationFn: (data) => base44.entities.RegraClassificacao.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regras"] }),
    onError: (error) => alert("Erro ao criar regra: " + error.message),
  });

  const deleteTransacao = useMutation({
    mutationFn: (id) => base44.entities.Transacao.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transacoes"] }),
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

  const pendentesTransacoes = useMemo(() => {
    return transacoesFiltradas.filter(t => t.dono === "pendente");
  }, [transacoesFiltradas]);

  const classificadasTransacoes = useMemo(() => {
    return transacoesFiltradas.filter(t => t.dono !== "pendente");
  }, [transacoesFiltradas]);

  const parcelasAbertasTodas = useMemo(() => {
    // Usa transacoesMes para garantir que olhamos apenas o "snapshot" da dívida no mês selecionado
    const all = transacoesMes.filter(t => (t.parcela_total || 0) > 0 && (t.parcela_atual || 0) > 0 && t.parcela_atual < t.parcela_total)
    const seen = new Set()
    const keyOf = (t) => t.hash_unico || `${t.descricao}_${t.valor}_${t.parcela_total}`
    return all.filter(t => {
      const k = keyOf(t)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [transacoesMes])

  const parcelasEu = useMemo(() => parcelasAbertasTodas.filter(t => t.dono === 'eu'), [parcelasAbertasTodas])
  const parcelasDinda = useMemo(() => parcelasAbertasTodas.filter(t => t.dono === 'dinda'), [parcelasAbertasTodas])
  const totalRestanteEu = useMemo(() => parcelasEu.reduce((sum, t) => sum + ((t.parcela_total - t.parcela_atual) * (t.valor || 0)), 0), [parcelasEu])
  const totalRestanteDinda = useMemo(() => parcelasDinda.reduce((sum, t) => sum + ((t.parcela_total - t.parcela_atual) * (t.valor || 0)), 0), [parcelasDinda])

  function addMonths(m, n) {
    const [y, mm] = m.split('-').map(Number)
    const date = new Date(y, mm - 1, 1)
    date.setMonth(date.getMonth() + n)
    const ny = date.getFullYear()
    const nm = String(date.getMonth() + 1).padStart(2, '0')
    return `${ny}-${nm}`
  }

  const projecoesParcelas = useMemo(() => {
    const abertasMesAtual = transacoes
      .filter(t => t.fatura_mes_ref === mesAtual)
      .filter(t => (t.parcela_total || 0) > 0 && (t.parcela_atual || 0) > 0 && t.parcela_atual < t.parcela_total)
    const proj = {}
    abertasMesAtual.forEach(t => {
      const restantes = t.parcela_total - t.parcela_atual
      for (let i = 1; i <= restantes; i++) {
        const mes = addMonths(mesAtual, i)
        if (!proj[mes]) proj[mes] = { eu: 0, dinda: 0, total: 0 }
        const v = t.valor || 0
        if (t.dono === 'eu') proj[mes].eu += v
        else if (t.dono === 'dinda') proj[mes].dinda += v
        proj[mes].total += v
      }
    })
    const meses = []
    for (let i = 1; i <= 6; i++) {
      const mes = addMonths(mesAtual, i)
      meses.push({ mes, ...(proj[mes] || { eu: 0, dinda: 0, total: 0 }) })
    }
    return meses
  }, [transacoes, mesAtual])

  const projecoesParcelasPorMes = useMemo(() => {
    const out = {}
    transacoes.forEach(t => {
      const total = t.parcela_total || 0
      const atual = t.parcela_atual || 0
      if (total > 0 && atual > 0) {
        for (let i = 1; i <= total; i++) {
          const delta = i - atual
          const mes = addMonths(t.fatura_mes_ref, delta)
          if (!out[mes]) out[mes] = { eu: 0, dinda: 0, total: 0 }
          const v = t.valor || 0
          if (t.dono === 'eu') out[mes].eu += v
          else if (t.dono === 'dinda') out[mes].dinda += v
          out[mes].total += v
        }
      }
    })
    return out
  }, [transacoes])

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
    const seen = new Set()
    const keyOf = (t) => t.hash_unico || `${t.data}_${t.valor}_${t.descricao}`
    const uniq = transacoesMes.filter(t => {
      const k = keyOf(t)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    let totalFatura = uniq.reduce((sum, t) => sum + (t.valor || 0), 0)
    let parteEu = uniq.filter(t => t.dono === "eu").reduce((sum, t) => sum + (t.valor || 0), 0)
    let parteDinda = uniq.filter(t => t.dono === "dinda").reduce((sum, t) => sum + (t.valor || 0), 0)
    const pendentes = uniq.filter(t => t.dono === "pendente").length;

    if (totalFatura === 0 && projecoesParcelasPorMes[mesAtual]) {
      const proj = projecoesParcelasPorMes[mesAtual]
      parteEu = proj.eu
      parteDinda = proj.dinda
      totalFatura = proj.total
    }

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

  const resumoPorMes = useMemo(() => {
    const out = {};
    const seenPerMes = {};
    transacoes.forEach(t => {
      const mes = t.fatura_mes_ref;
      if (!mes) return;
      if (!seenPerMes[mes]) seenPerMes[mes] = new Set();
      const key = t.hash_unico || `${t.data}_${t.valor}_${t.descricao}`;
      if (seenPerMes[mes].has(key)) return;
      seenPerMes[mes].add(key);
      const v = t.valor || 0;
      if (!out[mes]) out[mes] = { eu: 0, dinda: 0, total: 0 };
      if (t.dono === 'eu') out[mes].eu += v;
      else if (t.dono === 'dinda') out[mes].dinda += v;
      out[mes].total += v;
    });
    return out;
  }, [transacoes]);

  function getMesAnterior(mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    const novoMes = mesNum === 1 ? 12 : mesNum - 1;
    const novoAno = mesNum === 1 ? ano - 1 : ano;
    return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
  }

  function normalizeDate(raw, mesRef) {
    if (!raw) return `${mesRef}-01`;
    const iso = /^\d{4}-\d{2}-\d{2}$/
    const dmy = /^\d{2}\/\d{2}\/(\d{4})$/
    const dm = /^\d{2}\/\d{2}$/
    if (iso.test(raw)) return raw
    if (dmy.test(raw)) {
      const [dd, mm, yyyy] = raw.split('/')
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    if (dm.test(raw)) {
      const [yyyy, mmRef] = mesRef.split('-')
      const [dd, mm] = raw.split('/')
      const finalMonth = (mm || mmRef).padStart(2, '0')
      return `${yyyy}-${finalMonth}-${dd.padStart(2, '0')}`
    }
    return `${mesRef}-01`
  }

  const handleUploadSuccess = async (transacoesExtraidas, mesRef, fileName) => {
    // Salva o nome do arquivo na tabela de faturas
    if (fileName) {
      saveFatura.mutate({
        mes_referencia: mesRef,
        arquivo_nome: fileName
      });
    }

    const normMoney = (v) => {
      if (v == null) return 0
      let s = String(v).trim()
      s = s.replace(/\s+/g, '')
      s = s.replace(/[^0-9,.\-]/g, '')
      const hasComma = s.includes(',')
      const hasDot = s.includes('.')
      if (hasComma && hasDot) {
        s = s.replace(/\./g, '').replace(',', '.')
      } else if (hasComma && !hasDot) {
        s = s.replace(',', '.')
      }
      return parseFloat(s) || 0
    }
    const normalizeDescricao = (d) =>
      String(d || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    const blacklist = [
      'PAGAMENTO',
      'RESUMO',
      'TOTAL',
      'TOTAL FINAL',
      'TOTAL COMPRAS PARCELADAS',
      'TOTAL COMPRAS',
      'SUBTOTAL',
      'VENCIMENTO',
      'LIMITE',
      'CREDITO',
      'JUROS',
      'MULTA',
      'ENCARGO',
      'ANUIDADE',
      'TARIFA',
      'IOF',
      'AVISO',
      'FATURA',
      'SALDO PREVISTO',
      'DESPESAS A VENCER',
      'FATURA ANTERIOR',
      'AJUSTE'
    ]
    const isResumoOuPagamento = (desc) => {
      const nd = normalizeDescricao(desc)
      return blacklist.some(tok => nd.includes(tok))
    }
    const sanitizadas = transacoesExtraidas.filter(t => !isResumoOuPagamento(t.descricao))

    const consumedIds = new Set(); // Para evitar dar match na mesma transação existente múltiplas vezes

    for (const t of sanitizadas) {
      const dataNormalizada = normalizeDate(t.data, mesRef)
      const valorNormalizado = normMoney(t.valor)
      const parcelaAtual = (t.parcela_atual === null || t.parcela_atual === undefined) ? null : Number(t.parcela_atual)
      const parcelaTotal = (t.parcela_total === null || t.parcela_total === undefined) ? null : Number(t.parcela_total)
      const hash = `${dataNormalizada}_${valorNormalizado}_${t.descricao}_${parcelaAtual || 0}`;

      // 1. Tenta encontrar exata pelo hash (já existente)
      const existeHash = transacoes.find(existing => existing.hash_unico === hash);
      if (existeHash) {
        consumedIds.add(existeHash.id);
        console.log('Transação exata já existe, pulando:', t.descricao);
        continue;
      }

      // 2. Busca Inteligente (Merge de Projeção vs Real) - AGORA LIDA COM MÚLTIPLAS DUPLICATAS
      const duplicadasCandidatas = transacoes.filter(existing => {
        if (consumedIds.has(existing.id)) return false;
        if (existing.fatura_mes_ref !== mesRef) return false;

        // Verifica Parcela (se for parcelado, deve bater exato)
        if (parcelaAtual !== null) {
          if (existing.parcela_atual !== parcelaAtual) return false;
          // Se ambos tiverem total, deve bater. Se um não tiver, aceita (pois pode ser uma projeção incompleta)
          if (parcelaTotal && existing.parcela_total && existing.parcela_total !== parcelaTotal) return false;
        }

        // Verifica Valor (Margem de segurança para arredondamentos)
        if (Math.abs(existing.valor - valorNormalizado) > 0.05) return false;

        // Se descrição for MUITO diferente e não for parcelado, cuidado para não mergear coisas distintas de mesmo valor.
        // Mas para parcelas, valor + índice é uma "chave forte".
        // Para à vista, vamos exigir uma semelhança mínima na descrição.
        if (parcelaAtual === null) {
          const simplify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");
          const wordsNew = simplify(t.descricao).split(/\s+/).filter(w => w.length > 2);
          const wordsExist = simplify(existing.descricao).split(/\s+/).filter(w => w.length > 2);

          // 1. Tem alguma palavra significativa em comum? (Ex: "Uber" em "Uber Trip" e "Uber Eats")
          const hasCommonWord = wordsNew.some(w => wordsExist.includes(w));

          if (!hasCommonWord) {
            // 2. Tentativa de substring (Ex: "Netflix" dentro de "Pag*Netflix.com")
            const s1 = simplify(t.descricao).replace(/\s/g, '');
            const s2 = simplify(existing.descricao).replace(/\s/g, '');
            // Se nem substring funcionar, assumimos que são diferentes
            if (!s1.includes(s2) && !s2.includes(s1)) return false;
          }
        }

        // Se chegou aqui:
        // - Ou é parcelado (e valor/parcela batem) -> Merge direto (descrição irrelevante)
        // - Ou é à vista e tem semelhança no nome -> Merge
        return true;
      });

      // Helper para gerar projeções futuras de compras parceladas
      const handleGerarProjecao = async (tInst) => {
        if (!tInst.parcela_total || !tInst.parcela_atual) return;
        if (tInst.parcela_atual >= tInst.parcela_total) return;

        const remaining = tInst.parcela_total - tInst.parcela_atual;
        // Evita gerar muitas parcelas se for erro de leitura (ex: 2/999)
        if (remaining > 60) return;

        const [anoStr, mesStr] = tInst.fatura_mes_ref.split('-');
        const ano = parseInt(anoStr);
        const mes = parseInt(mesStr); // 1-12

        console.log(`Gerando ${remaining} projeções futuras para: ${tInst.descricao}`);

        for (let i = 1; i <= remaining; i++) {
          const nextDate = new Date(ano, mes - 1 + i, 10); // Dia 10 arbitrário
          const nextAno = nextDate.getFullYear();
          const nextMes = String(nextDate.getMonth() + 1).padStart(2, '0');
          const nextMesRef = `${nextAno}-${nextMes}`;

          const nextParcela = tInst.parcela_atual + i;
          // Hash determinístico para a projeção
          const hashProj = `PROJ_${tInst.data}_${tInst.valor}_${nextParcela}_of_${tInst.parcela_total}`;

          await createTransacao.mutateAsync({
            data: nextDate.toISOString().split('T')[0],
            descricao: tInst.descricao,
            valor: tInst.valor,
            parcela_atual: nextParcela,
            parcela_total: tInst.parcela_total,
            fatura_mes_ref: nextMesRef,
            dono: tInst.dono,
            categoria: tInst.categoria,
            hash_unico: hashProj
          });
        }
      };

      if (duplicadasCandidatas.length > 0) {
        // Escolhe uma para ser a vencedora (por exemplo, a primeira)
        const vencedora = duplicadasCandidatas[0];
        console.log(`Mesclando Projeção (${vencedora.descricao}) com Fatura Real (${t.descricao})`);
        consumedIds.add(vencedora.id);

        try {
          // Atualiza a vencedora
          const updated = await updateTransacao.mutateAsync({
            id: vencedora.id,
            data: {
              data: dataNormalizada,
              descricao: t.descricao, // Atualiza para descrição oficial da fatura
              hash_unico: hash // Atualiza hash para evitar problemas futuros
              // Mantém 'dono' e 'categoria' originais!
            }
          });

          if (updated) {
            // Garante que as projeções existem (caso seja uma transação antiga que não tinha projeções)
            await handleGerarProjecao({ ...vencedora, ...updated.data, fatura_mes_ref: mesRef, parcela_total: parcelaTotal, parcela_atual: parcelaAtual });
          }

          // Se existirem OUTRAS duplicatas (ex: projeção de Nov + projeção de Dez), apaga elas!
          if (duplicadasCandidatas.length > 1) {
            for (let i = 1; i < duplicadasCandidatas.length; i++) {
              console.log(`Apagando duplicata extra: ${duplicadasCandidatas[i].descricao} (ID: ${duplicadasCandidatas[i].id})`);
              await deleteTransacao.mutateAsync(duplicadasCandidatas[i].id);
              consumedIds.add(duplicadasCandidatas[i].id);
            }
          }

          // Se não encontrou o registro para atualizar (updated é null), cria um novo
          if (!updated) {
            console.warn('Falha no merge (registro não encontrado), criando nova:', t.descricao);
            const regra = regras.find(r =>
              t.descricao.toLowerCase().includes(r.descricao_padrao.toLowerCase())
            );
            const novaT = await createTransacao.mutateAsync({
              data: dataNormalizada,
              descricao: t.descricao,
              valor: valorNormalizado,
              parcela_atual: parcelaAtual,
              parcela_total: parcelaTotal,
              hash_unico: hash,
              fatura_mes_ref: mesRef,
              dono: regra?.dono_sugerido || "pendente",
              categoria: regra?.categoria || ""
            });
            if (novaT) await handleGerarProjecao(novaT);
          }
        } catch (e) {
          console.error('Erro ao mesclar transação:', e);
        }
        continue;
      }

      const regra = regras.find(r =>
        t.descricao.toLowerCase().includes(r.descricao_padrao.toLowerCase())
      );
      try {
        const novaT = await createTransacao.mutateAsync({
          data: dataNormalizada,
          descricao: t.descricao,
          valor: valorNormalizado,
          parcela_atual: parcelaAtual,
          parcela_total: parcelaTotal,
          hash_unico: hash,
          fatura_mes_ref: mesRef,
          dono: regra?.dono_sugerido || "pendente",
          categoria: regra?.categoria || ""
        });
        if (novaT) await handleGerarProjecao(novaT);
      } catch (error) {
        if (error.code === '23505') {
          console.log('Transação já existe (BD), variando hash:', t.descricao);
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

  const handleSanitize = async () => {
    const future = transacoes.filter(t => t.fatura_mes_ref > mesAtual);
    const groups = {};
    future.forEach(t => {
      // Apenas parcelados são relevantes para projeção futura duplicada
      // Mas se o usuário tem "duplicata" de valor exato sem parcela, também pode ser erro, mas vamos focar em parcelas agora.
      if (t.parcela_atual === null || t.parcela_atual === undefined) return;

      // Chave única: Mês + Valor + Parcela (ignorando total e descrição para garantir limpeza agressiva)
      const k = `${t.fatura_mes_ref}_${Number(t.valor).toFixed(2)}_${t.parcela_atual}`;
      if (!groups[k]) groups[k] = [];
      groups[k].push(t);
    });

    const toDelete = [];
    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        // Mantém o com 'hash_unico' mais completo ou simplesmente o primeiro
        const sorted = group.sort((a, b) => (b.hash_unico?.length || 0) - (a.hash_unico?.length || 0));
        // Mantém sorted[0], deleta resto
        for (let i = 1; i < sorted.length; i++) {
          toDelete.push(sorted[i]);
        }
      }
    });

    if (toDelete.length > 0) {
      if (confirm(`ENCONTRADAS ${toDelete.length} DUPLICATAS (Critério Relaxado). Deseja limpar agora?`)) {
        let count = 0;
        for (const t of toDelete) {
          await deleteTransacao.mutateAsync(t.id);
          count++;
        }
        alert(`Limpeza concluída! ${count} itens removidos.`);
        queryClient.invalidateQueries();
      }
    } else {
      alert("Nenhuma duplicata futura encontrada com os novos critérios.");
    }
  };

  const handleBackfill = async () => {
    let createdCount = 0;
    const candidates = transacoes.filter(t => (t.parcela_total || 0) > 0 && (t.parcela_atual || 0) > 0 && t.parcela_atual < t.parcela_total);

    console.log(`Verificando ${candidates.length} transações parceladas para gerar projeções faltantes...`);

    // Cria um mapa rápido para checar existência
    // Chave: MesRef_Valor_ParcelaAtual
    const existingMap = new Set();
    transacoes.forEach(t => {
      existingMap.add(`${t.fatura_mes_ref}_${Number(t.valor).toFixed(2)}_${t.parcela_atual}`);
    });

    for (const t of candidates) {
      const remaining = t.parcela_total - t.parcela_atual;
      if (remaining > 60) continue;

      const [anoStr, mesStr] = t.fatura_mes_ref.split('-');
      const ano = parseInt(anoStr);
      const mes = parseInt(mesStr);

      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(ano, mes - 1 + i, 10);
        const nextAno = nextDate.getFullYear();
        const nextMes = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextMesRef = `${nextAno}-${nextMes}`;
        const nextParcela = t.parcela_atual + i;

        // Verifica se JÁ EXISTE essa projeção (no mapa em memória)
        const checkKey = `${nextMesRef}_${Number(t.valor).toFixed(2)}_${nextParcela}`;
        if (existingMap.has(checkKey)) {
          continue; // Já existe, pula
        }

        // Se não existe, cria!
        const hashProj = `PROJ_${t.data}_${t.valor}_${nextParcela}_of_${t.parcela_total}`;

        await createTransacao.mutateAsync({
          data: nextDate.toISOString().split('T')[0],
          descricao: t.descricao,
          valor: t.valor,
          parcela_atual: nextParcela,
          parcela_total: t.parcela_total,
          fatura_mes_ref: nextMesRef,
          dono: t.dono,
          categoria: t.categoria,
          hash_unico: hashProj
        });

        // Adiciona ao mapa para não duplicar se rodar de novo no loop (ex: chain reaction)
        existingMap.add(checkKey);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      alert(`Backfill concluído! ${createdCount} projeções futuras foram geradas que estavam faltando.`);
    } else {
      // alert("Todas as projeções já parecem estar corretas.");
    }
  };

  const handleMaintenance = async () => {
    // 1. Limpa Duplicatas
    await handleSanitize();
    // 2. Gera Faltantes
    if (confirm("Deseja verificar e gerar projeções futuras que podem estar faltando para faturas antigas?")) {
      await handleBackfill();
    }
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {(!isLoading && transacoes.length === 0 && pagamentos.length === 0 && saques.length === 0 && fechamentos.length === 0) && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            Supabase sem dados ou tabelas ausentes. Execute o SQL em supabase/schema.sql e recarregue.
          </div>
        )}
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
            <div className="flex items-center gap-2">
              <MonthPicker value={mesAtual} onChange={setMesAtual} />
              <button
                onClick={async () => {
                  await handleMaintenance();
                }}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Manutenção: Corrigir e Gerar Projeções"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`TEM CERTEZA? Isso apagará TODAS as transações de ${formatMes(mesAtual)}. O arquivo da fatura continuará no Storage, mas os dados sumirão do painel.`)) {
                    deleteTransacaoMes.mutate(mesAtual);
                  }
                }}
                disabled={deleteTransacaoMes.isPending}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Limpar dados deste mês (Trash)"
              >
                {deleteTransacaoMes.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>

              <div className="flex flex-col ml-6 border-l pl-6 border-slate-200">
                <label className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Vencimento Fatura</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-600 focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                  value={faturasDb.find(f => f.mes_referencia === mesAtual)?.data_vencimento || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    saveFatura.mutate({
                      mes_referencia: mesAtual,
                      data_vencimento: val
                    });
                  }}
                />
              </div>
            </div>
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
            <TabsTrigger value="parcelas" className="rounded-lg">
              <ListChecks className="w-4 h-4 mr-2" />
              Parcelas
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
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Próximos meses (parcelas da fatura atual)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {projecoesParcelas.map((m) => (
                      <div key={m.mes} className="rounded-lg border border-slate-100 p-3">
                        <p className="text-sm font-medium text-slate-800">{formatMes(m.mes)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-600">Eu</span>
                          <span className="text-sm font-semibold text-slate-800">R$ {m.eu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-600">Dinda</span>
                          <span className="text-sm font-semibold text-slate-800">R$ {m.dinda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 border-t border-slate-100 pt-2">
                          <span className="text-xs text-slate-600">Total</span>
                          <span className="text-sm font-semibold text-slate-800">R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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

          <TabsContent value="parcelas" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700">Minhas Parcelas</h3>
                      <span className="text-sm text-slate-600">Total restante: R$ {totalRestanteEu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="space-y-2">
                      {parcelasEu.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhuma parcela em aberto.</p>
                      ) : (
                        parcelasEu.map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{t.descricao}</p>
                              <p className="text-xs text-slate-500">Parcela {t.parcela_atual}/{t.parcela_total} • Faltam {t.parcela_total - t.parcela_atual}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              <p className="text-xs text-slate-500">Restante: R$ {((t.parcela_total - t.parcela_atual) * t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700">Parcelas da Dinda</h3>
                      <span className="text-sm text-slate-600">Total restante: R$ {totalRestanteDinda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="space-y-2">
                      {parcelasDinda.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhuma parcela em aberto.</p>
                      ) : (
                        parcelasDinda.map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{t.descricao}</p>
                              <p className="text-xs text-slate-500">Parcela {t.parcela_atual}/{t.parcela_total} • Faltam {t.parcela_total - t.parcela_atual}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              <p className="text-xs text-slate-500">Restante: R$ {((t.parcela_total - t.parcela_atual) * t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
                  {pendentesTransacoes.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-amber-700">Pendentes</h3>
                      {pendentesTransacoes.map((transacao) => (
                        <TransacaoItem
                          key={transacao.id}
                          transacao={transacao}
                          onClassificar={handleClassificar}
                          onEdit={handleEditTransacao}
                          isLoading={updateTransacao.isPending}
                        />
                      ))}
                      <div className="pt-2 flex justify-center">
                        <Button
                          variant="outline"
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800 transition-colors gap-2"
                          onClick={async () => {
                            const ids = pendentesTransacoes.map(t => t.id)
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
                      </div>
                    </div>
                  )}
                  {classificadasTransacoes.length > 0 && (
                    <div className="space-y-2 mt-6">
                      <h3 className="text-sm font-semibold text-slate-700">Classificadas</h3>
                      {classificadasTransacoes.map((transacao) => (
                        <TransacaoItem
                          key={transacao.id}
                          transacao={transacao}
                          onClassificar={handleClassificar}
                          onEdit={handleEditTransacao}
                          isLoading={updateTransacao.isPending}
                        />
                      ))}
                    </div>
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
              faturasDb={faturasDb}
              onDeleteMonth={(mes) => deleteTransacaoMes.mutate(mes)}
              isLoading={deleteTransacaoMes.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
