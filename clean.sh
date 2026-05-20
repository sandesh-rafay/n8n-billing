#!/bin/bash

NAMESPACE=rafay-core
POSTGRES_POD=$(kubectl get pod -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')

kubectl delete deployment n8n -n $NAMESPACE
kubectl delete service n8n -n $NAMESPACE
kubectl delete secret n8n-secret -n $NAMESPACE
kubectl delete configmap n8n-config -n $NAMESPACE --ignore-not-found

kubectl exec -it -n $NAMESPACE $POSTGRES_POD -- psql -U postgres -c "DROP DATABASE IF EXISTS n8n;"
kubectl exec -it -n $NAMESPACE $POSTGRES_POD -- psql -U postgres -c "DELETE FROM n8n_billing_state WHERE key = 'previous_run';"
