.DEFAULT_GOAL := help

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: ## Install dependencies + git hooks
	pnpm install

dev: ## Run the demo viewer in dev mode
	pnpm --filter @orbidicom/demo dev

test: ## Run all tests
	pnpm test

build: ## Build all publishable packages
	pnpm build

demo: ## Serve the built demo viewer (what `npx orbidicom` runs)
	pnpm --filter orbidicom exec orbidicom

docs: ## Serve the docs site
	pnpm --filter @orbidicom/docs dev

lint: ## Lint + format-check
	pnpm lint

ai: ## Launch the optional LLM-assisted setup assistant
	pnpm --filter orbidicom exec orbidicom ai

new-tool new-adapter new-theme new-locale: ## Scaffold a new tool/adapter/theme/locale via the CLI generators
	pnpm --filter orbidicom exec orbidicom generate $(subst new-,,$@)

.PHONY: help setup dev test build demo docs lint ai new-tool new-adapter new-theme new-locale
