# Testing Guide for Marketing Calendar SaaS

This document outlines the testing approach for the Marketing Calendar SaaS application, including unit tests, end-to-end tests, and API tests.

## Testing Approach

The application uses a comprehensive testing strategy with multiple layers:

1. **Unit Tests**: Test individual components and functions in isolation
2. **End-to-End Tests**: Test the application as a whole in a browser environment
3. **API Tests**: Test the Supabase API directly

## Prerequisites

Before running the tests, make sure you have the following installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- A Supabase project with the correct schema

## Setting Up the Testing Environment

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Running Unit Tests

Unit tests are implemented using Jest and React Testing Library. They test individual components and functions in isolation.

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage report
npm run test:coverage
```

### Key Unit Tests

- `CreateBrief.test.tsx`: Tests the brief creation and editing functionality
- `CalendarView.test.tsx`: Tests the calendar view component
- `api.test.ts`: Tests the API functions

## Running End-to-End Tests

End-to-end tests are implemented using Playwright. They test the application as a whole in a browser environment.

```bash
# Install Playwright browsers
npx playwright install

# Run all end-to-end tests
npm run test:e2e

# Run end-to-end tests with UI
npm run test:e2e:ui
```

### Key End-to-End Tests

- `brief-editing.spec.ts`: Tests the brief editing workflow
- `calendar-view.spec.ts`: Tests the calendar view functionality

## Running API Tests

API tests directly test the Supabase API without going through the UI.

```bash
# Run API tests
npm test -- src/tests/supabase-api.test.ts
```

## Continuous Integration

The tests are configured to run in a CI environment. The following environment variables should be set in your CI system:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Test Coverage

The unit tests generate a coverage report that shows how much of the codebase is covered by tests. You can view the coverage report by running:

```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage` directory.

## Troubleshooting

### Common Issues

1. **Tests fail with authentication errors**:
   - Make sure your Supabase credentials are correct in the `.env` file
   - Check that your service role key has the necessary permissions

2. **End-to-end tests fail**:
   - Make sure the application is running (`npm run dev`)
   - Check that the test user credentials are correct

3. **Unit tests fail with module not found errors**:
   - Make sure all dependencies are installed (`npm install`)
   - Check that the import paths are correct

## Adding New Tests

### Adding Unit Tests

1. Create a new test file in the `src/tests` directory
2. Import the component or function you want to test
3. Write your tests using Jest and React Testing Library

### Adding End-to-End Tests

1. Create a new test file in the `e2e` directory
2. Import the Playwright test utilities
3. Write your tests using Playwright's API

## Best Practices

1. **Test one thing at a time**: Each test should focus on testing one specific behavior
2. **Use descriptive test names**: Test names should clearly describe what is being tested
3. **Avoid testing implementation details**: Test the behavior, not the implementation
4. **Keep tests independent**: Tests should not depend on the state from other tests
5. **Mock external dependencies**: Use mocks for external services like Supabase 