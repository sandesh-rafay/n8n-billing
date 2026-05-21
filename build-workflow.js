const fs = require('fs');
const path = require('path');

const template = JSON.parse(fs.readFileSync('templates/workflow-template.json', 'utf8'));

template.nodes.forEach(node => {
  const code = node.parameters?.jsCode;
  if (code && code.startsWith('__') && code.endsWith('__')) {
    const placeholder = code.slice(2, -2);
    const filename = placeholder.toLowerCase().replace(/_/g, '-') + '.js';
    const filepath = path.join('codes', filename);

    if (!fs.existsSync(filepath)) {
      console.error(`Error: ${filepath} not found for placeholder ${code}`);
      process.exit(1);
    }

    node.parameters.jsCode = fs.readFileSync(filepath, 'utf8');
    console.log(`Injected ${filepath} → node "${node.name}"`);
  }
});

fs.writeFileSync('post-events-workflow.json', JSON.stringify(template, null, 2));
console.log('Generated post-events-workflow.json successfully.');
