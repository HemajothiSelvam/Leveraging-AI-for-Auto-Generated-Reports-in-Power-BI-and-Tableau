// Global variables
let currentStep = 1;
let uploadedData = null;
let selectedPlatform = null;
let currentChart = null;
let dataColumns = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    updateProgress();
});

// File Upload Functionality
function initializeFileUpload() {
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('fileInput');

    // Click to upload
    fileUpload.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop functionality
    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.classList.add('dragover');
    });

    fileUpload.addEventListener('dragleave', () => {
        fileUpload.classList.remove('dragover');
    });

    fileUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUpload.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// Handle file upload
function handleFileUpload(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');

    // Display file information
    fileName.textContent = `File: ${file.name}`;
    fileSize.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileInfo.style.display = 'block';

    // Parse file based on type
    if (file.name.endsWith('.csv')) {
        parseCSVFile(file);
    } else if (file.name.endsWith('.json')) {
        parseJSONFile(file);
    } else {
        alert('Please upload a CSV or JSON file');
    }
}

// Parse CSV file
function parseCSVFile(file) {
    Papa.parse(file, {
        complete: function(results) {
            if (results.errors.length > 0) {
                console.error('Parse errors:', results.errors);
                alert('Error parsing CSV file');
                return;
            }
            
            uploadedData = results.data;
            dataColumns = results.meta.fields || Object.keys(uploadedData[0] || {});
            console.log('CSV parsed successfully:', uploadedData.length, 'rows');
        },
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
    });
}

// Parse JSON file
function parseJSONFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            uploadedData = Array.isArray(jsonData) ? jsonData : [jsonData];
            dataColumns = Object.keys(uploadedData[0] || {});
            console.log('JSON parsed successfully:', uploadedData.length, 'rows');
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Error parsing JSON file');
        }
    };
    reader.readAsText(file);
}

// Platform selection
function selectPlatform(platform) {
    selectedPlatform = platform;
    
    // Update UI
    document.querySelectorAll('.platform-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.platform-card').classList.add('selected');
    
    // Show selected platform
    const selectedDiv = document.getElementById('selectedPlatform');
    const platformName = document.getElementById('platformName');
    platformName.textContent = platform === 'powerbi' ? 'Power BI Style' : 'Tableau Style';
    selectedDiv.style.display = 'block';
    
    // Apply theme
    document.body.className = platform === 'powerbi' ? 'powerbi-theme' : 'tableau-theme';
}

// Navigation functions
function nextStep() {
    // Validate current step
    if (currentStep === 1 && !uploadedData) {
        alert('Please upload a dataset first');
        return;
    }
    
    if (currentStep === 2 && !selectedPlatform) {
        alert('Please select a visualization platform');
        return;
    }
    
    // Hide current step
    document.getElementById(`step${currentStep}`).classList.remove('active');
    
    // Move to next step
    currentStep++;
    
    // Show next step
    document.getElementById(`step${currentStep}`).classList.add('active');
    
    // Update progress
    updateProgress();
    
    // Execute step-specific functions
    if (currentStep === 3) {
        showDataPreview();
    } else if (currentStep === 4) {
        initializeVisualizations();
    }
}

function updateProgress() {
    const progress = document.getElementById('progress');
    const percentage = (currentStep / 5) * 100;
    progress.style.width = percentage + '%';
}

// Data preview functionality
function showDataPreview() {
    if (!uploadedData || uploadedData.length === 0) return;
    
    // Show statistics
    showDataStatistics();
    
    // Show data table
    showDataTable();
}

function showDataStatistics() {
    const statsContainer = document.getElementById('dataStats');
    const numRows = uploadedData.length;
    const numColumns = dataColumns.length;
    
    // Calculate basic statistics
    const numericColumns = dataColumns.filter(col => 
        uploadedData.some(row => typeof row[col] === 'number')
    );
    
    const stats = [
        { label: 'Total Rows', value: numRows },
        { label: 'Total Columns', value: numColumns },
        { label: 'Numeric Columns', value: numericColumns.length },
        { label: 'Text Columns', value: numColumns - numericColumns.length }
    ];
    
    statsContainer.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

function showDataTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Create header
    tableHeader.innerHTML = `<tr>${dataColumns.map(col => `<th>${col}</th>`).join('')}</tr>`;
    
    // Create body (show first 10 rows)
    const rowsToShow = uploadedData.slice(0, 10);
    tableBody.innerHTML = rowsToShow.map(row => 
        `<tr>${dataColumns.map(col => `<td>${row[col] || ''}</td>`).join('')}</tr>`
    ).join('');
}

// Visualization initialization
function initializeVisualizations() {
    populateAxisSelectors();
    createDefaultChart();
}

