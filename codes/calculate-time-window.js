const items = $input.all();
let range_from = "2025-01-20T01:00:00.000Z";
try {
  const val = items[0]?.json?.value;
  if (val && /^\d{4}/.test(val)) range_from = val;
} catch(e) {}
const range_to = new Date().toISOString();
return { range_from, range_to };
