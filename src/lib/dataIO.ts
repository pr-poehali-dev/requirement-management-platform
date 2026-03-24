import {
  Requirement, Technology, OrgDomain, TechDomain,
  TechnicalSolution, TypicalArchitecture,
} from '@/types';

export interface AppData {
  requirements: Requirement[];
  technologies: Technology[];
  domains: OrgDomain[];
  techDomains: TechDomain[];
  solutions: TechnicalSolution[];
  architectures: TypicalArchitecture[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function arrayToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

function csvToArray(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { values.push(cur); cur = ''; }
      else cur += ch;
    }
    values.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]));
  });
}

// Flatten arrays/objects to string for CSV, restore from string on import
function flattenForCsv(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v) && v.every(x => typeof x === 'string')) result[k] = v.join('; ');
    else if (Array.isArray(v) || (typeof v === 'object' && v !== null)) result[k] = JSON.stringify(v);
    else result[k] = v;
  }
  return result;
}

// ── JSON Export ────────────────────────────────────────────────────────────────

export function exportAllJson(data: AppData) {
  downloadFile(JSON.stringify(data, null, 2), 'reqflow-export.json', 'application/json');
}

export function exportSectionJson(name: string, rows: unknown[]) {
  downloadFile(JSON.stringify(rows, null, 2), `reqflow-${name}.json`, 'application/json');
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

export function exportSectionCsv(name: string, rows: Record<string, unknown>[]) {
  const flat = rows.map(r => flattenForCsv(r));
  downloadFile(arrayToCsv(flat), `reqflow-${name}.csv`, 'text/csv;charset=utf-8;');
}

// ── JSON Import ────────────────────────────────────────────────────────────────

export function importJson(file: File): Promise<Partial<AppData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try { resolve(JSON.parse(e.target?.result as string)); }
      catch { reject(new Error('Некорректный JSON файл')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

// ── CSV Import ─────────────────────────────────────────────────────────────────

function restoreRow(row: Record<string, string>, arrayFields: string[], jsonFields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };
  for (const f of arrayFields) {
    if (row[f] !== undefined) result[f] = row[f] ? row[f].split(';').map(s => s.trim()).filter(Boolean) : [];
  }
  for (const f of jsonFields) {
    if (row[f]) { try { result[f] = JSON.parse(row[f]); } catch { result[f] = []; } }
  }
  return result;
}

export function importCsvRequirements(file: File): Promise<Requirement[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = csvToArray(e.target?.result as string);
        resolve(rows.map(r => restoreRow(r, ['tags', 'environments', 'appStages'], ['attachments'])) as unknown as Requirement[]);
      } catch { reject(new Error('Ошибка разбора CSV')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

export function importCsvTechnologies(file: File): Promise<Technology[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = csvToArray(e.target?.result as string);
        resolve(rows.map(r => restoreRow(r, ['requirementIds'], ['schemes'])) as unknown as Technology[]);
      } catch { reject(new Error('Ошибка разбора CSV')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

export function importCsvDomains(file: File): Promise<OrgDomain[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try { resolve(csvToArray(e.target?.result as string) as unknown as OrgDomain[]); }
      catch { reject(new Error('Ошибка разбора CSV')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

export function importCsvTechDomains(file: File): Promise<TechDomain[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = csvToArray(e.target?.result as string);
        resolve(rows.map(r => restoreRow(r, ['orgDomainIds', 'technologyIds'], [])) as unknown as TechDomain[]);
      } catch { reject(new Error('Ошибка разбора CSV')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

export function importCsvSolutions(file: File): Promise<TechnicalSolution[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = csvToArray(e.target?.result as string);
        resolve(rows.map(r => restoreRow(r, ['tags', 'technologyIds'], [])) as unknown as TechnicalSolution[]);
      } catch { reject(new Error('Ошибка разбора CSV')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}

export function importCsvArchitectures(file: File): Promise<TypicalArchitecture[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = csvToArray(e.target?.result as string);
        resolve(rows.map(r => {
          const restored = restoreRow(r, ['tags', 'solutionIds'], ['schemes']);
          restored.approvedByIb = r.approvedByIb === 'true';
          restored.approvedByIt = r.approvedByIt === 'true';
          return restored;
        }) as unknown as TypicalArchitecture[]);
      } catch { reject(new Error('Ошибка разбора CSV')); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}
