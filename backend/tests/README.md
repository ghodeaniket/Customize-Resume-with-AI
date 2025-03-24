# Resume Customizer Test Suite

This directory contains a comprehensive test suite for the Resume Customizer application.

## Overview

The test suite is structured into three main categories:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete workflows

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   └── resumeCustomization.test.js
├── fixtures/               # Test data files
├── integration/            # Integration tests
│   └── routes/             # API route tests
│       └── resume.test.js
└── unit/                   # Unit tests
    ├── utils/              # Utility function tests
    │   ├── AIService.test.js
    │   ├── jobScraper.test.js
    │   └── resumeParser.test.js
    └── workers/            # Worker process tests
        └── resumeProcessor.test.js
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### End-to-End Tests Only

```bash
npm run test:e2e
```

## Test Coverage

To generate a test coverage report:

```bash
npx nyc npm test
```

The coverage report will be available in the `coverage` directory.

## Testing Approach

### Unit Tests

Unit tests focus on testing individual functions and classes in isolation. Dependencies are mocked or stubbed to ensure that only the unit under test is being evaluated. Key areas covered include:

- Resume parsing (PDF, DOCX, HTML, JSON)
- Job description scraping and extraction
- AI service interactions
- Validation and error handling

### Integration Tests

Integration tests verify that different components work together correctly. They focus on:

- API endpoints and request validation
- Database interactions
- Worker queue integration

### End-to-End Tests

End-to-end tests simulate real user workflows to ensure the entire system functions as expected. These tests cover:

- Complete resume customization flow
- Error cases and recovery
- Performance under normal conditions

## Mocking Strategy

The tests use [Sinon.js](https://sinonjs.org/) for mocking and stubbing:

- External APIs like OpenRouter are mocked to avoid actual API calls
- Database operations are stubbed to control test data
- File system operations use fixture data

## Test Dependencies

- **Mocha**: Test framework
- **Chai**: Assertion library
- **Sinon**: Mocking library
- **Supertest**: HTTP testing
- **NYC**: Code coverage

## Adding New Tests

When adding new functionality to the application, please follow these guidelines:

1. Add unit tests for any new utility functions or classes
2. Add integration tests for new API endpoints
3. Update end-to-end tests if the workflow changes
4. Aim for at least 80% code coverage

## Continuous Integration

Tests are automatically run on each pull request through GitHub Actions. PRs cannot be merged unless all tests pass.
