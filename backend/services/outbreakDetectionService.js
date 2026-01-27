const mongoose = require('mongoose');
const DiseaseReport = require('../models/DiseaseReport');

/**
 * Calculate baseline statistics for a disease in a city
 * @param {string} city - City name
 * @param {string} disease - Disease name
 * @param {string} reportingPeriod - 'daily', 'weekly', 'monthly'
 * @param {number} baselinePeriods - Number of periods to use for baseline (default: 12)
 * @returns {Promise<Object>} - Baseline statistics
 */
async function calculateBaseline(city, disease, reportingPeriod, baselinePeriods = 12) {
  try {
    const reports = await DiseaseReport.find({
      city: city,
      disease: disease,
      reportingPeriod: reportingPeriod
    })
    .sort({ periodStartDate: -1 })
    .limit(baselinePeriods + 1) // Get one extra to exclude current period
    .lean();

    if (reports.length <= 1) {
      // Not enough data for statistical analysis
      return {
        hasEnoughData: false,
        message: `Need at least 2 reporting periods for baseline calculation. Found: ${reports.length}`
      };
    }

    // Exclude the most recent period (current) for baseline calculation
    const baselineReports = reports.slice(1);
    const cases = baselineReports.map(report => report.cases);

    // Calculate statistical measures
    const mean = cases.reduce((sum, cases) => sum + cases, 0) / cases.length;
    
    // Calculate standard deviation
    const squaredDifferences = cases.map(cases => Math.pow(cases - mean, 2));
    const variance = squaredDifferences.reduce((sum, sqDiff) => sum + sqDiff, 0) / cases.length;
    const standardDeviation = Math.sqrt(variance);

    // Get current period data
    const currentReport = reports[0];
    const currentCases = currentReport.cases;

    // Calculate outbreak threshold
    const outbreakThreshold = mean + (2 * standardDeviation);

    // Determine outbreak status
    const isOutbreak = currentCases > outbreakThreshold;
    const outbreakSeverity = currentCases > (mean + (3 * standardDeviation)) ? 'severe' : 
                           currentCases > (mean + (2.5 * standardDeviation)) ? 'moderate' : 'mild';

    return {
      hasEnoughData: true,
      city: city,
      disease: disease,
      reportingPeriod: reportingPeriod,
      baseline: {
        periods: baselineReports.length,
        mean: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        minCases: Math.min(...cases),
        maxCases: Math.max(...cases),
        cases: cases
      },
      current: {
        cases: currentCases,
        periodStartDate: currentReport.periodStartDate,
        periodEndDate: currentReport.periodEndDate,
        outbreakThreshold: Math.round(outbreakThreshold * 100) / 100,
        isOutbreak: isOutbreak,
        outbreakSeverity: outbreakSeverity,
        deviationFromBaseline: Math.round((currentCases - mean) * 100) / 100,
        standardDeviationsFromMean: Math.round(((currentCases - mean) / standardDeviation) * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error calculating baseline:', error);
    throw error;
  }
}

/**
 * Get outbreak analysis for all diseases in all cities
 * @param {string} reportingPeriod - 'daily', 'weekly', 'monthly'
 * @returns {Promise<Array>} - Array of outbreak analyses
 */
async function getAllOutbreakAnalysis(reportingPeriod = 'weekly') {
  try {
    // Get all unique city-disease combinations
    const combinations = await DiseaseReport.aggregate([
      {
        $group: {
          _id: {
            city: '$city',
            disease: '$disease'
          }
        }
      }
    ]);

    const outbreakAnalyses = [];
    
    for (const combination of combinations) {
      try {
        const analysis = await calculateBaseline(
          combination._id.city,
          combination._id.disease,
          reportingPeriod
        );
        
        if (analysis.hasEnoughData) {
          outbreakAnalyses.push(analysis);
        }
      } catch (error) {
        console.error(`Error analyzing ${combination._id.disease} in ${combination._id.city}:`, error);
      }
    }

    return outbreakAnalyses;
  } catch (error) {
    console.error('Error getting all outbreak analyses:', error);
    throw error;
  }
}

/**
 * Detect pandemic-level alerts
 * @param {Array} outbreakAnalyses - Array of outbreak analyses
 * @returns {Promise<Object>} - Pandemic detection results
 */
async function detectPandemicAlerts(outbreakAnalyses) {
  try {
    // Group outbreaks by disease
    const diseaseOutbreaks = {};
    
    outbreakAnalyses.forEach(analysis => {
      if (analysis.current.isOutbreak) {
        if (!diseaseOutbreaks[analysis.disease]) {
          diseaseOutbreaks[analysis.disease] = {
            disease: analysis.disease,
            affectedCities: [],
            totalCases: 0,
            outbreakSeverities: []
          };
        }
        
        diseaseOutbreaks[analysis.disease].affectedCities.push({
          city: analysis.city,
          cases: analysis.current.cases,
          severity: analysis.current.outbreakSeverity,
          standardDeviationsFromMean: analysis.current.standardDeviationsFromMean
        });
        
        diseaseOutbreaks[analysis.disease].totalCases += analysis.current.cases;
        diseaseOutbreaks[analysis.disease].outbreakSeverities.push(analysis.current.outbreakSeverity);
      }
    });

    // Get total cities for percentage calculation
    const totalCities = await DiseaseReport.distinct('city');
    const pandemicThreshold = Math.ceil(totalCities.length * 0.3); // 30% threshold

    const pandemicAlerts = [];
    
    Object.values(diseaseOutbreaks).forEach(diseaseOutbreak => {
      const affectedCitiesCount = diseaseOutbreak.affectedCities.length;
      const percentageAffected = (affectedCitiesCount / totalCities.length) * 100;
      
      if (affectedCitiesCount >= pandemicThreshold) {
        // Determine overall pandemic severity
        const severityCounts = diseaseOutbreak.outbreakSeverities.reduce((acc, severity) => {
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});
        
        const overallSeverity = severityCounts.critical > 0 ? 'critical' :
                               severityCounts.severe > 0 ? 'severe' :
                               severityCounts.moderate > severityCounts.mild ? 'moderate' : 'mild';

        pandemicAlerts.push({
          disease: diseaseOutbreak.disease,
          affectedCities: diseaseOutbreak.affectedCities,
          affectedCitiesCount: affectedCitiesCount,
          totalCities: totalCities.length,
          percentageAffected: Math.round(percentageAffected * 10) / 10,
          totalCases: diseaseOutbreak.totalCases,
          pandemicThreshold: pandemicThreshold,
          isPandemic: true,
          severity: overallSeverity,
          severityBreakdown: severityCounts,
          timestamp: new Date()
        });
      }
    });

    return {
      totalCities: totalCities.length,
      pandemicThreshold: pandemicThreshold,
      pandemicAlerts: pandemicAlerts,
      summary: {
        totalDiseasesWithOutbreaks: Object.keys(diseaseOutbreaks).length,
        totalPandemicAlerts: pandemicAlerts.length,
        highestRiskDisease: pandemicAlerts.length > 0 ? 
          pandemicAlerts.reduce((max, alert) => 
            alert.percentageAffected > max.percentageAffected ? alert : max
          ).disease : null
      }
    };
  } catch (error) {
    console.error('Error detecting pandemic alerts:', error);
    throw error;
  }
}

/**
 * Get comprehensive outbreak summary
 * @param {string} reportingPeriod - 'daily', 'weekly', 'monthly'
 * @returns {Promise<Object>} - Complete outbreak analysis
 */
async function getOutbreakSummary(reportingPeriod = 'weekly') {
  try {
    const outbreakAnalyses = await getAllOutbreakAnalysis(reportingPeriod);
    const pandemicDetection = await detectPandemicAlerts(outbreakAnalyses);
    
    // Categorize outbreaks
    const activeOutbreaks = outbreakAnalyses.filter(analysis => analysis.current.isOutbreak);
    const severeOutbreaks = activeOutbreaks.filter(analysis => 
      analysis.current.outbreakSeverity === 'severe' || analysis.current.outbreakSeverity === 'moderate'
    );
    
    // Group by city
    const cityOutbreaks = {};
    activeOutbreaks.forEach(analysis => {
      if (!cityOutbreaks[analysis.city]) {
        cityOutbreaks[analysis.city] = {
          city: analysis.city,
          outbreaks: [],
          totalCases: 0
        };
      }
      cityOutbreaks[analysis.city].outbreaks.push(analysis);
      cityOutbreaks[analysis.city].totalCases += analysis.current.cases;
    });

    // Group by disease
    const diseaseOutbreaks = {};
    activeOutbreaks.forEach(analysis => {
      if (!diseaseOutbreaks[analysis.disease]) {
        diseaseOutbreaks[analysis.disease] = {
          disease: analysis.disease,
          affectedCities: [],
          totalCases: 0,
          severities: []
        };
      }
      diseaseOutbreaks[analysis.disease].affectedCities.push(analysis.city);
      diseaseOutbreaks[analysis.disease].totalCases += analysis.current.cases;
      diseaseOutbreaks[analysis.disease].severities.push(analysis.current.outbreakSeverity);
    });

    return {
      reportingPeriod: reportingPeriod,
      timestamp: new Date(),
      summary: {
        totalAnalyses: outbreakAnalyses.length,
        activeOutbreaks: activeOutbreaks.length,
        severeOutbreaks: severeOutbreaks.length,
        citiesWithOutbreaks: Object.keys(cityOutbreaks).length,
        diseasesWithOutbreaks: Object.keys(diseaseOutbreaks).length
      },
      pandemicDetection: pandemicDetection,
      outbreaks: {
        all: outbreakAnalyses,
        active: activeOutbreaks,
        severe: severeOutbreaks,
        byCity: Object.values(cityOutbreaks).sort((a, b) => b.totalCases - a.totalCases),
        byDisease: Object.values(diseaseOutbreaks).sort((a, b) => b.totalCases - a.totalCases)
      }
    };
  } catch (error) {
    console.error('Error getting outbreak summary:', error);
    throw error;
  }
}

/**
 * Record a new disease report
 * @param {Object} reportData - Disease report data
 * @returns {Promise<Object>} - Created disease report
 */
async function recordDiseaseReport(reportData) {
  try {
    const diseaseReport = new DiseaseReport(reportData);
    return await diseaseReport.save();
  } catch (error) {
    console.error('Error recording disease report:', error);
    throw error;
  }
}

/**
 * Get disease reports for a specific city and time period
 * @param {string} city - City name
 * @param {string} disease - Disease name (optional)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of disease reports
 */
async function getDiseaseReports(city, disease = null, startDate = null, endDate = null) {
  try {
    const query = { city: city };
    
    if (disease) {
      query.disease = disease;
    }
    
    if (startDate || endDate) {
      query.periodStartDate = {};
      if (startDate) query.periodStartDate.$gte = startDate;
      if (endDate) query.periodStartDate.$lte = endDate;
    }

    return await DiseaseReport.find(query)
      .sort({ periodStartDate: -1 })
      .limit(100);
  } catch (error) {
    console.error('Error getting disease reports:', error);
    throw error;
  }
}

module.exports = {
  calculateBaseline,
  getAllOutbreakAnalysis,
  detectPandemicAlerts,
  getOutbreakSummary,
  recordDiseaseReport,
  getDiseaseReports
};
