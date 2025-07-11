# Contributing to Veracode MCP Server

Thank you for your interest in contributing to the Veracode MCP Server! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/VeracodeMCP.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## 🔧 Development Setup

1. Copy the environment file: `cp .env.example .env`
2. Add your Veracode API credentials to `.env`
3. Build the project: `npm run build`
4. Test the connection: `npm run validate`

## 🧪 Testing

Before submitting changes:

1. Ensure the project builds: `npm run build`
2. Test with real Veracode API: `npm run test-connection`
3. Test the generic client: `npm run client get-applications`

## 📝 Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public functions
- Use meaningful variable and function names
- Handle errors gracefully

## 🐛 Bug Reports

When reporting bugs, please include:

- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## ✨ Feature Requests

For new features:

- Describe the use case
- Explain why it would be valuable
- Consider backward compatibility
- Suggest implementation approach if possible

## 🔒 Security

- Never commit API credentials
- Report security issues privately
- Follow Veracode API best practices
- Be mindful of rate limiting

## 📋 Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all checks pass
4. Update the README if needed
5. Request review from maintainers

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
