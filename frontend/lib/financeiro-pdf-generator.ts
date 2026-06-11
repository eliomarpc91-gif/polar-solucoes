/**
 * Gerador de relatórios financeiros em PDF
 * Inclui logo, marca d'água e formatação profissional
 */

import { EntradaFinanceira, SaidaFinanceira, ResumenFinanceiroMes } from "./financeiro-automatico-types";

// Helper functions
const formatarData = (data: string) => new Date(data).toLocaleDateString("pt-BR");
const formatarMoeda = (valor: number) => `R$ ${valor.toFixed(2)}`;

interface PDFFinanceiroData {
  resumo: ResumenFinanceiroMes;
  empresa: {
    nome: string;
    cnpj: string;
    telefone: string;
    email: string;
    endereco: string;
    logo?: string; // Base64 ou URL
  };
  incluirEntradas: boolean;
  incluirSaidas: boolean;
  incluirDetalhes: boolean;
}

/**
 * Gera HTML para PDF de relatório financeiro
 */
export function buildPDFFinanceiroHTML(data: PDFFinanceiroData): string {
  const { resumo, empresa, incluirEntradas, incluirSaidas, incluirDetalhes } = data;
  const mesNome = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ][resumo.mes - 1];

  const estilos = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        background: #fff;
        position: relative;
      }
      
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 120px;
        color: rgba(27, 79, 114, 0.08);
        font-weight: bold;
        z-index: -1;
        white-space: nowrap;
        pointer-events: none;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        border-bottom: 2px solid #1B4F72;
        padding-bottom: 20px;
      }
      
      .logo-section {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .logo {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: contain;
      }
      
      .company-info {
        flex: 1;
      }
      
      .company-name {
        font-size: 24px;
        font-weight: bold;
        color: #1B4F72;
        margin-bottom: 4px;
      }
      
      .company-details {
        font-size: 11px;
        color: #666;
        line-height: 1.4;
      }
      
      .title-section {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .title {
        font-size: 28px;
        font-weight: bold;
        color: #1B4F72;
        margin-bottom: 8px;
      }
      
      .period {
        font-size: 14px;
        color: #666;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
        margin-bottom: 30px;
      }
      
      .summary-card {
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }
      
      .summary-card.entradas {
        background: #F0FDF4;
        border-left: 4px solid #16A34A;
      }
      
      .summary-card.saidas {
        background: #FEF2F2;
        border-left: 4px solid #EF4444;
      }
      
      .summary-card.lucro {
        background: #F0F9FF;
        border-left: 4px solid #1B4F72;
      }
      
      .summary-label {
        font-size: 11px;
        color: #666;
        margin-bottom: 6px;
        text-transform: uppercase;
        font-weight: 600;
      }
      
      .summary-value {
        font-size: 20px;
        font-weight: bold;
      }
      
      .summary-card.entradas .summary-value {
        color: #16A34A;
      }
      
      .summary-card.saidas .summary-value {
        color: #EF4444;
      }
      
      .summary-card.lucro .summary-value {
        color: #1B4F72;
      }
      
      .section {
        margin-bottom: 30px;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #1B4F72;
        margin-bottom: 15px;
        border-bottom: 2px solid #1B4F72;
        padding-bottom: 8px;
      }
      
      .indicators-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .indicator {
        background: #F9FAFB;
        border-radius: 8px;
        padding: 12px;
        border-left: 3px solid #1B4F72;
      }
      
      .indicator-label {
        font-size: 11px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .indicator-value {
        font-size: 16px;
        font-weight: bold;
        color: #111827;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      th {
        background: #1B4F72;
        color: #fff;
        padding: 12px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
      }
      
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 12px;
      }
      
      tr:nth-child(even) {
        background: #F9FAFB;
      }
      
      .amount {
        text-align: right;
        font-weight: 600;
      }
      
      .amount.entrada {
        color: #16A34A;
      }
      
      .amount.saida {
        color: #EF4444;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 11px;
        color: #999;
      }
      
      .page-break {
        page-break-after: always;
      }
    </style>
  `;

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro - ${mesNome} ${resumo.ano}</title>
  ${estilos}
</head>
<body>
  <div class="watermark">${empresa.nome}</div>
  
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${empresa.logo ? `<img src="${empresa.logo}" class="logo" alt="Logo" />` : ""}
        <div class="company-info">
          <div class="company-name">${empresa.nome}</div>
          <div class="company-details">
            <div>CNPJ: ${empresa.cnpj}</div>
            <div>Tel: ${empresa.telefone}</div>
            <div>Email: ${empresa.email}</div>
            <div>${empresa.endereco}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Título -->
    <div class="title-section">
      <div class="title">Relatório Financeiro</div>
      <div class="period">${mesNome} de ${resumo.ano}</div>
    </div>
    
    <!-- Resumo -->
    <div class="summary-grid">
      <div class="summary-card entradas">
        <div class="summary-label">Total de Entradas</div>
        <div class="summary-value">R$ ${resumo.totalEntradas.toFixed(2)}</div>
      </div>
      <div class="summary-card saidas">
        <div class="summary-label">Total de Saídas</div>
        <div class="summary-value">R$ ${resumo.totalSaidas.toFixed(2)}</div>
      </div>
      <div class="summary-card lucro">
        <div class="summary-label">Lucro Líquido</div>
        <div class="summary-value">R$ ${resumo.lucroLiquido.toFixed(2)}</div>
      </div>
    </div>
    
    <!-- Indicadores -->
    <div class="section">
      <div class="section-title">Indicadores</div>
      <div class="indicators-grid">
        <div class="indicator">
          <div class="indicator-label">Contas a Receber</div>
          <div class="indicator-value">R$ ${resumo.contasAReceber.toFixed(2)}</div>
        </div>
        <div class="indicator">
          <div class="indicator-label">Contas Pagas</div>
          <div class="indicator-value">${resumo.contasPagas}</div>
        </div>
        <div class="indicator">
          <div class="indicator-label">Contas Pendentes</div>
          <div class="indicator-value">${resumo.contasPendentes}</div>
        </div>
        <div class="indicator">
          <div class="indicator-label">Orçamentos Aprovados</div>
          <div class="indicator-value">${resumo.orcamentosAprovados}</div>
        </div>
        <div class="indicator">
          <div class="indicator-label">OS Finalizadas</div>
          <div class="indicator-value">${resumo.osFinalizadas}</div>
        </div>
      </div>
    </div>
  `;

  // Entradas
  if (incluirEntradas && resumo.entradas.length > 0) {
    html += `
      <div class="section">
        <div class="section-title">Entradas</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Categoria</th>
              <th class="amount">Valor</th>
            </tr>
          </thead>
          <tbody>
    `;

    resumo.entradas.forEach((entrada) => {
      html += `
        <tr>
          <td>${new Date(entrada.data).toLocaleDateString("pt-BR")}</td>
          <td>${entrada.descricao}</td>
          <td>${entrada.clienteNome}</td>
          <td>${entrada.categoria}</td>
          <td class="amount entrada">R$ ${entrada.valorRecebido.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // Saídas
  if (incluirSaidas && resumo.saidas.length > 0) {
    html += `
      <div class="section">
        <div class="section-title">Saídas</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Fornecedor</th>
              <th class="amount">Valor</th>
            </tr>
          </thead>
          <tbody>
    `;

    resumo.saidas.forEach((saida) => {
      html += `
        <tr>
          <td>${new Date(saida.data).toLocaleDateString("pt-BR")}</td>
          <td>${saida.descricao}</td>
          <td>${saida.categoria}</td>
          <td>${saida.fornecedor || "-"}</td>
          <td class="amount saida">R$ ${saida.valor.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
    <!-- Footer -->
    <div class="footer">
      <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      <p>Este documento é confidencial e destinado apenas ao uso autorizado.</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Gera um relatório financeiro em PDF
 */
export async function gerarRelatorioPDF(data: PDFFinanceiroData): Promise<string> {
  const html = buildPDFFinanceiroHTML(data);

  // Aqui você usaria uma biblioteca como react-native-html-to-pdf
  // ou weasyprint para gerar o PDF
  // Por enquanto, retornamos o HTML que pode ser convertido
  return html;
}
