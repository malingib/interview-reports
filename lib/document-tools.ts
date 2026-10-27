import mammoth from 'mammoth';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { jsPDF } from 'jspdf';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 200_000;

export async function extractFileText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('The file exceeds the 10 MB import limit.');
  const name = file.name.toLowerCase();
  let text = '';

  if (/\.(txt|md|csv)$/i.test(name) || ['text/plain', 'text/csv', 'text/markdown'].includes(file.type)) {
    text = await file.text();
  } else if (/\.docx$/i.test(name) || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
    if (pdf.numPages > 200) throw new Error('This PDF has more than 200 pages. Split it into smaller files.');
    const pages: string[] = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => 'str' in item ? item.str : '').join(' '));
      if (pages.join('\n').length > MAX_EXTRACTED_CHARS) throw new Error('Extracted text exceeds the 200,000-character limit.');
    }
    text = pages.join('\n\n');
  } else {
    throw new Error('Supported formats are TXT, Markdown, CSV, DOCX, and text-based PDF.');
  }

  text = text.trim();
  if (!text) throw new Error('No readable text was found. Scanned PDFs and image-only documents are not supported yet.');
  if (text.length > MAX_EXTRACTED_CHARS) throw new Error('Extracted text exceeds the 200,000-character limit.');
  return text;
}

export async function exportDocx(title: string, content: string): Promise<void> {
  const paragraphs = content.split(/\r?\n/).map(line => {
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length === 1 ? HeadingLevel.HEADING_1 : heading[1].length === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      return new Paragraph({ text: heading[2], heading: level, spacing: { after: 160 } });
    }
    return new Paragraph({ text: line.replace(/^[-*]\s+/, '• ') || ' ', spacing: { after: 100 } });
  });
  const document = new Document({ sections: [{ children: [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...paragraphs] }] });
  const blob = await Packer.toBlob(document);
  downloadBlob(blob, safeFilename(title) + '.docx');
}

export function exportPdf(title: string, content: string): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const width = 210 - margin * 2;
  let y = 20;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  const titleLines = pdf.splitTextToSize(title, width);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 8 + 7;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/^#{1,6}\s*/, '').replace(/^[-*]\s+/, '• ');
    const isHeading = /^#{1,3}\s/.test(rawLine);
    pdf.setFont('helvetica', isHeading ? 'bold' : 'normal');
    pdf.setFontSize(isHeading ? 13 : 10);
    const wrapped = pdf.splitTextToSize(line || ' ', width);
    const lineHeight = isHeading ? 7 : 5;
    if (y + wrapped.length * lineHeight > 280) { pdf.addPage(); y = 18; }
    pdf.text(wrapped, margin, y);
    y += wrapped.length * lineHeight + (isHeading ? 3 : 1);
  }
  pdf.save(safeFilename(title) + '.pdf');
}

function safeFilename(title: string): string {
  return title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '') || 'interview-report';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
