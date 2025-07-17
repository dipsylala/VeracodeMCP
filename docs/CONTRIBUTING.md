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

1. **Build and type check**: `npm run build`
2. **Check linting**: `npx tsc --noEmit` (checks types without compilation)
3. **Test with real Veracode API**: `npm run test-connection`
4. **Test the generic client**: `npm run client get-applications`
5. **Verify no ESLint issues**: Check for unused variables, type safety violations

## 📝 Code Style

We follow strict TypeScript and ESLint guidelines to maintain code quality and consistency.

### TypeScript Guidelines

- Use TypeScript for all new code
- Prefer explicit types over `any` - use proper interfaces and types
- Use `z.void()` for tools that don't require parameters instead of optional schemas
- Extract Zod schemas to explicit variables with TypeScript types:
  ```typescript
  const GetApplicationsSchema = z.object({
    name: z.string().describe('Application name')
  });
  
  type GetApplicationsArgs = z.infer<typeof GetApplicationsSchema>;
  ```
- Handle errors gracefully with proper error types
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### ESLint Rules

We use `@typescript-eslint` with strict rules. Common patterns:

- **Unused variables**: Prefix with underscore (`_error`, `_extra`) for intentionally unused parameters
- **Disable specific rules** when necessary:
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
  ```
- **Multiple rule disables**:
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  ```

### Checking Code Quality

Run these commands before submitting:

```bash
# Build and check TypeScript compilation
npm run build

# Run linting
npm run lint

# Check for unused variables and type issues
npx tsc --noEmit
```

### Architecture Guidelines

- **Services**: Expect GUIDs only, don't handle name resolution
- **Tools**: Handle user input and application resolution using `application-resolver.ts`
- **Schemas**: Always mandatory, use explicit variable declarations
- **Error handling**: Consistent error response format across all tools

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
