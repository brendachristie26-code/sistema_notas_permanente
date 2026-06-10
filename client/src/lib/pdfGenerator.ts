import jsPDF from 'jspdf';

export interface PDFGeneratorOptions {
  title: string;
  logoUrl?: string;
  content: Array<{
    label: string;
    value: string | number;
  }>;
  items?: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  nomeEmpresa?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export async function generatePDFWithLogo(options: PDFGeneratorOptions): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Adicionar logo se disponível
  if (options.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = options.logoUrl!;
      });

      // Adicionar logo no topo (máximo 40x40)
      doc.addImage(img, 'PNG', 15, 10, 40, 40);
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
    }
  }

  // Cabeçalho com dados da empresa
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(options.nomeEmpresa || 'Minha Empresa', pageWidth - 15, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (options.endereco) doc.text(`Endereço: ${options.endereco}`, pageWidth - 15, 28, { align: 'right' });
  if (options.telefone) doc.text(`Telefone: ${options.telefone}`, pageWidth - 15, 34, { align: 'right' });
  if (options.email) doc.text(`Email: ${options.email}`, pageWidth - 15, 40, { align: 'right' });

  yPosition = 55;

  // Título
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(options.title, 15, yPosition);
  yPosition += 15;

  // Informações gerais
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  for (const info of options.content) {
    doc.text(`${info.label}: ${info.value}`, 15, yPosition);
    yPosition += 7;
  }

  yPosition += 5;

  // Tabela de itens
  if (options.items && options.items.length > 0) {
    doc.setFont(undefined, 'bold');
    doc.text('Descrição', 15, yPosition);
    doc.text('Qtd', 100, yPosition);
    doc.text('Valor Unit.', 130, yPosition);
    doc.text('Total', 170, yPosition);
    
    yPosition += 7;
    doc.setDrawColor(200);
    doc.line(15, yPosition - 2, pageWidth - 15, yPosition - 2);
    
    doc.setFont(undefined, 'normal');
    
    for (const item of options.items) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(item.descricao.substring(0, 40), 15, yPosition);
      doc.text(item.quantidade.toString(), 100, yPosition);
      doc.text(`R$ ${item.valorUnitario.toFixed(2)}`, 130, yPosition);
      doc.text(`R$ ${item.valorTotal.toFixed(2)}`, 170, yPosition);
      yPosition += 7;
    }

    // Linha de separação
    yPosition += 3;
    doc.setDrawColor(200);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    
    // Total
    yPosition += 7;
    doc.setFont(undefined, 'bold');
    const totalValue = options.items.reduce((sum, item) => sum + item.valorTotal, 0);
    doc.text(`TOTAL: R$ ${totalValue.toFixed(2)}`, 170, yPosition, { align: 'right' });
  }

  // Rodapé
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 15, pageHeight - 10);

  const pdfBlob = doc.output('blob') as Blob;
  return pdfBlob;
}
