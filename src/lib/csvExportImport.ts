// CSV / JSON Export and Import Helpers

export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string, headers?: { key: keyof T; label: string }[]) {
  if (!data || data.length === 0) {
    alert('No records available to export.');
    return;
  }

  const keys = headers ? headers.map(h => h.key) : (Object.keys(data[0]) as (keyof T)[]);
  const headerLabels = headers ? headers.map(h => h.label) : (keys as string[]);

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const csvRows = [
    headerLabels.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...data.map(row => keys.map(k => escapeCSV(row[k])).join(','))
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: any, filename: string) {
  if (!data) {
    alert('No records available to export.');
    return;
  }
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const link = document.createElement('a');
  link.setAttribute('href', jsonString);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Helper to parse CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]);
  const cleanHeaders = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const row: Record<string, string> = {};
    cleanHeaders.forEach((header, idx) => {
      let val = values[idx] || '';
      val = val.replace(/^["']|["']$/g, '').trim();
      row[header] = val;
    });
    results.push(row);
  }

  return results;
}
