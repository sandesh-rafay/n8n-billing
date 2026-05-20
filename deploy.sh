#!/bin/bash

NAMESPACE=rafay-core

kubectl apply -f n8n-config.yaml
kubectl apply -f n8n-secret.yaml
kubectl apply -f n8n-service.yaml
kubectl apply -f n8n-deployment.yaml

kubectl rollout status deployment n8n -n $NAMESPACE
