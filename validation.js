export function validate(data) {
  if (!data || !Array.isArray(data.people) || !Array.isArray(data.rows) || data.people.length > 30 || data.rows.length > 300) throw Error('Ungültige Tabelle.');
  const ids = new Set();
  const people = data.people.map(p => {
    if (typeof p.id !== 'string' || !/^[\w-]{1,80}$/.test(p.id) || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60) throw Error('Ungültige Person.');
    ids.add(p.id); return {id:p.id, name:p.name.trim()};
  });
  const rowIds = new Set();
  const rows = data.rows.map(r => {
    if (typeof r.id !== 'string' || !/^[\w-]{1,80}$/.test(r.id) || rowIds.has(r.id) || typeof r.name !== 'string' || !r.name.trim() || r.name.length > 100 || !r.amounts || typeof r.amounts !== 'object' || Array.isArray(r.amounts)) throw Error('Ungültige Kostenart.');
    rowIds.add(r.id);
    const amounts = {};
    for (const [id, value] of Object.entries(r.amounts)) {
      if (!ids.has(id) || !Number.isSafeInteger(value) || value < 0 || value > 100000000) throw Error('Ungültiger Betrag.');
      amounts[id] = value;
    }
    return {id:r.id,name:r.name.trim(),amounts};
  });
  return {people,rows};
}
