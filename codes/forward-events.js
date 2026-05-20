const items = $input.all();
const results = [];

for (const item of items) {
  if (item.json._noEvents) continue;
  const event = item.json;
  let status = 0;
  let body = {};

  try {
    const result = await helpers.httpRequest({
      method: 'POST',
      url: 'http://localhost:5678/webhook/process-event',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      returnFullResponse: true,
      ignoreHttpStatusErrors: true
    });
    status = result.statusCode || 0;
    let rb = result.body;
    if (typeof rb === 'string') {
      try { rb = JSON.parse(rb); } catch(_) { rb = { raw: rb }; }
    }
    body = (rb && typeof rb === 'object' && !Array.isArray(rb)) ? rb : { data: rb };
  } catch(e) {
    status = 500;
    body = { error: e.message };
  }

  results.push({ json: { status, response: body } });
}

if (results.length === 0) {
  results.push({ json: { status: 0, response: { message: "No billable events" } } });
}

return results;
