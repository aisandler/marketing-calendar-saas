export const performanceThresholds = {
  // Render times
  initialRender: 100, // ms
  componentUpdate: 16, // ms (1 frame)
  modalOpen: 32, // ms (2 frames)
  
  // Interaction times
  userInputResponse: 16, // ms
  formValidation: 16, // ms
  toastDisplay: 20, // ms per toast
  colorPickerOpen: 32, // ms
  
  // List performance
  listItemRender: 10, // ms per item
  listScrollFrame: 16, // ms
  
  // Animation performance
  animationFrame: 16, // ms
  transitionDuration: 300, // ms
  
  // Data operations
  formSubmission: 500, // ms (including debounce)
  dataFetch: 1000, // ms
  
  // Memory
  maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
  maxDOMNodes: 1000,
};

export const testEnvironment = {
  // Test environment settings
  enableSlowMode: false, // Increase thresholds by 2x for CI environments
  collectMemoryStats: true,
  collectCPUStats: true,
  collectNetworkStats: true,
  
  // Test data volumes
  smallDataset: 10,
  mediumDataset: 100,
  largeDataset: 1000,
  
  // Network conditions
  networkConditions: {
    latency: 20, // ms
    downloadThroughput: 5 * 1024 * 1024, // 5MB/s
    uploadThroughput: 1 * 1024 * 1024, // 1MB/s
  },
  
  // CPU throttling
  cpuThrottling: 1, // 1x (no throttling)
  
  // Test timeouts
  setupTimeout: 5000, // ms
  testTimeout: 10000, // ms
  teardownTimeout: 5000, // ms
};

export const memoryThresholds = {
  heapUsed: 100 * 1024 * 1024, // 100MB
  heapTotal: 200 * 1024 * 1024, // 200MB
  external: 50 * 1024 * 1024, // 50MB
  arrayBuffers: 10 * 1024 * 1024, // 10MB
};

export const reportingConfig = {
  outputFormat: 'json',
  includeEnvironmentInfo: true,
  includeSystemMetrics: true,
  includeNetworkInfo: true,
  generateHistograms: true,
  saveReportsToFile: true,
  reportDirectory: './performance-reports',
};

export const metricDefinitions = {
  fps: {
    threshold: 60,
    criticalThreshold: 30,
    measurementPeriod: 1000, // ms
  },
  memoryLeak: {
    maxAllowedIncrease: 1024 * 1024, // 1MB
    measurementPeriod: 10000, // ms
  },
  longTasks: {
    threshold: 50, // ms
    reportingThreshold: 100, // ms
  },
  interactionDelay: {
    threshold: 100, // ms
    criticalThreshold: 200, // ms
  },
};

// Helper function to adjust thresholds based on environment
export const getAdjustedThreshold = (threshold: number): number => {
  if (testEnvironment.enableSlowMode) {
    return threshold * 2;
  }
  return threshold;
}; 