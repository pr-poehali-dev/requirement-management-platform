import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import {
  TypicalArchitecture,
  TechnicalSolution,
  Technology,
  TechDomain,
  Requirement,
  ARCH_STATUS_CONFIG,
  SOLUTION_STATUS_CONFIG,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '@/types';

export interface ArchExportContext {
  arch: TypicalArchitecture;
  solutions: TechnicalSolution[];
  technologies: Technology[];
  techDomains: TechDomain[];
  requirements: Requirement[];
}

function getArchExportData(ctx: ArchExportContext) {
  const { arch, solutions, technologies, techDomains, requirements } = ctx;
  const domain = techDomains.find(d => d.id === arch.techDomainId);
  const linkedSolutions = solutions.filter(s => arch.solutionIds.includes(s.id));
  const linkedTechIds = [...new Set(linkedSolutions.flatMap(s => s.technologyIds))];
  const linkedTechs = technologies.filter(t => linkedTechIds.includes(t.id));
  const linkedReqIds = [...new Set(linkedTechs.flatMap(t => t.requirementIds))];
  const linkedReqs = requirements.filter(r => linkedReqIds.includes(r.id));
  return { domain, linkedSolutions, linkedTechs, linkedReqs };
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

export function exportArchToPdf(ctx: ArchExportContext) {
  const { arch } = ctx;
  const { domain, linkedSolutions, linkedTechs, linkedReqs } = getArchExportData(ctx);
  const archStatus = ARCH_STATUS_CONFIG[arch.status]?.label ?? arch.status;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  const addPage = () => { doc.addPage(); y = 15; };
  const checkY = (needed: number) => { if (y + needed > 280) addPage(); };

  // Шрифт (jsPDF поддерживает только базовые latin — используем helvetica)
  doc.setFont('helvetica');

  // ── Заголовок ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`ID: ${arch.id}  ·  v${arch.version}  ·  ${arch.updatedAt}`, 14, 12);
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(arch.name, 14, 24);
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Status: ${archStatus}  |  Domain: ${domain?.name ?? '—'}  |  Author: ${arch.author}`, 14, 33);

  y = 48;

  // ── Согласования ──
  const approvals = [];
  if (arch.approvedByIb) approvals.push('IB Approved');
  if (arch.approvedByIt) approvals.push('IT Approved');
  if (approvals.length) {
    doc.setFontSize(8);
    doc.setTextColor(52, 211, 153);
    doc.text(approvals.join('   '), 14, y);
    y += 6;
  }

  // ── Теги ──
  if (arch.tags.length) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Tags: ' + arch.tags.map(t => `#${t}`).join('  '), 14, y);
    y += 8;
  }

  // ── Описание ──
  checkY(20);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const descLines = doc.splitTextToSize(arch.description, pageW - 28);
  checkY(descLines.length * 5 + 4);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 8;

  // ── Технические решения ──
  if (linkedSolutions.length) {
    checkY(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Technical Solutions (${linkedSolutions.length})`, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Name', 'Version', 'Status', 'Owner', 'Author', 'Description']],
      body: linkedSolutions.map(s => [
        s.id,
        s.name,
        s.version,
        SOLUTION_STATUS_CONFIG[s.status]?.label ?? s.status,
        s.owner,
        s.author,
        s.description,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 6: { cellWidth: 60 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Технологии ──
  if (linkedTechs.length) {
    checkY(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Technologies (${linkedTechs.length})`, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Name', 'Version', 'Description', 'Requirements']],
      body: linkedTechs.map(t => [
        t.id,
        t.name,
        t.version,
        t.description,
        t.requirementIds.length.toString(),
      ]),
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 3: { cellWidth: 70 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Требования ──
  if (linkedReqs.length) {
    checkY(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Requirements (${linkedReqs.length})`, 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Title', 'Category', 'Priority', 'Status', 'Author', 'Version']],
      body: linkedReqs.map(r => [
        r.id,
        r.title,
        CATEGORY_CONFIG[r.category]?.label ?? r.category,
        PRIORITY_CONFIG[r.priority]?.label ?? r.priority,
        STATUS_CONFIG[r.status]?.label ?? r.status,
        r.author,
        r.version,
      ]),
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { cellWidth: 50 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Mermaid-схемы (текстом) ──
  if (arch.schemes.length) {
    checkY(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Diagrams (${arch.schemes.length})`, 14, y);
    y += 5;

    arch.schemes.forEach(scheme => {
      checkY(16);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(scheme.name, 14, y);
      y += 4;
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      const schemeLines = doc.splitTextToSize(scheme.content, pageW - 28);
      const needed = schemeLines.length * 4 + 4;
      checkY(needed);
      doc.setFillColor(244, 247, 250);
      doc.roundedRect(13, y - 2, pageW - 26, schemeLines.length * 4 + 3, 1, 1, 'F');
      doc.text(schemeLines, 15, y);
      y += schemeLines.length * 4 + 8;
      doc.setFont('helvetica', 'normal');
    });
  }

  // ── Подвал ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Architecture Template Report · ${arch.id} · v${arch.version}`, 14, 292);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, 292, { align: 'right' });
  }

  doc.save(`${arch.id}_${arch.name.replace(/\s+/g, '_')}.pdf`);
}

// ─── Word Export ─────────────────────────────────────────────────────────────

const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const CELL_BORDERS = { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE };
const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
};

function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, color: '0F172A' })],
    spacing: { before: 240, after: 120 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: '1E293B' })],
    spacing: { before: 300, after: 120 },
  });
}

