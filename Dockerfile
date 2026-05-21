FROM node:18-alpine AS builder
WORKDIR /app
COPY codes/ ./codes/
COPY templates/ ./templates/
COPY build-workflow.js .
RUN node build-workflow.js

FROM n8nio/n8n:latest
COPY --from=builder /app/post-events-workflow.json /home/node/workflows/post-events-workflow.json
