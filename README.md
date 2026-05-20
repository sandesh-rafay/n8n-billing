# n8n Billing Workflow — Separate Workflow Files

The JavaScript code for each n8n Code node is kept in separate `.js` files under `codes/`. A build script injects them into a workflow template at Docker build time, producing the final workflow JSON inside the image. No manual JSON editing required.

---

## Directory Structure

```
n8n-separate-workflow-files/
├── codes/
│   ├── calculate-time-window.js     ← JS for Calculate Time Window node
│   ├── filter-billable-events.js    ← JS for Filter Billable Events node
│   └── forward-events.js            ← JS for Forward Events node
├── workflow-template.json           ← workflow with __PLACEHOLDER__ where JS goes
├── build-workflow.js                ← injects JS files into template
├── Dockerfile                       ← multi-stage: builds JSON then packages into n8n image
├── n8n-secret.yaml                  ← encryption key + DB password
└── n8n-deployment.yaml              ← Kubernetes Deployment + Service
```

---

## How It Works

```
codes/*.js  +  workflow-template.json
                    ↓
            node build-workflow.js
                    ↓
        post-events-workflow.json (generated)
                    ↓
        baked into n8n Docker image
                    ↓
    workflow-importer imports into PostgreSQL
```

The `Dockerfile` is multi-stage:
- **Stage 1** (node:18-alpine) — runs `build-workflow.js`, generates `post-events-workflow.json`
- **Stage 2** (n8nio/n8n:latest) — copies only the generated JSON into the final image

---

## Adding or Editing Code

To update a Code node:
1. Edit the relevant file in `codes/`
2. Build and push a new image (see below)
3. Redeploy

To add a new Code node:
1. Add a new `.js` file in `codes/` e.g. `codes/my-new-node.js`
2. Add the node to `workflow-template.json` with `"jsCode": "__MY_NEW_NODE__"`
3. Build and push

The placeholder format is `__FILENAME_IN_UPPER_SNAKE_CASE__` which maps to `codes/filename-in-kebab-case.js`.

---

## Local Development

**Test the build script:**
```bash
node build-workflow.js
# outputs: post-events-workflow.json
```

**Build the Docker image locally:**
```bash
docker build -t registry.dev.rafay-edge.net/rafay/push-events-n8n:1.0 .
```

---

## Deploy

**1. Update the secret:**

Edit `n8n-secret.yaml`:
```yaml
stringData:
  N8N_ENCRYPTION_KEY: "<generate with: openssl rand -hex 32>"
  DB_POSTGRESDB_PASSWORD: "<your postgres password>"
```

**2. Build and push the image:**
```bash
docker build -t registry.dev.rafay-edge.net/rafay/push-events-n8n:1.0 .
docker push registry.dev.rafay-edge.net/rafay/push-events-n8n:1.0
```

**3. Apply to Kubernetes:**
```bash
kubectl apply -f n8n-secret.yaml
kubectl apply -f n8n-deployment.yaml
```

---

## First-time Configuration

Once the pod is running, open n8n in your browser:
```
http://<node-ip>:30678
```

1. Sign up to create your account
2. Open the **Post Events** workflow
3. Click the **Pull Compute Instance Events** node
4. Set your **Controller URL** and add an **HTTP Header Auth** credential with your API key (`X-API-KEY`)
5. Save and activate the workflow

---

## Clean Up

```bash
kubectl exec -n rafay-core <postgres-pod> -- psql -U postgres -c "DROP DATABASE IF EXISTS n8n;"
kubectl delete -f n8n-deployment.yaml
kubectl delete -f n8n-secret.yaml
```
# n8n-billing
