# API Testing Suite (Jest-based)

This directory (`src/__tests__`) contains comprehensive testing scripts for the Federal Deregulation Analysis Tool API endpoints using Jest testing framework.

## Jest Test Files

### Core Test Suites
- `health-check.test.js` - Environment and database connectivity checks
- `api-data.test.js` - Data endpoints (agencies, titles)
- `api-analysis.test.js` - Analysis endpoints (cross-cutting, complexity scores)
- `api-agency.test.js` - Agency-specific analysis endpoints
- `api-performance.test.js` - Performance and load testing
- `api-integration.test.js` - End-to-end workflow testing
- `api-debug.test.js` - Debug endpoints and error handling

### Support Files
- `setup.js` - Jest configuration and global utilities
- `test-utils.js` - Helper functions and test utilities
- `test-config.json` - Test configuration and thresholds

## Quick Start with Jest

```bash
# Install dependencies
npm install

# Start development server (required for tests)
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:api          # All API tests
npm run test:performance  # Performance tests only
npm run test:integration  # Integration tests only
```

## Jest Test Commands

### Basic Testing
```bash
# Run all tests
npm test

# Run tests in watch mode (reruns when files change)
npm run test:watch

# Run with verbose output
npm run test:verbose

# Generate coverage report
npm run test:coverage
```

### Targeted Testing
```bash
# Run only API tests
npm run test:api

# Run only performance tests
npm run test:performance

# Run only integration tests
npm run test:integration

# Run specific test file
npx jest api-data.test.js

# Run tests matching pattern
npx jest --testNamePattern="should return"
```

### Advanced Options
```bash
# Run tests with custom timeout
npx jest --testTimeout=60000

# Run tests in specific order
npx jest --runInBand

# Update snapshots (if using snapshot testing)
npx jest --updateSnapshot

# Debug mode
npx jest --detectOpenHandles --forceExit
```

## Legacy Test Scripts

The following legacy scripts are still available for compatibility:

### Legacy Scripts
- `test-runner.js` - Original master test runner
- `test-api-routes.js` - Original comprehensive API tester
- `test-individual.js` - Original individual endpoint tester
- `test-load.js` - Original load testing script
- `quick-test.js` - Quick connectivity test

### Legacy Commands
```bash
# Legacy test commands (still functional)
npm run test:legacy:runner     # Original test runner
npm run test:legacy:api        # Original API tests
npm run test:legacy:load       # Original load tests
npm run test:legacy:individual # Original individual tests
npm run test:quick             # Quick connectivity test
```

## Migration from Legacy to Jest

### Key Differences

**Legacy Scripts:**
- Custom test framework
- Manual result aggregation
- Command-line based reporting
- Custom performance measurement

**Jest Tests:**
- Industry-standard test framework
- Built-in assertions and matchers
- Integrated coverage reporting
- Watch mode and parallel execution
- Better error reporting and debugging

### Benefits of Jest

1. **Better Developer Experience**
   - Watch mode for continuous testing
   - Clear test output and error messages
   - IDE integration and debugging support

2. **Advanced Features**
   - Code coverage reporting
   - Snapshot testing capabilities
   - Parallel test execution
   - Custom matchers and utilities

3. **Industry Standard**
   - Well-documented and widely adopted
   - Large ecosystem of plugins
   - Better CI/CD integration

## Configuration

### Jest Configuration (`jest.config.json`)
- Test environment: Node.js
- Test pattern: `**/*.test.{js,ts}`
- Coverage collection from `src/**/*.{js,ts}`
- Custom setup file: `src/__tests__/setup.js`
- 30-second timeout for async operations

**Features:**
- Server health checks
- Code linting
- API endpoint testing
- Load testing
- Comprehensive reporting
- Multiple test configurations

### 2. `test-api-routes.js` - Comprehensive API Testing
Tests all API endpoints with structured validation and detailed reporting.

**Usage:**
```bash
npm run test:api
# or
node src/__tests__/test-api-routes.js
```

**Features:**
- Tests all endpoints systematically
- Response structure validation
- Custom validation logic
- Detailed success/failure reporting
- JSON output for CI/CD integration

### 3. `test-individual.js` - Individual Endpoint Testing
Allows testing specific groups of endpoints or individual routes for debugging.

**Usage:**
```bash
npm run test:individual [group]

# Test data endpoints only
node src/__tests__/test-individual.js data

# Test analysis endpoints
node src/__tests__/test-individual.js analysis

# Test agency-specific endpoints
node src/__tests__/test-individual.js agency

# Performance testing
node src/__tests__/test-individual.js performance
```

