TS         := $(shell /bin/date "+%Y%m%d%H%M%S")
REGISTRY   := registry.dev.rafay-edge.net/rafay
IMAGE      := push-events-n8n
IMAGE_NAME := $(REGISTRY)/$(IMAGE):$(TS)
NAMESPACE  := rafay-core

.PHONY: all build deploy clean

all: build deploy

build:
	docker build -t $(IMAGE_NAME) .
	docker push $(IMAGE_NAME)
	@echo "Built and pushed: $(IMAGE_NAME)"

deploy:
	kubectl apply -f n8n-config.yaml
	kubectl apply -f n8n-secret.yaml
	kubectl apply -f n8n-service.yaml
	kubectl apply -f n8n-deployment.yaml
	kubectl rollout status deployment/n8n -n $(NAMESPACE)

clean:
	@echo "Cleaning up local Docker images"
	docker rmi $(IMAGE_NAME) || true
