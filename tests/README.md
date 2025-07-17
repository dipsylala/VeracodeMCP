# Testing Suite

This directory contains the automated testing suite for the Veracode MCP Server.

## Directory Structure

- **integration/**: Integration tests with live API calls
  - **mcp/**: Tests via MCP protocol
  - **api/**: Direct API integration tests
- **unit/**: Unit tests with mocked dependencies

## Running Tests

`ash
# Run all integration tests (requires Veracode credentials)
npm run test:integration

# Run unit tests
npm run test:unit

# Run specific test category
node tests/integration/mcp/list-applications-mcp.js
`

## Test Categories

- **Integration Tests**: Test real functionality with live API calls
- **Unit Tests**: Test specific components with mocked dependencies
