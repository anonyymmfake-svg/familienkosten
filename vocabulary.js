export function validateVocabulary(input) {
  if (!Array.isArray(input.words) || input.words.length > 10000) throw Error('Ungültige Vokabelliste (maximal 10.000 Einträge).');
  const ids = new Set();
  const words = input.words.map(word => {
    if (!word || typeof word.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(word.id) || ids.has(word.id)) throw Error('Ungültige Vokabel-ID.');
    ids.add(word.id);
    const result = {id: word.id};
    for (const field of ['de', 'en', 'group']) {
      if (typeof word[field] !== 'string' || word[field].length > 300 || (field !== 'group' && !word[field].trim())) throw Error('Ungültiger Vokabeleintrag.');
      result[field] = word[field].trim();
    }
    return result;
  });
  return {words};
}
