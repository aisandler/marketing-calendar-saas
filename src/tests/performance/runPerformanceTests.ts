import { performance } from 'perf_hooks';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { reportingConfig, testEnvironment } from './perf.config';

interface TestResult {
  name: string;
  duration: number;
  timestamp: string;
  environment: typeof testEnvironment;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

interface HistoricalData {
  results: TestResult[];
  averages: Record<string, number>;
  regressions: Array<{
    test: string;
    previousAvg: number;
    currentValue: number;
    regressionPercent: number;
  }>;
}

const HISTORY_FILE = path.join(reportingConfig.reportDirectory, 'performance-history.json');
const REPORT_FILE = path.join(reportingConfig.reportDirectory, `perf-report-${Date.now()}.json`);

// Ensure report directory exists
if (!fs.existsSync(reportingConfig.reportDirectory)) {
  fs.mkdirSync(reportingConfig.reportDirectory, { recursive: true });
}

// Load historical data
const loadHistoricalData = (): HistoricalData => {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  return {
    results: [],
    averages: {},
    regressions: [],
  };
};

// Save historical data
const saveHistoricalData = (data: HistoricalData) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
};

// Calculate averages from historical data
const calculateAverages = (results: TestResult[]) => {
  const averages: Record<string, number> = {};
  const testGroups: Record<string, number[]> = {};

  results.forEach(result => {
    if (!testGroups[result.name]) {
      testGroups[result.name] = [];
    }
    testGroups[result.name].push(result.duration);
  });

  Object.entries(testGroups).forEach(([name, durations]) => {
    averages[name] = durations.reduce((a, b) => a + b, 0) / durations.length;
  });

  return averages;
};

// Check for performance regressions
const checkRegressions = (
  currentResults: TestResult[],
  historicalAverages: Record<string, number>,
  threshold = 0.1 // 10% regression threshold
) => {
  const regressions: HistoricalData['regressions'] = [];

  currentResults.forEach(result => {
    const historicalAvg = historicalAverages[result.name];
    if (historicalAvg) {
      const regressionPercent = (result.duration - historicalAvg) / historicalAvg;
      if (regressionPercent > threshold) {
        regressions.push({
          test: result.name,
          previousAvg: historicalAvg,
          currentValue: result.duration,
          regressionPercent,
        });
      }
    }
  });

  return regressions;
};

// Run performance tests
const runPerformanceTests = async () => {
  console.log('Running performance tests...');
  
  // Set up environment
  process.env.NODE_ENV = 'production';
  if (testEnvironment.enableSlowMode) {
    process.env.SLOW_MODE = 'true';
  }

  const startTime = Date.now();
  const results: TestResult[] = [];

  try {
    // Run tests and collect results
    const testOutput = execSync('jest --config=jest.perf.config.js --json', {
      encoding: 'utf8',
    });
    
    const testData = JSON.parse(testOutput);
    
    testData.testResults.forEach((suite: any) => {
      suite.testResults.forEach((test: any) => {
        const result: TestResult = {
          name: test.title,
          duration: test.duration,
          timestamp: new Date().toISOString(),
          environment: { ...testEnvironment },
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        };
        results.push(result);
      });
    });

    // Load and update historical data
    const historicalData = loadHistoricalData();
    historicalData.results.push(...results);
    
    // Calculate new averages
    const newAverages = calculateAverages(historicalData.results);
    historicalData.averages = newAverages;
    
    // Check for regressions
    const regressions = checkRegressions(results, historicalData.averages);
    historicalData.regressions = regressions;
    
    // Save updated historical data
    saveHistoricalData(historicalData);

    // Generate current test report
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      results,
      regressions,
      environment: {
        ...testEnvironment,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      systemMetrics: reportingConfig.includeSystemMetrics ? {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      } : undefined,
    };

    // Save report
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

    // Log results
    console.log('\nPerformance Test Results:');
    console.log('-------------------------');
    results.forEach(result => {
      console.log(`${result.name}: ${result.duration}ms`);
    });

    if (regressions.length > 0) {
      console.log('\nPerformance Regressions Detected:');
      console.log('--------------------------------');
      regressions.forEach(regression => {
        console.log(
          `${regression.test}:`,
          `Previous avg: ${regression.previousAvg.toFixed(2)}ms,`,
          `Current: ${regression.currentValue.toFixed(2)}ms,`,
          `Regression: ${(regression.regressionPercent * 100).toFixed(1)}%`
        );
      });
    }

    console.log(`\nFull report saved to: ${REPORT_FILE}`);

  } catch (error) {
    console.error('Error running performance tests:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runPerformanceTests();
}

export { runPerformanceTests };
export type { TestResult, HistoricalData }; 