**Groups:**
- `data` - Data endpoints (/api/data/*)
- `analysis` - Analysis endpoints (/api/analysis/*)
- `agency` - Agency-specific endpoints
- `debug` - Debug endpoints
- `cache` - Cache management endpoints
- `performance` - Response time testing

### 4. `test-load.js` - Load Testing
Performs load and stress testing to identify performance bottlenecks.

**Usage:**
```bash
npm run test:load

# Custom load testing
node src/__tests__/test-load.js load 5 25  # 5 concurrent users, 25 total requests

# Stress testing
node src/__tests__/test-load.js stress
```

**Features:**
- Concurrent request testing
- Performance threshold validation
- Response time analysis
- Success rate monitoring
- Configurable load parameters

## Configuration

### `test-config.json`
Central configuration file containing:
- API endpoint definitions
- Expected response structures
- Performance thresholds
- Test suite configurations

## API Endpoints Tested

### Data Endpoints
- `GET /api/data/agencies` - List all agencies
- `GET /api/data/titles` - List all titles
- `GET /api/data/titles?agencyId={id}` - Filter titles by agency

### Analysis Endpoints
- `GET /api/analysis/cross-cutting` - Cross-cutting regulations analysis
- `GET /api/analysis/complexity_score/max-aggregated` - Max aggregated complexity score
- `GET /api/analysis/complexity_score/max-cached` - Max cached complexity score
- `GET /api/analysis/complexity_score/max-aggregated/clear-cache` - Clear cache

### Agency-Specific Endpoints
- `GET /api/analysis/checksum/agency/{agencyId}` - Agency checksum
- `GET /api/analysis/checksum/agency/{agencyId}?date={date}` - Historical checksum
- `GET /api/analysis/historical_changes/agency/{agencyId}` - Historical changes
- `GET /api/analysis/word_count/agency/{agencyId}` - Word count analysis
- `GET /api/analysis/complexity_score/agency/{agencyId}` - Complexity score
- `GET /api/analysis/cross-cutting/agency/{agencyId}` - Agency cross-cutting analysis

### Debug Endpoints
- `GET /api/debug/aggregation-test` - Debug aggregation testing

## Running Tests

### Prerequisites
1. **Development server must be running:**
   ```bash
   npm run dev
   ```

2. **Database must be properly set up:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

3. **Data should be ingested:**
   ```bash
   npm run ingest:test  # For testing with limited data
   # or
   npm run ingest:all   # For full dataset
   ```

### Quick Start
```bash
# Install dependencies
npm install

# Start development server (in one terminal)
npm run dev

# Run all tests (in another terminal)
npm test
```

### Test Scenarios

#### 1. Development Testing
```bash
# Quick validation during development
npm run test:smoke
```

#### 2. API Validation
```bash
# Comprehensive API testing
npm run test:api
```

#### 3. Performance Testing
```bash
# Load testing
npm run test:load

# Individual endpoint performance
node test-individual.js performance
```

#### 4. Debugging
```bash
# Test specific endpoint group
node src/__tests__/test-individual.js data

# Test with verbose output
node src/__tests__/test-runner.js --verbose
```

## Output Files

### Test Results
- `test-results.json` - Detailed API test results
- `load-test-results.json` - Load testing results
- `test-report.json` - Master test runner report

### Example Output Structure
```json
{
  "summary": {
    "total": 15,
    "passed": 14,
    "failed": 1,
    "successRate": "93.3%",
    "duration": "45.67s",
    "timestamp": "2025-09-02T10:30:00.000Z"
  },
  "tests": [
    {
      "test": "Data - Agencies - Status Code (200)",
      "passed": true,
      "details": "OK",
      "timestamp": "2025-09-02T10:30:05.000Z"
    }
  ]
}
```

## Environment Variables

- `API_BASE_URL` - Base URL for API testing (default: http://localhost:3000)

## Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   Error: Cannot connect to server at http://localhost:3000
   Solution: Start the development server with `npm run dev`
   ```

2. **Database Not Ready**
   ```
   Error: Failed to fetch agencies
   Solution: Run `npm run db:migrate` and `npm run ingest:test`
   ```

3. **Port Conflicts**
   ```
   Solution: Set API_BASE_URL environment variable
   API_BASE_URL=http://localhost:3001 npm test
   ```

### Performance Issues

If load tests fail due to timeouts:
1. Check server performance
2. Adjust performance thresholds in `test-config.json`
3. Reduce concurrent users in load testing
4. Check database optimization

## Integration with CI/CD

The test scripts are designed for CI/CD integration:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    npm run dev &
    sleep 10  # Wait for server to start
    npm test
```

## Contributing

When adding new API endpoints:
1. Add endpoint configuration to `test-config.json`
2. Add test cases to appropriate test scripts
3. Update performance thresholds
4. Run full test suite to validate

## Support

For issues with the testing suite:
1. Check server status: `curl http://localhost:3000/api/data/agencies`
2. Review test output files for detailed error information
3. Use individual test scripts for debugging specific endpoints
4. Check the development server logs for API errors
