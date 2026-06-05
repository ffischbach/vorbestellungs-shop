TERRAFORM_DIR := ../terraform
SERVER_IP     := $(shell cd $(TERRAFORM_DIR) && terraform output -raw server_ip 2>/dev/null)

.PHONY: setup deploy

# Erstinstallation: OS härten, Docker, App deployen
setup:
	SHOP_SERVER_IP=$(SERVER_IP) ansible-playbook playbooks/setup.yml --ask-vault-pass

# Config-Update: Env, Caddy, docker-compose.yml deployen
deploy:
	SHOP_SERVER_IP=$(SERVER_IP) ansible-playbook playbooks/deploy.yml --ask-vault-pass