function bodyText(text: string, opts?: { bold?: boolean; color?: string; size?: number }): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts?.bold, color: opts?.color ?? '334155', size: opts?.size ?? 20 })],
    spacing: { after: 80 },
  });
}

function metaRow(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 20, color: '64748B' }),
      new TextRun({ text: value, size: 20, color: '1E293B' }),
    ],
    spacing: { after: 60 },
  });
}

function makeTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: '1E293B', fill: '1E293B' },
            borders: CELL_BORDERS,
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
              spacing: { before: 60, after: 60 },
            })],
          })
        ),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              shading: ri % 2 === 1
                ? { type: ShadingType.SOLID, color: 'F8FAFC', fill: 'F8FAFC' }
                : { type: ShadingType.CLEAR, color: 'FFFFFF', fill: 'FFFFFF' },
              borders: CELL_BORDERS,
              children: [new Paragraph({
                children: [new TextRun({ text: cell ?? '—', size: 18, color: '334155' })],
                spacing: { before: 60, after: 60 },
              })],
            })
          ),
        })
      ),
    ],
  });
}

function codeBlock(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: 16, color: '475569' })],
    shading: { type: ShadingType.SOLID, color: 'F1F5F9', fill: 'F1F5F9' },
    spacing: { before: 60, after: 60 },
  });
}

export async function exportArchToWord(ctx: ArchExportContext) {
  const { arch } = ctx;
  const { domain, linkedSolutions, linkedTechs, linkedReqs } = getArchExportData(ctx);
  const archStatus = ARCH_STATUS_CONFIG[arch.status]?.label ?? arch.status;

  const children: (Paragraph | Table)[] = [];

  // ── Заголовок ──
  children.push(h1(arch.name));
  children.push(metaRow('ID', arch.id));
  children.push(metaRow('Version', `v${arch.version}`));
  children.push(metaRow('Status', archStatus));
  children.push(metaRow('Tech Domain', domain?.name ?? '—'));
  children.push(metaRow('Author', arch.author));
  children.push(metaRow('Created', arch.createdAt));
  children.push(metaRow('Updated', arch.updatedAt));

  const approvals = [];
  if (arch.approvedByIb) approvals.push('IB');
  if (arch.approvedByIt) approvals.push('IT');
  if (approvals.length) children.push(metaRow('Approvals', approvals.join(', ')));

  if (arch.tags.length) {
    children.push(metaRow('Tags', arch.tags.map(t => `#${t}`).join('  ')));
  }

  // ── Описание ──
  children.push(h2('Description'));
  children.push(bodyText(arch.description));

  // ── Домен ──
  if (domain) {
    children.push(h2('Tech Domain Details'));
    children.push(metaRow('Name', domain.name));
    children.push(metaRow('Version', domain.version));
    children.push(metaRow('Owner', domain.owner));
    children.push(metaRow('Status', domain.status));
    children.push(bodyText(domain.description));
  }

  // ── Технические решения ──
  if (linkedSolutions.length) {
    children.push(h2(`Technical Solutions (${linkedSolutions.length})`));
    children.push(makeTable(
      ['ID', 'Name', 'Version', 'Status', 'Owner', 'Author', 'Tags', 'Description'],
      linkedSolutions.map(s => [
        s.id,
        s.name,
        s.version,
        SOLUTION_STATUS_CONFIG[s.status]?.label ?? s.status,
        s.owner,
        s.author,
        s.tags.join(', '),
        s.description,
      ])
    ));
  }

  // ── Технологии ──
  if (linkedTechs.length) {
    children.push(h2(`Technologies (${linkedTechs.length})`));
    children.push(makeTable(
      ['ID', 'Name', 'Version', 'Description', 'Linked Requirements'],
      linkedTechs.map(t => [
        t.id,
        t.name,
        t.version,
        t.description,
        t.requirementIds.join(', '),
      ])
    ));
  }

  // ── Требования ──
  if (linkedReqs.length) {
    children.push(h2(`Requirements (${linkedReqs.length})`));
    children.push(makeTable(
      ['ID', 'Title', 'Category', 'Priority', 'Status', 'Author', 'Version', 'Description'],
      linkedReqs.map(r => [
        r.id,
        r.title,
        CATEGORY_CONFIG[r.category]?.label ?? r.category,
        PRIORITY_CONFIG[r.priority]?.label ?? r.priority,
        STATUS_CONFIG[r.status]?.label ?? r.status,
        r.author,
        r.version,
        r.description,
      ])
    ));
  }

  // ── Диаграммы ──
  if (arch.schemes.length) {
    children.push(h2(`Diagrams (${arch.schemes.length})`));
    arch.schemes.forEach(scheme => {
      children.push(bodyText(scheme.name, { bold: true, size: 22 }));
      const lines = scheme.content.split('\n');
      lines.forEach(line => children.push(codeBlock(line)));
      children.push(new Paragraph({ spacing: { after: 120 } }));
    });
  }

  // ── Сборка документа ──
  const doc = new Document({
    creator: arch.author,
    title: arch.name,
    description: arch.description,
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${arch.id}_${arch.name.replace(/\s+/g, '_')}.docx`);
}