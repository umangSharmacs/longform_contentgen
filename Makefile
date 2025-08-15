# Makefile for NeedleSpotter LongformGen Plugin

# Default values
VERSION ?= 1.0.0
PLUGIN_DIR = needlespotter-longformgen
FRONTEND_DIR = frontend
BUILD_DIR = $(FRONTEND_DIR)/dist
PLUGIN_FILE = $(PLUGIN_DIR)/needlespotter-longformgen.php

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help build-frontend copy-frontend update-version deploy-full clean

# Default target
help:
	@echo "$(GREEN)NeedleSpotter LongformGen Plugin Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "  make build-frontend     - Build the React frontend"
	@echo "  make copy-frontend      - Copy built frontend to plugin directory"
	@echo "  make update-version     - Update plugin version number"
	@echo "  make deploy-full        - Full deployment (build + copy + version update)"
	@echo "  make clean              - Clean build files"
	@echo ""
	@echo "$(YELLOW)Usage:$(NC)"
	@echo "  make deploy-full VERSION=1.0.1"

# Build the React frontend
build-frontend:
	@echo "$(GREEN)Building frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)Frontend built successfully!$(NC)"

# Copy built frontend files to plugin directory
copy-frontend:
	@echo "$(GREEN)Copying frontend files to plugin...$(NC)"
	@rm -rf $(PLUGIN_DIR)/assets
	@mkdir -p $(PLUGIN_DIR)/assets
	@cp -r $(BUILD_DIR)/* $(PLUGIN_DIR)/assets/
	@echo "$(GREEN)Frontend files copied to $(PLUGIN_DIR)/assets/$(NC)"

# Update version number in plugin file
update-version:
	@echo "$(GREEN)Updating plugin version to $(VERSION)...$(NC)"
	@sed -i.bak 's/^ \* Version: .*/ * Version: $(VERSION)/' $(PLUGIN_FILE)
	@sed -i.bak 's/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $(VERSION)/' $(PLUGIN_FILE)
	@rm -f $(PLUGIN_FILE).bak
	@echo "$(GREEN)Version updated to $(VERSION)$(NC)"

# Full deployment process
deploy-full: build-frontend copy-frontend update-version
	@echo "$(GREEN)Creating deployment package...$(NC)"
	@zip -r needlespotter-longformgen.zip $(PLUGIN_DIR)/
	@echo "$(GREEN)Deployment completed successfully!$(NC)"
	@echo "$(YELLOW)Plugin version: $(VERSION)$(NC)"
	@echo "$(YELLOW)Frontend built and copied to plugin directory$(NC)"
	@echo "$(YELLOW)Package created: needlespotter-longformgen.zip$(NC)"

# Clean build files
clean:
	@echo "$(YELLOW)Cleaning build files...$(NC)"
	@rm -rf $(BUILD_DIR)
	@rm -rf $(PLUGIN_DIR)/assets
	@echo "$(GREEN)Clean completed!$(NC)"

# Check if required files exist
check-prerequisites:
	@if [ ! -f "$(PLUGIN_FILE)" ]; then \
		echo "$(RED)Error: Plugin file not found at $(PLUGIN_FILE)$(NC)"; \
		exit 1; \
	fi
	@if [ ! -d "$(FRONTEND_DIR)" ]; then \
		echo "$(RED)Error: Frontend directory not found at $(FRONTEND_DIR)$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(FRONTEND_DIR)/package.json" ]; then \
		echo "$(RED)Error: Frontend package.json not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Prerequisites check passed!$(NC)"

# Install frontend dependencies (optional)
install-frontend:
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)Frontend dependencies installed!$(NC)"

# Create deployment package
package: deploy-full
	@echo "$(GREEN)Creating deployment package...$(NC)"
	@zip -r needlespotter-longformgen.zip $(PLUGIN_DIR)/
	@echo "$(GREEN)Package created: needlespotter-longformgen.zip$(NC)"
