import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { generatePDFWithLogo } from "@/lib/pdfGenerator";
import ProximosPagamentosChart from "@/components/ProximosPagamentosChart";
import {
  Activity,
  CalendarDays,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed"];
const CATEGORIAS = ["Fornecedor", "Fixo", "Variável", "Imposto", "Outro"] as const;
const STATUS = ["Pendente", "Pago", "Cancelado"] as const;

type TrendProps = { value: number; inverse?: boolean };

function TrendIndicator({ value, inverse = false }: TrendProps) {
  const isPositive = inverse ? value <= 0 : value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
      {value >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {Math.abs(value)}% vs. período anterior
    </span>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function Dashboard() {
  const [periodoFiltro, setPeriodoFiltro] = useState<"7d" | "30d" | "90d">("30d");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [agenteId, setAgenteId] = useState("");
  const [expandirFiltro, setExpandirFiltro] = useState(true);
  const [exportando, setExportando] = useState<"pdf" | "excel" | null>(null);

  const agentesQuery = trpc.agentes.list.useQuery();
  const proximosPagamentosQuery = trpc.dashboard.proximosPagamentos.useQuery();
  const analyticsInput = useMemo(() => ({
    periodo: periodoFiltro,
    dataInicio: dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined,
    dataFim: dataFim ? new Date(`${dataFim}T23:59:59`) : undefined,
    status: status ? (status as (typeof STATUS)[number]) : undefined,
    fornecedor: fornecedor || undefined,
    categoria: categoria ? (categoria as (typeof CATEGORIAS)[number]) : undefined,
    agenteId: agenteId ? Number(agenteId) : undefined,
  }), [periodoFiltro, dataInicio, dataFim, status, fornecedor, categoria, agenteId]);
  const analyticsQuery = trpc.dashboard.analytics.useQuery(analyticsInput);
  const analytics = analyticsQuery.data;
  const summary = analytics?.summary;

  const periodoLabel = dataInicio || dataFim
    ? `${dataInicio || "início"} a ${dataFim || "hoje"}`
    : `últimos ${periodoFiltro === "7d" ? "7" : periodoFiltro === "90d" ? "90" : "30"} dias`;

  const resetFilters = () => {
    setPeriodoFiltro("30d");
    setDataInicio("");
    setDataFim("");
    setStatus("");
    setFornecedor("");
    setCategoria("");
    setAgenteId("");
  };

  const handleExportExcel = () => {
    if (!analytics || !summary) return;
    setExportando("excel");
    const workbook = XLSX.utils.book_new();
    const resumoRows = [
      ["Relatório financeiro", ""],
      ["Período", periodoLabel],
      [],
      ["Indicador", "Período atual", "Período anterior", "Variação"],
      ["Receitas", formatCurrency(summary.receitas), formatCurrency(summary.receitasAnterior), `${summary.tendencias.receitas}%`],
      ["Despesas", formatCurrency(summary.despesas), formatCurrency(summary.despesasAnterior), `${summary.tendencias.despesas}%`],
      ["Saldo", formatCurrency(summary.saldo), formatCurrency(summary.saldoAnterior), `${summary.tendencias.saldo}%`],
      ["Índice de recebimento", `${summary.indiceRecebimento}%`, `${summary.indiceRecebimentoAnterior}%`, `${summary.tendencias.indiceRecebimento}%`],
      ["Dias médios para receber", `${summary.diasParaReceber} dias`, "", ""],
      ["Total pendente", formatCurrency(summary.totalPendente), "", ""],
      ["Comparação mensal", `${summary.comparacaoMensal.mesAtual} vs. ${summary.comparacaoMensal.mesAnterior}`, "", ""],
      ["Receitas no mês atual", formatCurrency(summary.comparacaoMensal.receitasAtual), "", `${summary.comparacaoMensal.tendencias.receitas}%`],
      ["Receitas no mês anterior", formatCurrency(summary.comparacaoMensal.receitasAnterior), "", ""],
    ];
    const serieRows = [["Data", "Receitas", "Despesas"], ...(analytics.serie || []).map(item => [item.data, formatCurrency(item.receitas), formatCurrency(item.despesas)])];
    const categoriaRows = [["Categoria", "Total"], ...(analytics.despesasPorCategoria || []).map(item => [item.name, formatCurrency(item.value)])];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumoRows), "Resumo");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(serieRows), "Evolução");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(categoriaRows), "Despesas");
    const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExportando(null);
  };

  const handleExportPdf = async () => {
    if (!analytics || !summary) return;
    setExportando("pdf");
    try {
      const blob = await generatePDFWithLogo({
        title: "Relatório Financeiro",
        content: [
          { label: "Período", value: periodoLabel },
          { label: "Receitas", value: formatCurrency(summary.receitas) },
          { label: "Despesas", value: formatCurrency(summary.despesas) },
          { label: "Saldo", value: formatCurrency(summary.saldo) },
          { label: "Índice de recebimento", value: `${summary.indiceRecebimento}%` },
          { label: "Dias médios para receber", value: `${summary.diasParaReceber} dias` },
          { label: "Total pendente", value: formatCurrency(summary.totalPendente) },
          { label: "Comparação mensal", value: `${summary.comparacaoMensal.mesAtual} vs. ${summary.comparacaoMensal.mesAnterior}` },
          { label: "Receitas no mês atual", value: formatCurrency(summary.comparacaoMensal.receitasAtual) },
          { label: "Receitas no mês anterior", value: formatCurrency(summary.comparacaoMensal.receitasAnterior) },
        ],
      });
      downloadBlob(blob, `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExportando(null);
    }
  };

  if (analyticsQuery.isLoading) {
    return <DashboardLayout><div className="py-12 text-center text-gray-500">Carregando análise financeira...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
            <p className="mt-2 text-gray-600">Visão consolidada de receitas, despesas e recebimentos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportPdf} disabled={!analytics || exportando !== null} className="gap-2">
              <FileText className="h-4 w-4" /> {exportando === "pdf" ? "Gerando..." : "Exportar PDF"}
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={!analytics || exportando !== null} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> {exportando === "excel" ? "Gerando..." : "Exportar Excel"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setExpandirFiltro(value => !value)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-5 w-5 text-blue-600" /> Filtros avançados</CardTitle>
              <span className="text-sm text-gray-500">{expandirFiltro ? "Recolher" : "Expandir"}</span>
            </div>
          </CardHeader>
          {expandirFiltro && (
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["7d", "30d", "90d"] as const).map(periodo => (
                  <Button key={periodo} variant={periodoFiltro === periodo ? "default" : "outline"} onClick={() => setPeriodoFiltro(periodo)} size="sm">
                    {periodo === "7d" ? "7 dias" : periodo === "30d" ? "30 dias" : "90 dias"}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <label className="text-sm font-medium text-gray-700">Data início<input type="date" value={dataInicio} onChange={event => setDataInicio(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2 font-normal" /></label>
                <label className="text-sm font-medium text-gray-700">Data fim<input type="date" value={dataFim} onChange={event => setDataFim(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2 font-normal" /></label>
                <label className="text-sm font-medium text-gray-700">Status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 font-normal"><option value="">Todos</option>{STATUS.map(value => <option key={value}>{value}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700">Fornecedor<select value={fornecedor} onChange={event => setFornecedor(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 font-normal"><option value="">Todos</option>{(analytics?.fornecedores || []).map(value => <option key={value}>{value}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700">Categoria<select value={categoria} onChange={event => setCategoria(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 font-normal"><option value="">Todas</option>{CATEGORIAS.map(value => <option key={value}>{value}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700">Agente<select value={agenteId} onChange={event => setAgenteId(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 font-normal"><option value="">Todos</option>{(agentesQuery.data || []).map(agente => <option key={agente.id} value={agente.id}>{agente.nome}</option>)}</select></label>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
                <span>Os gráficos são atualizados automaticamente · {periodoLabel}</span>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2"><RefreshCcw className="h-4 w-4" /> Limpar filtros</Button>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600"><TrendingUp className="h-4 w-4 text-emerald-500" /> Receitas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-700">{formatCurrency(summary?.receitas || 0)}</div><TrendIndicator value={summary?.tendencias.receitas || 0} /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600"><TrendingDown className="h-4 w-4 text-red-500" /> Despesas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-700">{formatCurrency(summary?.despesas || 0)}</div><TrendIndicator value={summary?.tendencias.despesas || 0} inverse /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600"><WalletCards className="h-4 w-4 text-blue-500" /> Saldo</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${(summary?.saldo || 0) >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(summary?.saldo || 0)}</div><TrendIndicator value={summary?.tendencias.saldo || 0} /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600"><HeartPulse className="h-4 w-4 text-violet-500" /> Saúde financeira</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-violet-700">{summary?.indiceRecebimento || 0}%</div><p className="text-xs text-gray-500">Índice de recebimento</p><TrendIndicator value={summary?.tendencias.indiceRecebimento || 0} /></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card><CardContent className="flex items-center gap-3 pt-6"><Activity className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-gray-500">Total pendente</p><p className="text-xl font-semibold">{formatCurrency(summary?.totalPendente || 0)}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 pt-6"><CheckCircle className="h-8 w-8 text-emerald-500" /><div><p className="text-sm text-gray-500">Dias médios para receber</p><p className="text-xl font-semibold">{summary?.diasParaReceber || 0} dias</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 pt-6"><Download className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-gray-500">Comparação mensal</p><p className="text-sm font-semibold capitalize">{summary?.comparacaoMensal.mesAtual || "Mês atual"} vs. {summary?.comparacaoMensal.mesAnterior || "mês anterior"}</p><p className="text-xs text-gray-500">Receitas: {formatCurrency(summary?.comparacaoMensal.receitasAtual || 0)} · {summary?.comparacaoMensal.tendencias.receitas || 0}%</p></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Evolução de receitas e despesas</CardTitle></CardHeader><CardContent>{analytics?.serie?.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={analytics.serie}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="data" /><YAxis /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Line type="monotone" dataKey="receitas" stroke="#059669" name="Receitas" /><Line type="monotone" dataKey="despesas" stroke="#dc2626" name="Despesas" /></LineChart></ResponsiveContainer> : <p className="py-8 text-center text-gray-500">Sem dados para os filtros selecionados.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Despesas por categoria</CardTitle></CardHeader><CardContent>{analytics?.despesasPorCategoria?.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={analytics.despesasPorCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>{analytics.despesasPorCategoria.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /></PieChart></ResponsiveContainer> : <p className="py-8 text-center text-gray-500">Sem despesas para os filtros selecionados.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Top agentes por volume</CardTitle></CardHeader><CardContent>{analytics?.topAgentes?.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={analytics.topAgentes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Bar dataKey="total" fill="#2563eb" name="Vendas" /></BarChart></ResponsiveContainer> : <p className="py-8 text-center text-gray-500">Sem vendas para os filtros selecionados.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Próximos pagamentos</CardTitle></CardHeader><CardContent>{proximosPagamentosQuery.data && Object.keys(proximosPagamentosQuery.data).length ? <ProximosPagamentosChart data={proximosPagamentosQuery.data} /> : <p className="py-8 text-center text-gray-500">Nenhum pagamento próximo.</p>}</CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