function populateAxisSelectors() {
    const xAxisSelect = document.getElementById('xAxis');
    const yAxisSelect = document.getElementById('yAxis');
    
    // Clear existing options
    xAxisSelect.innerHTML = '<option value="">Select X-Axis</option>';
    yAxisSelect.innerHTML = '<option value="">Select Y-Axis</option>';
    
    // Add column options
    dataColumns.forEach(col => {
        xAxisSelect.innerHTML += `<option value="${col}">${col}</option>`;
        yAxisSelect.innerHTML += `<option value="${col}">${col}</option>`;
    });
    
    // Set default selections
    if (dataColumns.length > 0) {
        xAxisSelect.value = dataColumns[0];
        if (dataColumns.length > 1) {
            yAxisSelect.value = dataColumns[1];
        }
    }
}

function createDefaultChart() {
    updateChart();
}

function updateChart() {
    const chartType = document.getElementById('chartType').value;
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;
    
    if (!xAxis || !yAxis) return;
    
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Prepare data
    const chartData = prepareChartData(chartType, xAxis, yAxis);
    
    // Create new chart
    currentChart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: getChartOptions(chartType, selectedPlatform)
    });
}

function prepareChartData(chartType, xAxis, yAxis) {
    const labels = [];
    const data = [];
    
    if (chartType === 'pie' || chartType === 'doughnut') {
        // For pie charts, group by xAxis and sum yAxis
        const groupedData = {};
        uploadedData.forEach(row => {
            const key = row[xAxis];
            const value = parseFloat(row[yAxis]) || 0;
            groupedData[key] = (groupedData[key] || 0) + value;
        });
        
        Object.entries(groupedData).forEach(([key, value]) => {
            labels.push(key);
            data.push(value);
        });
        
        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColors(labels.length),
                borderWidth: 2
            }]
        };
    } else {
        // For other charts
        uploadedData.slice(0, 20).forEach(row => {
            labels.push(row[xAxis]);
            data.push(parseFloat(row[yAxis]) || 0);
        });
        
        return {
            labels: labels,
            datasets: [{
                label: yAxis,
                data: data,
                backgroundColor: selectedPlatform === 'powerbi' ? '#0078D4' : '#1F77B4',
                borderColor: selectedPlatform === 'powerbi' ? '#F2C811' : '#FF7F0E',
                borderWidth: 2
            }]
        };
    }
}

function getChartOptions(chartType, platform) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                enabled: true
            }
        }
    };
    
    if (platform === 'powerbi') {
        baseOptions.plugins.legend.labels = {
            color: '#2C3E50',
            font: { size: 12, weight: 'bold' }
        };
    } else {
        baseOptions.plugins.legend.labels = {
            color: '#34495E',
            font: { size: 11 }
        };
    }
    
    return baseOptions;
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

function exportChart() {
    if (currentChart) {
        const url = currentChart.toBase64Image();
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = url;
        link.click();
    }
}

// Generate multiple charts
function generateMultipleCharts() {
    const container = document.getElementById('multipleCharts');
    container.innerHTML = '';
    
    // Find numeric columns for charts
    const numericColumns = dataColumns.filter(col => 
        uploadedData.some(row => typeof row[col] === 'number')
    );
    
    if (numericColumns.length < 2) return;
    
    // Create different chart types
    const chartTypes = ['bar', 'line', 'pie'];
    chartTypes.forEach((type, index) => {
        if (index < numericColumns.length - 1) {
            createMiniChart(container, type, dataColumns[0], numericColumns[index]);
        }
    });
}

function createMiniChart(container, chartType, xCol, yCol) {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-card';
    chartDiv.innerHTML = `
        <h3>${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart: ${yCol} vs ${xCol}</h3>
        <canvas id="chart-${chartType}-${Date.now()}"></canvas>
    `;
    container.appendChild(chartDiv);
    
    const canvas = chartDiv.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    const chartData = prepareChartData(chartType, xCol, yCol);
    
    new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
                x: { display: true },
                y: { display: true }
            } : {}
        }
    });
}

// Generate comprehensive report
function generateReport() {
    const reportContainer = document.getElementById('reportContainer');
    
    // Calculate insights
    const insights = generateInsights();
    
    reportContainer.innerHTML = `
        <div class="report-section">
            <h3>📊 Dataset Summary</h3>
            <p><strong>File:</strong> ${document.getElementById('fileName').textContent}</p>
            <p><strong>Records:</strong> ${uploadedData.length} rows</p>
            <p><strong>Columns:</strong> ${dataColumns.length} fields</p>
            <p><strong>Platform Style:</strong> ${selectedPlatform === 'powerbi' ? 'Power BI' : 'Tableau'}</p>
        </div>
        
        <div class="report-section">
            <h3>🔍 Key Insights</h3>
            ${insights.map(insight => `<p>• ${insight}</p>`).join('')}
        </div>
        
        <div class="report-section">
            <h3>📈 Column Analysis</h3>
            ${generateColumnAnalysis()}
        </div>
        
        <div class="report-section">
            <h3>💡 Recommendations</h3>
            ${generateRecommendations()}
        </div>
    `;
    
    // Generate multiple charts
    generateMultipleCharts();
    
    // Move to report step
    document.getElementById('step4').classList.remove('active');
    currentStep = 5;
    document.getElementById('step5').classList.add('active');
    updateProgress();
}

