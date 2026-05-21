# n8n Billing Workflow — Separate Workflow Files

Each n8n Code node is kept as a separate `.js` file under `codes/`. The Dockerfile injects them into the workflow template at build time, producing the final workflow JSON inside the image.

---

## Directory Structure

```
n8n-separate-workflow-files/
├── codes/
│   ├── calculate-time-window.js     ← JS for Calculate Time Window node
│   ├── filter-billable-events.js    ← JS for Filter Billable Events node
│   └── forward-events.js            ← JS for Forward Events node
├── templates/
│   └── workflow-template.json       ← workflow with __PLACEHOLDER__ where JS goes
├── build-workflow.js                ← injects JS files into template (runs inside Docker)
├── Dockerfile                       ← multi-stage: builds workflow JSON, packages into n8n image
├── n8n-config.yaml                  ← non-sensitive config (postgres host, port, user, db)
├── n8n-secret.yaml                  ← N8N_ENCRYPTION_KEY only
├── n8n-service.yaml                 ← Kubernetes NodePort service
├── n8n-deployment.yaml              ← Kubernetes Deployment (uses :latest image tag)
├── Makefile                         ← build and deploy commands
├── deploy.sh                        ← applies all yaml files in order
└── clean.sh                         ← full teardown including postgres cleanup
```

---

## How It Works

```
codes/*.js  +  templates/workflow-template.json
                    ↓  (inside Docker multi-stage build)
            node build-workflow.js
                    ↓
        post-events-workflow.json (generated inside image)
                    ↓
        baked into n8n Docker image (:timestamp tag)
                    ↓
    approved → pipeline tags as :latest
                    ↓
    Kubernetes deployment pulls :latest
```

---

## Config and Secrets

| Value | Source | File |
|---|---|---|
| Postgres host, port, user, database | `n8n-config` ConfigMap | `n8n-config.yaml` |
| n8n encryption key | `n8n-secret` Secret | `n8n-secret.yaml` |
| Postgres password | `pg-secrets` (existing cluster secret) | not duplicated here |

The postgres password is read directly from the cluster's existing `pg-secrets` secret (key: `pg.password`). It does not need to be set in `n8n-secret.yaml`.

---

## Modifying Workflow Code

1. Edit the relevant file in `codes/`
2. Build and push a new image:
   ```bash
   make build
   ```
3. Once approved, have the pipeline tag the timestamped image as `latest`
4. Deploy:
   ```bash
   make deploy
   ```

To add a new Code node:
1. Add `codes/my-new-node.js`
2. Add the node to `templates/workflow-template.json` with `"jsCode": "__MY_NEW_NODE__"`
3. Run `make build`

---

## Image Tagging Flow

`make build` always pushes a timestamped image (e.g. `:20260520123456`). The deployment YAML uses `:latest`. Promotion to `latest` is a deliberate pipeline step after review:

```
make build  →  :20260520123456  →  review/approval  →  pipeline tags :latest  →  make deploy
```

This ensures you can always trace which exact build is running in the cluster.

---

## Deploy

```bash
make deploy
# or
./deploy.sh
```

This applies in order: `n8n-config.yaml` → `n8n-secret.yaml` → `n8n-service.yaml` → `n8n-deployment.yaml`, then waits for rollout to complete.

**First-time only** — after the pod is running, open n8n in your browser:
```
http://<node-ip>:30678
```
Sign up to create your account. The **Post Events** workflow is already imported and active.

---

## Updating Config (no rebuild needed)

If postgres host, port, user, or n8n settings change:
```bash
# Edit n8n-config.yaml, then:
kubectl apply -f n8n-config.yaml
kubectl rollout restart deployment n8n -n rafay-core
```

---

## Clean Up

```bash
./clean.sh
```

Deletes the deployment, service, secret, and configmap, then drops the `n8n` database and clears the `previous_run` timestamp from `n8n_billing_state`.
