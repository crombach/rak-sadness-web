.DEFAULT_GOAL := help
.PHONY: help setup build run test check lint typecheck format

# Override to run a second dev server alongside the first, e.g. make run PORT=3001
PORT ?= 3000

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "%-12s %s\n", $$1, $$2}'

setup: ## Install dependencies from the lockfile (idempotent)
	@command -v node >/dev/null || { echo "Missing node. Install $$(cat .nvmrc): brew install node@20"; exit 1; }
	@req=$$(sed 's/^v//' .nvmrc | cut -d. -f1); cur=$$(node -v | sed 's/^v//' | cut -d. -f1); \
	  [ "$$req" = "$$cur" ] || { echo "Node major $$cur found, .nvmrc requires $$req. Run: nvm install && nvm use"; exit 1; }
	npm ci

build: ## Production build into ./build (what pages:deploy uploads)
	npm run build

run: ## Start the CRA dev server (PORT=3000 by default)
	PORT=$(PORT) npm start

test: ## Run the Jest suite once (no watch mode)
	CI=true npm test -- --watchAll=false

check: lint typecheck test ## Lint, typecheck, test, and format-check everything
	npm run prettier

lint: ## ESLint over .ts/.tsx
	npm run lint

typecheck: ## tsc --noEmit for src/ and functions/ separately
	npx tsc --noEmit
	npx tsc --noEmit -p functions/tsconfig.json

format: ## Apply eslint --fix, then prettier (formatter runs last, so it wins)
	npm run format
