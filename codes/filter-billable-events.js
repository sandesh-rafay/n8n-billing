const allowedStatuses = ["success", "created", "deleted", "destroyed"];
const validEvents = [];

for (const page of $input.all()) {
  const events = page.json.items || [];
  for (const inst of events) {
    if (allowedStatuses.includes(inst.status)) {
      validEvents.push({ json: inst });
    }
  }
}

if (validEvents.length === 0) {
  validEvents.push({ json: { _noEvents: true } });
}

return validEvents;
