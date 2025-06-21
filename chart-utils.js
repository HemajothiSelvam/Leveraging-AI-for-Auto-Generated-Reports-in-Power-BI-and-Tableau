// Chart utilities and configurations

// Color palettes for different themes
const COLOR_PALETTES = {
    powerbi: {
        primary: ['#0078D4', '#00BCF2', '#40E0D0', '#1BA1E2'],
        secondary: ['#F2C811', '#FFB900', '#FF8C00', '#E74856'],
        accent: ['#00CC6A', '#10893E', '#7A7574', '#A4373A']
    },
    tableau: {
        primary: ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728'],
        secondary: ['#9467BD', '#8C564B', '#E377C2', '#7F7F7F'],
        accent: ['#BCBD22', '#17BECF', '#AEC7E8', '#FFBB78']
    }
};

// Chart configuration templates
const CHART_CONFIGS = {
    powerbi: {
        font: {
            family: 'Segoe UI',
            size: 12
        },
        colors: {
            background: '#FFFFFF',
            text: '#323130',
            grid: '#F3F2F1'
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    },
    tableau: {
        font: {
            family: 'Arial',
            size: 11
        },
        colors: {
            background: '#FFFFFF',
            text: '#4A4A4A',
            grid: '#E6E6E6'
        },
        animation: {
            duration: 800,
            easing: 'easeOutCubic'
        }
    }
};

// Advanced chart creation functions
function createAdvancedChart(type, data, options = {}) {
    const config = CHART_CONFIGS[selectedPlatform] || CHART_CONFIGS.tableau;
    const palette = COLOR_PALETTES[selectedPlatform] || COLOR_PALETTES.tableau;
    
    const baseConfig = {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: config.font,
                        color: config.colors.text,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: palette.primary[0],
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true
                }
            },
            animation: config.animation,
            ...options
        }
    };
    
    // Add scales for non-pie charts
    if (!['pie', 'doughnut', 'radar', 'polarArea'].includes(type)) {
        baseConfig.options.scales = {
            x: {
                ticks: {
                    font: config.font,
                    color: config.colors.text
                },
                grid: {
                    color: config.colors.grid
                }
            },
            y: {
                ticks: {
                    font: config.font,
                    color: config.colors.text,
                    callback: function(value) {
                        return formatAxisValue(value);
                    }
                },
                grid: {
                    color: config.colors.grid
                }
            }
        };
    }
    
    return baseConfig;
}

// Data processing utilities
function processDataForChart(data, xColumn, yColumn, chartType) {
    if (!data || !xColumn || !yColumn) return null;
    
    switch (chartType) {
        case 'pie':
        case 'doughnut':
            return processPieData(data, xColumn, yColumn);
        case 'scatter':
            return processScatterData(data, xColumn, yColumn);
        case 'line':
            return processTimeSeriesData(data, xColumn, yColumn);
        default:
            return processBarData(data, xColumn, yColumn);
    }
}

function processPieData(data, xColumn, yColumn) {
    const aggregated = {};
    
    data.forEach(row => {
        const key = String(row[xColumn] || 'Unknown');
        const value = parseFloat(row[yColumn]) || 0;
        aggregated[key] = (aggregated[key] || 0) + value;
    });
    
    const sortedEntries = Object.entries(aggregated)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Limit to top 10 for readability
    
    return {
        labels: sortedEntries.map(([key]) => key),
        datasets: [{
            data: sortedEntries.map(([,value]) => value),
            backgroundColor: generateColorGradient(sortedEntries.length),
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 4
        }]
    };
}