function generateInsights() {
    const insights = [];
    
    // Basic insights
    insights.push(`Dataset contains ${uploadedData.length} records across ${dataColumns.length} columns`);
    
    // Numeric column insights
    const numericColumns = dataColumns.filter(col => 
        uploadedData.some(row => typeof row[col] === 'number')
    );
    
    if (numericColumns.length > 0) {
        insights.push(`Found ${numericColumns.length} numeric columns for quantitative analysis`);
        
        // Find column with highest values
        let maxCol = numericColumns[0];
        let maxSum = 0;
        
        numericColumns.forEach(col => {
            const sum = uploadedData.reduce((acc, row) => acc + (parseFloat(row[col]) || 0), 0);
            if (sum > maxSum) {
                maxSum = sum;
                maxCol = col;
            }
        });
        
        insights.push(`"${maxCol}" has the highest total value (${maxSum.toFixed(2)})`);
    }
    
    // Text column insights
    const textColumns = dataColumns.filter(col => 
        !numericColumns.includes(col)
    );
    
    if (textColumns.length > 0) {
        insights.push(`${textColumns.length} categorical columns available for grouping and filtering`);
    }
    
    return insights;
}

function generateColumnAnalysis() {
    let analysis = '<div class="column-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">';
    
    dataColumns.slice(0, 6).forEach(col => {
        const values = uploadedData.map(row => row[col]).filter(val => val != null);
        const uniqueValues = [...new Set(values)];
        const isNumeric = values.some(val => typeof val === 'number');
        
        let stats = '';
        if (isNumeric) {
            const numValues = values.filter(val => typeof val === 'number');
            const sum = numValues.reduce((a, b) => a + b, 0);
            const avg = sum / numValues.length;
            const max = Math.max(...numValues);
            const min = Math.min(...numValues);
            
            stats = `
                <p><strong>Average:</strong> ${avg.toFixed(2)}</p>
                <p><strong>Range:</strong> ${min} - ${max}</p>
            `;
        } else {
            stats = `<p><strong>Unique Values:</strong> ${uniqueValues.length}</p>`;
        }
        
        analysis += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h4>${col}</h4>
                <p><strong>Type:</strong> ${isNumeric ? 'Numeric' : 'Text'}</p>
                ${stats}
                <p><strong>Fill Rate:</strong> ${((values.length / uploadedData.length) * 100).toFixed(1)}%</p>
            </div>
        `;
    });
    
    analysis += '</div>';
    return analysis;
}

function generateRecommendations() {
    const recommendations = [];
    
    const numericColumns = dataColumns.filter(col => 
        uploadedData.some(row => typeof row[col] === 'number')
    );
    
    if (numericColumns.length >= 2) {
        recommendations.push('Consider creating scatter plots to identify correlations between numeric variables');
        recommendations.push('Use bar charts to compare values across different categories');
    }
    
    if (dataColumns.length > 5) {
        recommendations.push('Focus on key metrics for dashboard clarity - avoid information overload');
    }
    
    if (selectedPlatform === 'powerbi') {
        recommendations.push('Leverage Power BI\'s interactive features like drill-down and cross-filtering');
    } else {
        recommendations.push('Take advantage of Tableau\'s storytelling capabilities for data presentation');
    }
    
    recommendations.push('Consider creating time-series visualizations if date columns are available');
    recommendations.push('Use color coding strategically to highlight important data points');
    
    return recommendations.map(rec => `<p>• ${rec}</p>`).join('');
}

// Download report functionality
function downloadReport() {
    const reportContent = document.getElementById('reportContainer').innerHTML;
    const fileName = document.getElementById('fileName').textContent.replace('File: ', '');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Data Analysis Report - ${fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-section { margin-bottom: 30px; }
                .report-section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                .column-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
            </style>
        </head>
        <body>
            <h1>Data Analysis Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            ${reportContent}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${fileName.replace(/\.[^/.]+$/, '')}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
}

// Start over functionality
function startOver() {
    // Reset all variables
    currentStep = 1;
    uploadedData = null;
    selectedPlatform = null;
    dataColumns = [];
    
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    
    // Reset UI
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('selectedPlatform').style.display = 'none';
    document.getElementById('fileInput').value = '';
    
    document.querySelectorAll('.platform-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.body.className = '';
    
    updateProgress();
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getDataType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
        if (!isNaN(Date.parse(value))) return 'date';
        if (!isNaN(parseFloat(value))) return 'number';
    }
    return 'string';
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    alert('An error occurred. Please try refreshing the page.');
});

// Performance monitoring
function logPerformance(action) {
    console.log(`${action} completed at ${new Date().toISOString()}`);
}