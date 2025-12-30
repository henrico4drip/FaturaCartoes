import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FiltrosTransacoes({ filtros, setFiltros, onLimpar, mostrarFiltros, setMostrarFiltros }) {
  const handleChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const temFiltrosAtivos = () => {
    return filtros.busca || filtros.dono !== "todos" || filtros.valorMin || filtros.valorMax || filtros.dataInicio || filtros.dataFim;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por descrição..."
            value={filtros.busca}
            onChange={(e) => handleChange("busca", e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={mostrarFiltros ? "bg-slate-100" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
        {temFiltrosAtivos() && (
          <Button
            variant="ghost"
            onClick={onLimpar}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <AnimatePresence>
        {mostrarFiltros && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Classificação</label>
                  <Select
                    value={filtros.dono}
                    onValueChange={(value) => handleChange("dono", value)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {filtros.dono === 'todos' ? 'Todos' :
                          filtros.dono === 'eu' ? 'Eu' :
                            filtros.dono === 'dinda' ? 'Dinda' :
                              filtros.dono === 'pendente' ? 'Pendente' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="eu">Eu</SelectItem>
                      <SelectItem value="dinda">Dinda</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Valor Mínimo</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={filtros.valorMin}
                    onChange={(e) => handleChange("valorMin", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Valor Máximo</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={filtros.valorMax}
                    onChange={(e) => handleChange("valorMax", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Data Início</label>
                  <Input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => handleChange("dataInicio", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Data Fim</label>
                  <Input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => handleChange("dataFim", e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
