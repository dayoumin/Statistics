/**
 * Pyodide Manager for Next.js
 * Singleton pattern with Web Worker support
 */

interface PyodideConfig {
  indexURL: string
  packages: string[]
  retryAttempts: number
  retryDelay: number
}

interface ProgressCallback {
  (stage: string, progress: number, message: string): void
}

class PyodideManager {
  private static instance: PyodideManager | null = null
  private pyodide: any = null
  private worker: Worker | null = null
  private isInitializing = false
  private isReady = false
  private initPromise: Promise<any> | null = null
  private loadedPackages = new Set<string>()
  
  private config: PyodideConfig = {
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
    packages: ['numpy', 'scipy', 'pandas', 'statsmodels'],
    retryAttempts: 3,
    retryDelay: 2000
  }
  
  // Callbacks
  public onProgress: ProgressCallback | null = null
  public onError: ((error: Error) => void) | null = null
  public onReady: ((pyodide: any) => void) | null = null
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PyodideManager {
    if (!PyodideManager.instance) {
      PyodideManager.instance = new PyodideManager()
    }
    return PyodideManager.instance
  }
  
  /**
   * Initialize Pyodide (with Web Worker support for Next.js)
   */
  public async initialize(useWorker = true): Promise<any> {
    // Already initialized
    if (this.isReady) {
      console.log('[PyodideManager] Already initialized')
      return this.pyodide || this.worker
    }
    
    // Initialization in progress
    if (this.isInitializing && this.initPromise) {
      console.log('[PyodideManager] Initialization in progress, waiting...')
      return this.initPromise
    }
    
    // Start initialization
    this.isInitializing = true
    this.initPromise = useWorker ? this.initializeWorker() : this.initializeMain()
    
    try {
      const result = await this.initPromise
      this.isReady = true
      this.isInitializing = false
      console.log('[PyodideManager] Initialization complete')
      
      if (this.onReady) {
        this.onReady(result)
      }
      
      return result
    } catch (error) {
      this.isInitializing = false
      console.error('[PyodideManager] Initialization failed:', error)
      
      if (this.onError) {
        this.onError(error as Error)
      }
      
      throw error
    }
  }
  
  /**
   * Initialize in Web Worker (recommended for Next.js)
   */
  private async initializeWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/workers/pyodide.worker.js')
        
        this.worker.onmessage = (event) => {
          const { type, data, error } = event.data
          
          switch (type) {
            case 'ready':
              console.log('[PyodideManager] Worker ready')
              resolve(this.worker!)
              break
            case 'progress':
              if (this.onProgress) {
                this.onProgress(data.stage, data.progress, data.message)
              }
              break
            case 'error':
              reject(new Error(error))
              break
          }
        }
        
