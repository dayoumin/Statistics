/**
 * Pyodide Web Worker
 * Runs Python code in a separate thread
 */

let pyodide = null;

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, config, code } = event.data;
  
  try {
    switch (type) {
      case 'init':
        await initializePyodide(config);
        break;
        
      case 'run':
        const result = await runCode(code);
        self.postMessage({ type: 'result', result });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message 
    });
  }
};

// Initialize Pyodide
async function initializePyodide(config) {
  try {
    // Import Pyodide
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
    
    // Send progress update
    self.postMessage({
      type: 'progress',
      data: {
        stage: 'loading',
        progress: 10,
        message: 'Loading Pyodide...'
      }
    });
    
    // Load Pyodide
    pyodide = await loadPyodide({
      indexURL: config.indexURL || 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });
    
    self.postMessage({
      type: 'progress',
      data: {
        stage: 'loading',
        progress: 30,
        message: 'Pyodide loaded'
      }
    });
    
    // Load packages
    const packages = config.packages || ['numpy', 'scipy'];
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const progress = 30 + (50 * (i + 1) / packages.length);
      
      self.postMessage({
        type: 'progress',
        data: {
          stage: 'packages',
          progress,
          message: `Loading ${pkg}...`
        }
      });
      
      await pyodide.loadPackage(pkg);
    }
    
    self.postMessage({
      type: 'progress',
      data: {
        stage: 'packages',
        progress: 80,
        message: 'All packages loaded'
      }
    });
    
    // Define statistical functions
    await defineFunctions();
    
    self.postMessage({
      type: 'progress',
      data: {
        stage: 'complete',
        progress: 100,
        message: 'Ready'
      }
    });
    
    // Send ready message
    self.postMessage({ type: 'ready' });
    
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: `Failed to initialize: ${error.message}` 
    });
  }
}

// Define Python statistical functions
async function defineFunctions() {
  const pythonCode = `
import numpy as np
import scipy.stats as stats
import warnings
warnings.filterwarnings('ignore')

def perform_t_test(group1, group2, paired=False):
    """Perform t-test"""
    group1 = np.array(group1)
    group2 = np.array(group2)
    
    if paired:
        stat, p_value = stats.ttest_rel(group1, group2)
    else:
        stat, p_value = stats.ttest_ind(group1, group2)
    
    return {
        'statistic': float(stat),
        'p_value': float(p_value),
        'significant': p_value < 0.05
    }

def perform_anova(groups):
    """Perform one-way ANOVA"""
    groups = [np.array(g) for g in groups]
    f_stat, p_value = stats.f_oneway(*groups)
    
    return {
        'f_statistic': float(f_stat),
        'p_value': float(p_value),
        'significant': p_value < 0.05
    }

def test_normality(data):
    """Test for normality using Shapiro-Wilk"""
    data = np.array(data)
    stat, p_value = stats.shapiro(data)
    
    return {
        'statistic': float(stat),
        'p_value': float(p_value),
        'is_normal': p_value > 0.05
    }

def test_homogeneity(groups):
    """Test for homogeneity of variances using Levene's test"""
    groups = [np.array(g) for g in groups]
    stat, p_value = stats.levene(*groups)
    
    return {
        'statistic': float(stat),
        'p_value': float(p_value),
        'equal_variance': p_value > 0.05
    }

print("Statistical functions defined")
`;
  
  await pyodide.runPythonAsync(pythonCode);
}

// Run Python code
async function runCode(code) {
  if (!pyodide) {
    throw new Error('Pyodide not initialized');
  }
  
  try {
    const result = await pyodide.runPythonAsync(code);
    return result;
  } catch (error) {
    throw new Error(`Python error: ${error.message}`);
  }
}