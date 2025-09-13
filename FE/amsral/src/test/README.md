# Testing Guide

This directory contains comprehensive unit tests for the AMSRAL application.

## Test Structure

```
src/test/
├── setup.ts                 # Test setup and global mocks
├── utils.tsx                # Test utilities and custom render
├── mocks.ts                 # Mock implementations
├── components/              # Component tests
│   └── PrimaryButton.test.tsx
├── pages/                   # Page component tests
│   ├── ProfilePage.test.tsx
│   └── LoginPage.test.tsx
├── context/                 # Context tests
│   └── AuthContext.test.tsx
├── services/                # Service tests
│   └── userService.test.ts
└── utils/                   # Utility function tests
    ├── roleUtils.test.ts
    └── pdfUtils.test.ts
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### 1. Utility Functions

- **roleUtils.test.ts**: Tests for role-based permissions
- **pdfUtils.test.ts**: Tests for PDF generation functions

### 2. Services

- **userService.test.ts**: Tests for user API operations

### 3. React Components

- **PrimaryButton.test.tsx**: Tests for button component
- **ProfilePage.test.tsx**: Tests for profile management
- **LoginPage.test.tsx**: Tests for authentication flow

### 4. Context

- **AuthContext.test.tsx**: Tests for authentication state management

## Test Features

### Mocking

- API calls are mocked using MSW (Mock Service Worker)
- React Router is mocked for navigation testing
- Local storage and session storage are mocked
- External libraries (jsPDF, toast) are mocked

### Custom Render

- Custom render function includes all necessary providers
- Theme provider for Material-UI components
- Router context for navigation testing
- Auth context for authentication testing

### Test Data

- Mock user data for different roles (admin, manager, user)
- Mock API responses for success and error cases
- Consistent test data across all test files

## Coverage

The test suite aims for comprehensive coverage of:

- ✅ Utility functions (100%)
- ✅ Service functions (100%)
- ✅ React components (90%+)
- ✅ Context providers (100%)
- ✅ Error handling (100%)

## Best Practices

1. **Arrange-Act-Assert**: Each test follows the AAA pattern
2. **Descriptive Names**: Test names clearly describe what is being tested
3. **Isolation**: Each test is independent and doesn't affect others
4. **Mocking**: External dependencies are properly mocked
5. **Cleanup**: Tests clean up after themselves
6. **Error Cases**: Both success and error scenarios are tested

## Adding New Tests

When adding new components or features:

1. Create test file in appropriate directory
2. Follow existing naming convention: `ComponentName.test.tsx`
3. Import necessary testing utilities
4. Mock external dependencies
5. Write comprehensive test cases
6. Update this README if needed