        // Initialize worker
        this.worker.postMessage({
          type: 'init',
          config: this.config
        })
      } catch (error) {
        reject(error)
      }
    })
  }
  
  /**
   * Initialize in main thread (fallback)
   */
  private async initializeMain(): Promise<any> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`[PyodideManager] Initialization attempt ${attempt}/${this.config.retryAttempts}`)
        
        // Load Pyodide
        this.updateProgress('pyodide', 10, 'Loading Pyodide...')
        
        // Load Pyodide from CDN for browser environment
        if (typeof window !== 'undefined') {
          // Browser environment - load from CDN
          const script = document.createElement('script')
          script.src = `${this.config.indexURL}pyodide.js`
          
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
          
          // Wait for loadPyodide to be available
          if (!(window as any).loadPyodide) {
            throw new Error('loadPyodide is not available')
          }
          
          this.pyodide = await (window as any).loadPyodide({
            indexURL: this.config.indexURL
          })
        } else {
          // Node.js environment - not supported for browser app
          throw new Error('Pyodide must be loaded in browser environment')
        }
        
        this.updateProgress('pyodide', 30, 'Pyodide loaded')
        
        // Load packages
        await this.loadPackages()
        
        // Define Python functions
        await this.definePythonFunctions()
        
        this.updateProgress('complete', 100, 'Ready')
        return this.pyodide
        
      } catch (error) {
        lastError = error as Error
        console.error(`[PyodideManager] Attempt ${attempt} failed:`, error)
        
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        }
      }
    }
    
    throw lastError || new Error('Failed to initialize Pyodide')
  }
  
  /**
   * Load Python packages
   */
  private async loadPackages(): Promise<void> {
    const total = this.config.packages.length
    
    for (let i = 0; i < total; i++) {
      const pkg = this.config.packages[i]
      
      if (this.loadedPackages.has(pkg)) {
        continue
      }
      
      const progress = 30 + (50 * (i + 1) / total)
      this.updateProgress('packages', progress, `Loading ${pkg}...`)
      
      await this.pyodide.loadPackage(pkg)
      this.loadedPackages.add(pkg)
    }
    
    this.updateProgress('packages', 80, 'All packages loaded')
  }
  
  /**
   * Define Python statistical functions
   */
  private async definePythonFunctions(): Promise<void> {
    this.updateProgress('functions', 85, 'Defining statistical functions...')
    
    const pythonCode = `
import numpy as np
import scipy.stats as stats
import pandas as pd
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
        'significant': bool(p_value < 0.05)
    }

def perform_anova(groups):
    """Perform one-way ANOVA"""
    groups = [np.array(g) for g in groups]
    f_stat, p_value = stats.f_oneway(*groups)
    
    return {
        'f_statistic': float(f_stat),
        'p_value': float(p_value),
        'significant': bool(p_value < 0.05)  # Convert numpy.bool_ to Python bool
    }

def test_normality(data):
    """Test for normality using Shapiro-Wilk"""
    data = np.array(data)
    stat, p_value = stats.shapiro(data)
    
    return {
        'statistic': float(stat),
        'p_value': float(p_value),
        'is_normal': bool(p_value > 0.05)
    }

def test_homogeneity(groups):
    """Test for homogeneity of variances using Levene's test"""
    groups = [np.array(g) for g in groups]
    stat, p_value = stats.levene(*groups)
    
    return {
        'statistic': float(stat),
        'p_value': float(p_value),
        'equal_variance': bool(p_value > 0.05)
    }

def perform_correlation(x, y, method='pearson'):
    """Perform correlation analysis"""
    x = np.array(x)
    y = np.array(y)
    
    if method == 'pearson':
        r, p_value = stats.pearsonr(x, y)
    elif method == 'spearman':
        r, p_value = stats.spearmanr(x, y)
    elif method == 'kendall':
        r, p_value = stats.kendalltau(x, y)
    else:
        raise ValueError(f"Unknown correlation method: {method}")
    
    # Calculate confidence interval for Pearson
    if method == 'pearson' and len(x) > 3:
        z = np.arctanh(r)
        se = 1 / np.sqrt(len(x) - 3)
        z_ci = [z - 1.96 * se, z + 1.96 * se]
        ci_lower = np.tanh(z_ci[0])
        ci_upper = np.tanh(z_ci[1])
    else:
        ci_lower = ci_upper = None
    
    return {
        'method': method,
        'correlation': float(r),
        'p_value': float(p_value),
        'n': len(x),
        'r_squared': float(r**2) if method == 'pearson' else None,
        'ci_lower': float(ci_lower) if ci_lower is not None else None,
        'ci_upper': float(ci_upper) if ci_upper is not None else None,
        'significant': bool(p_value < 0.05),
        'interpretation': interpret_correlation(r)
    }

def interpret_correlation(r):
    """Interpret correlation coefficient"""
    abs_r = abs(r)
    if abs_r < 0.1:
        strength = 'negligible'
    elif abs_r < 0.3:
        strength = 'weak'
    elif abs_r < 0.5:
        strength = 'moderate'
    elif abs_r < 0.7:
        strength = 'strong'
    else:
        strength = 'very strong'
    
    direction = 'positive' if r > 0 else 'negative' if r < 0 else 'no'
    return f'{direction} {strength} correlation'

def perform_regression(x, y):
    """Perform simple linear regression"""
    x = np.array(x)
    y = np.array(y)
    
    # Calculate regression
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    
    # Predictions
    y_pred = slope * x + intercept
    
    # Residuals
    residuals = y - y_pred
    
    # Sum of squares
    ss_tot = np.sum((y - np.mean(y))**2)
    ss_res = np.sum(residuals**2)
    ss_reg = ss_tot - ss_res
    
    # Mean squared error
    mse = ss_res / (len(x) - 2)
    rmse = np.sqrt(mse)
    
    # R-squared and adjusted R-squared
    r_squared = 1 - (ss_res / ss_tot)
    adj_r_squared = 1 - (1 - r_squared) * (len(x) - 1) / (len(x) - 2)
    
    # F-statistic
    f_stat = (ss_reg / 1) / (ss_res / (len(x) - 2))
    f_p_value = 1 - stats.f.cdf(f_stat, 1, len(x) - 2)
    
    return {
        'slope': float(slope),
        'intercept': float(intercept),
        'r_value': float(r_value),
        'p_value': float(p_value),
        'std_err': float(std_err),
        'r_squared': float(r_squared),
        'adj_r_squared': float(adj_r_squared),
        'rmse': float(rmse),
        'f_statistic': float(f_stat),
        'f_p_value': float(f_p_value),
        'n': len(x),
        'equation': f'y = {slope:.4f}x + {intercept:.4f}'
    }

def handle_missing_values(data, method='drop'):
    """Handle missing values in data"""
    df = pd.DataFrame(data)
    
    # Count missing values
    missing_count = df.isnull().sum().to_dict()
    missing_percent = (df.isnull().sum() / len(df) * 100).to_dict()
    
    # Handle missing values
    if method == 'drop':
        # Drop rows with any missing values
        df_cleaned = df.dropna()
    elif method == 'mean':
        # Fill with mean for numeric columns
        df_cleaned = df.fillna(df.mean())
    elif method == 'median':
        # Fill with median for numeric columns
        df_cleaned = df.fillna(df.median())
    elif method == 'forward':
        # Forward fill
        df_cleaned = df.fillna(method='ffill')
    elif method == 'backward':
        # Backward fill
        df_cleaned = df.fillna(method='bfill')
    else:
        df_cleaned = df
    
    return {
        'original_shape': list(df.shape),
        'cleaned_shape': list(df_cleaned.shape),
        'missing_count': missing_count,
        'missing_percent': missing_percent,
        'rows_removed': len(df) - len(df_cleaned),
        'method': method,
        'data': df_cleaned.to_dict('list')
    }

def post_hoc_tukey(groups, alpha=0.05):
    """Perform Tukey's HSD post-hoc test"""
    from scipy.stats import studentized_range
    
    # Flatten groups and create labels
    data = []
    labels = []
    for i, group in enumerate(groups):
        data.extend(group)
        labels.extend([i] * len(group))
    
    # Calculate means and sample sizes
    means = [np.mean(g) for g in groups]
    n_groups = len(groups)
    n_obs = [len(g) for g in groups]
    
    # Calculate MSE (Mean Square Error)
    grand_mean = np.mean(data)
    sse = sum(np.sum((np.array(g) - means[i])**2) for i, g in enumerate(groups))
    df_error = sum(n_obs) - n_groups
    mse = sse / df_error
    
    # Studentized range critical value
    q_crit = studentized_range.ppf(1 - alpha, n_groups, df_error)
    
    # Pairwise comparisons
    comparisons = []
    for i in range(n_groups):
        for j in range(i + 1, n_groups):
            # Calculate test statistic
            se = np.sqrt(mse * (1/n_obs[i] + 1/n_obs[j]) / 2)
            q_stat = abs(means[i] - means[j]) / se
            
            # Determine significance
            significant = q_stat > q_crit
            
            comparisons.append({
                'group1': i,
                'group2': j,
                'mean_diff': float(means[i] - means[j]),
                'q_statistic': float(q_stat),
                'q_critical': float(q_crit),
                'std_error': float(se),
                'p_value': float(1 - studentized_range.cdf(q_stat, n_groups, df_error)),
                'significant': bool(significant)
            })
    
    return {
        'method': 'Tukey HSD',
        'alpha': alpha,
        'comparisons': comparisons,
        'group_means': [float(m) for m in means],
        'mse': float(mse),
        'df_error': df_error
    }

def post_hoc_games_howell(groups, alpha=0.05):
    """Perform Games-Howell post-hoc test (for unequal variances)"""
    from scipy.stats import t
    
    # Calculate means, variances, and sample sizes
    means = [np.mean(g) for g in groups]
    vars = [np.var(g, ddof=1) for g in groups]
    n_obs = [len(g) for g in groups]
    n_groups = len(groups)
    
    # Pairwise comparisons
    comparisons = []
    for i in range(n_groups):
        for j in range(i + 1, n_groups):
            # Standard error
            se = np.sqrt(vars[i]/n_obs[i] + vars[j]/n_obs[j])
            
            # Test statistic
            t_stat = abs(means[i] - means[j]) / se
            
            # Welch-Satterthwaite degrees of freedom
            df = (vars[i]/n_obs[i] + vars[j]/n_obs[j])**2 / (
                (vars[i]/n_obs[i])**2/(n_obs[i]-1) + 
                (vars[j]/n_obs[j])**2/(n_obs[j]-1)
            )
            
            # Critical value (Studentized range approximation)
            t_crit = t.ppf(1 - alpha/(2*n_groups*(n_groups-1)/2), df)
            
            # P-value
            p_value = 2 * (1 - t.cdf(t_stat, df))
            
            comparisons.append({
                'group1': i,
                'group2': j,
                'mean_diff': float(means[i] - means[j]),
                't_statistic': float(t_stat),
                't_critical': float(t_crit),
                'std_error': float(se),
                'df': float(df),
                'p_value': float(p_value),
                'significant': bool(p_value < alpha)
            })
    
    return {
        'method': 'Games-Howell',
        'alpha': alpha,
        'comparisons': comparisons,
        'group_means': [float(m) for m in means],
        'group_vars': [float(v) for v in vars]
    }

def perform_kruskal_wallis(groups):
    """Perform Kruskal-Wallis H test (non-parametric ANOVA)"""
    groups = [np.array(g) for g in groups]
    h_stat, p_value = stats.kruskal(*groups)
    
    # Calculate effect size (epsilon squared)
    n_total = sum(len(g) for g in groups)
    epsilon_squared = h_stat / (n_total - 1)
    
    return {
        'h_statistic': float(h_stat),
        'p_value': float(p_value),
        'df': len(groups) - 1,
        'n_groups': len(groups),
        'n_total': n_total,
        'epsilon_squared': float(epsilon_squared),
        'significant': bool(p_value < 0.05),
        'interpretation': interpret_effect_size(epsilon_squared, 'epsilon_squared')
    }

def perform_mann_whitney(group1, group2, alternative='two-sided'):
    """Perform Mann-Whitney U test (non-parametric t-test)"""
    group1 = np.array(group1)
    group2 = np.array(group2)
    
    u_stat, p_value = stats.mannwhitneyu(group1, group2, alternative=alternative)
    
    # Calculate effect size (rank biserial correlation)
    n1, n2 = len(group1), len(group2)
    r = 1 - (2*u_stat) / (n1 * n2)
    
    return {
        'u_statistic': float(u_stat),
        'p_value': float(p_value),
        'n1': n1,
        'n2': n2,
        'rank_biserial': float(r),
        'alternative': alternative,
        'significant': bool(p_value < 0.05),
        'interpretation': interpret_effect_size(abs(r), 'rank_biserial')
    }

def interpret_effect_size(value, type='cohens_d'):
    """Interpret effect size"""
    if type == 'cohens_d':
        if abs(value) < 0.2:
            return 'negligible'
        elif abs(value) < 0.5:
            return 'small'
        elif abs(value) < 0.8:
            return 'medium'
        else:
            return 'large'
    elif type == 'eta_squared' or type == 'epsilon_squared':
        if value < 0.01:
            return 'negligible'
        elif value < 0.06:
            return 'small'
        elif value < 0.14:
            return 'medium'
        else:
            return 'large'
    elif type == 'rank_biserial':
        if abs(value) < 0.1:
            return 'negligible'
        elif abs(value) < 0.3:
            return 'small'
        elif abs(value) < 0.5:
            return 'medium'
        else:
            return 'large'
    else:
        return 'unknown'

# Make functions available
print("Statistical functions loaded")
`
    
    await this.pyodide.runPythonAsync(pythonCode)
    this.updateProgress('functions', 95, 'Functions defined')
  }
  
  /**
   * Run Python code
   */
  public async runPython(code: string): Promise<any> {
    if (!this.isReady) {
      throw new Error('Pyodide not initialized')
    }
    
    if (this.worker) {
      // Run in worker
      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          const { type, result, error } = event.data
          if (type === 'result') {
            this.worker!.removeEventListener('message', messageHandler)
            resolve(result)
          } else if (type === 'error') {
            this.worker!.removeEventListener('message', messageHandler)
            reject(new Error(error))
          }
        }
        
        this.worker.addEventListener('message', messageHandler)
        this.worker.postMessage({ type: 'run', code })
      })
    } else {
      // Run in main thread
      return await this.pyodide.runPythonAsync(code)
    }
  }
  
  /**
   * Run statistical analysis
   */
  public async runAnalysis(analysisType: string, data: any): Promise<any> {
    console.log('[PyodideManager] Running analysis:', analysisType, data)
    
    // Validate data
    if (!data) {
      throw new Error('No data provided for analysis')
    }
    
    const code = this.generateAnalysisCode(analysisType, data)
    console.log('[PyodideManager] Generated Python code:', code)
    
    try {
      const result = await this.runPython(code)
      console.log('[PyodideManager] Python result:', result)
      return JSON.parse(result)
    } catch (error) {
      console.error('[PyodideManager] Analysis error:', error)
      throw error
    }
  }
  
  /**
   * Generate Python code for analysis
   */
  private generateAnalysisCode(analysisType: string, data: any): string {
    switch (analysisType) {
      case 't-test':
        return `
import json
result = perform_t_test(${JSON.stringify(data.group1)}, ${JSON.stringify(data.group2)}, ${data.paired ? 'True' : 'False'})
json.dumps(result)
`
      case 'anova':
      case 'one-way-anova':
        return `
import json
result = perform_anova(${JSON.stringify(data.groups)})
json.dumps(result)
`
      case 'normality':
        return `
import json
result = test_normality(${JSON.stringify(data.values)})
json.dumps(result)
`
      case 'homogeneity':
        return `
import json
result = test_homogeneity(${JSON.stringify(data.groups)})
json.dumps(result)
`
      case 'correlation':
        return `
import json
result = perform_correlation(${JSON.stringify(data.x)}, ${JSON.stringify(data.y)}, '${data.method || 'pearson'}')
json.dumps(result)
`
      case 'regression':
        return `
import json
result = perform_regression(${JSON.stringify(data.x)}, ${JSON.stringify(data.y)})
json.dumps(result)
`
      case 'missing-values':
        return `
import json
result = handle_missing_values(${JSON.stringify(data.data)}, '${data.method || 'drop'}')
json.dumps(result)
`
      case 'tukey-hsd':
        return `
import json
result = post_hoc_tukey(${JSON.stringify(data.groups)}, ${data.alpha || 0.05})
json.dumps(result)
`
      case 'games-howell':
        return `
import json
result = post_hoc_games_howell(${JSON.stringify(data.groups)}, ${data.alpha || 0.05})
json.dumps(result)
`
      case 'kruskal-wallis':
        return `
import json
result = perform_kruskal_wallis(${JSON.stringify(data.groups)})
json.dumps(result)
`
      case 'mann-whitney':
        return `
import json
result = perform_mann_whitney(${JSON.stringify(data.group1)}, ${JSON.stringify(data.group2)}, '${data.alternative || 'two-sided'}')
json.dumps(result)
`
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`)
    }
  }
  
  /**
   * Update progress
   */
  private updateProgress(stage: string, progress: number, message: string): void {
    if (this.onProgress) {
      this.onProgress(stage, progress, message)
    }
    console.log(`[PyodideManager] ${stage}: ${progress}% - ${message}`)
  }
  
  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pyodide = null
    this.isReady = false
    this.isInitializing = false
    PyodideManager.instance = null
  }
}

export default PyodideManager
export type { PyodideConfig, ProgressCallback }