function processScatterData(data, xColumn, yColumn) {
    const points = data.map(row => ({
        x: parseFloat(row[xColumn]) || 0,
        y: parseFloat(row[yColumn]) || 0
    })).filter(point => !isNaN(point.x) && !isNaN(point.y));
    
    return {
        datasets: [{
            label: `${yColumn} vs ${xColumn}`,
            data: points,
            backgroundColor: COLOR_PALETTES[selectedPlatform].primary[0] + '80',
            borderColor: COLOR_PALETTES[selectedPlatform].primary[0],
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };
}

function processTimeSeriesData(data, xColumn, yColumn) {
    // Try to parse dates
    const timeData = data.map(row => {
        const dateValue = row[xColumn];
        const numValue = parseFloat(row[yColumn]) || 0;
        
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else {
            return null;
        }
        
        return { x: date, y: numValue };
    }).filter(item => item && !isNaN(item.x.getTime()));
    
    // Sort by date
    timeData.sort((a, b) => a.x - b.x);
    
    return {
        datasets: [{
            label: yColumn,
            data: timeData,
            borderColor: COLOR_PALETTES[selectedPlatform].primary[0],
            backgroundColor: COLOR_PALETTES[selectedPlatform].primary[0] + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
        }]
    };
}

function processBarData(data, xColumn, yColumn) {
    const aggregated = {};
    
    data.forEach(row => {
        const key = String(row[xColumn] || 'Unknown');
        const value = parseFloat(row[yColumn]) || 0;
        aggregated[key] = (aggregated[key] || 0) + value;
    });
    
    const sortedEntries = Object.entries(aggregated)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15); // Limit for readability
    
    return {
        labels: sortedEntries.map(([key]) => key),
        datasets: [{
            label: yColumn,
            data: sortedEntries.map(([,value]) => value),
            backgroundColor: generateColorGradient(sortedEntries.length, 0.7),
            borderColor: COLOR_PALETTES[selectedPlatform].primary[0],
            borderWidth: 1,
            borderRadius: selectedPlatform === 'powerbi' ? 4 : 0,
            borderSkipped: false
        }]
    };
}

// Color generation utilities
function generateColorGradient(count, alpha = 1) {
    const palette = COLOR_PALETTES[selectedPlatform] || COLOR_PALETTES.tableau;
    const baseColors = [...palette.primary, ...palette.secondary, ...palette.accent];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        if (i < baseColors.length) {
            colors.push(hexToRgba(baseColors[i], alpha));
        } else {
            // Generate additional colors using HSL
            const hue = (i * 137.508) % 360; // Golden angle approximation
            colors.push(`hsla(${hue}, 70%, 60%, ${alpha})`);
        }
    }
    
    return colors;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Formatting utilities
function formatAxisValue(value) {
    if (typeof value !== 'number') return value;
    
    if (Math.abs(value) >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';
    } else if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    } else if (value % 1 !== 0) {
        return value.toFixed(2);
    }
    
    return value;
}

function formatTooltipValue(value, label) {
    if (typeof value === 'number') {
        return `${label}: ${formatAxisValue(value)}`;
    }
    return `${label}: ${value}`;
}

// Statistical analysis utilities
function calculateStatistics(data, column) {
    const values = data.map(row => parseFloat(row[column]))
                      .filter(val => !isNaN(val));
    
    if (values.length === 0) return null;
    
    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    return {
        count: values.length,
        sum: sum,
        mean: mean,
        median: sorted[Math.floor(sorted.length / 2)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        stdDev: Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length),
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q3: sorted[Math.floor(sorted.length * 0.75)]
    };
}

function findCorrelations(data, columns) {
    const correlations = {};
    
    for (let i = 0; i < columns.length; i++) {
        for (let j = i + 1; j < columns.length; j++) {
            const col1 = columns[i];
            const col2 = columns[j];
            
            const pairs = data.map(row => [
                parseFloat(row[col1]),
                parseFloat(row[col2])
            ]).filter(([x, y]) => !isNaN(x) && !isNaN(y));
            
            if (pairs.length > 5) {
                const correlation = calculatePearsonCorrelation(pairs);
                correlations[`${col1}_${col2}`] = {
                    columns: [col1, col2],
                    correlation: correlation,
                    strength: getCorrelationStrength(correlation)
                };
            }
        }
    }
    
    return correlations;
}

function calculatePearsonCorrelation(pairs) {
    const n = pairs.length;
    if (n === 0) return 0;
    
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function getCorrelationStrength(correlation) {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.4) return 'Moderate';
    if (abs >= 0.2) return 'Weak';
    return 'Very Weak';
}

// Export utilities
function exportChartAsImage(chart, filename = 'chart') {
    if (!chart) return;
    
    const url = chart.toBase64Image('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportDataAsCSV(data, filename = 'data') {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}