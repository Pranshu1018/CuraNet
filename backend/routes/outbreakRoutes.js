const express = require('express');
const router = express.Router();
const { 
  calculateBaseline,
  getAllOutbreakAnalysis,
  detectPandemicAlerts,
  getOutbreakSummary,
  recordDiseaseReport,
  getDiseaseReports
} = require('../services/outbreakDetectionService');

// POST /outbreak/report - Record a new disease report
router.post('/report', async (req, res) => {
  try {
    const {
      city,
      disease,
      cases,
      reportingPeriod,
      periodStartDate,
      periodEndDate,
      reportingHospital,
      reportedBy,
      severity,
      ageGroup,
      notes
    } = req.body;

    // Validate required fields
    if (!city || !disease || !cases || !reportingPeriod || !periodStartDate || !periodEndDate || !reportingHospital || !reportedBy || !severity) {
      return res.status(400).json({ 
        error: 'Missing required fields: city, disease, cases, reportingPeriod, periodStartDate, periodEndDate, reportingHospital, reportedBy, severity' 
      });
    }

    // Validate cases
    if (cases < 0) {
      return res.status(400).json({ error: 'Cases must be a non-negative number' });
    }

    // Validate reporting period
    const validPeriods = ['daily', 'weekly', 'monthly'];
    if (!validPeriods.includes(reportingPeriod)) {
      return res.status(400).json({ error: 'Invalid reporting period. Must be: daily, weekly, or monthly' });
    }

    // Validate severity
    const validSeverities = ['mild', 'moderate', 'severe', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ error: 'Invalid severity. Must be: mild, moderate, severe, or critical' });
    }

    // Create disease report
    const diseaseReport = await recordDiseaseReport({
      city,
      disease,
      cases,
      reportingPeriod,
      periodStartDate: new Date(periodStartDate),
      periodEndDate: new Date(periodEndDate),
      reportingHospital,
      reportedBy,
      severity,
      ageGroup,
      notes
    });

    res.status(201).json({
      message: 'Disease report recorded successfully',
      report: diseaseReport,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error recording disease report:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /outbreak/summary - Get comprehensive outbreak analysis
router.get('/summary', async (req, res) => {
  try {
    const { reportingPeriod = 'weekly' } = req.query;
    
    console.log('Hit: Outbreak Summary Endpoint');
    
    const outbreakSummary = await getOutbreakSummary(reportingPeriod);
    
    res.json(outbreakSummary);
  } catch (error) {
    console.error('Error fetching outbreak summary:', error);
    res.status(500).json({ error: 'Failed to fetch outbreak summary' });
  }
});

// GET /outbreak/city/:city/disease/:disease - Get specific outbreak analysis
router.get('/city/:city/disease/:disease', async (req, res) => {
  try {
    const { city, disease } = req.params;
    const { reportingPeriod = 'weekly' } = req.query;
    
    const baselineAnalysis = await calculateBaseline(city, disease, reportingPeriod);
    
    res.json({
      city,
      disease,
      reportingPeriod,
      analysis: baselineAnalysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting outbreak analysis:', error);
    res.status(500).json({ error: 'Failed to get outbreak analysis' });
  }
});

// GET /outbreak/city/:city - Get all outbreaks in a specific city
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { reportingPeriod = 'weekly', disease = null } = req.query;
    
    const reports = await getDiseaseReports(city, disease);
    
    // Get outbreak analysis for each disease in the city
    const uniqueDiseases = [...new Set(reports.map(report => report.disease))];
    const outbreakAnalyses = [];
    
    for (const diseaseName of uniqueDiseases) {
      try {
        const analysis = await calculateBaseline(city, diseaseName, reportingPeriod);
        if (analysis.hasEnoughData) {
          outbreakAnalyses.push(analysis);
        }
      } catch (error) {
        console.error(`Error analyzing ${diseaseName} in ${city}:`, error);
      }
    }
    
    const activeOutbreaks = outbreakAnalyses.filter(analysis => analysis.current.isOutbreak);
    
    res.json({
      city,
      reportingPeriod,
      summary: {
        totalDiseases: uniqueDiseases.length,
        activeOutbreaks: activeOutbreaks.length,
        totalCases: activeOutbreaks.reduce((sum, analysis) => sum + analysis.current.cases, 0)
      },
      outbreaks: outbreakAnalyses,
      activeOutbreaks: activeOutbreaks,
      reports: reports,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting city outbreaks:', error);
    res.status(500).json({ error: 'Failed to get city outbreaks' });
  }
});

// GET /outbreak/disease/:disease - Get outbreaks for specific disease across all cities
router.get('/disease/:disease', async (req, res) => {
  try {
    const { disease } = req.params;
    const { reportingPeriod = 'weekly' } = req.query;
    
    const allAnalyses = await getAllOutbreakAnalysis(reportingPeriod);
    const diseaseAnalyses = allAnalyses.filter(analysis => 
      analysis.disease.toLowerCase() === disease.toLowerCase()
    );
    
    const activeOutbreaks = diseaseAnalyses.filter(analysis => analysis.current.isOutbreak);
    
    res.json({
      disease,
      reportingPeriod,
      summary: {
        totalCities: diseaseAnalyses.length,
        activeOutbreaks: activeOutbreaks.length,
        totalCases: activeOutbreaks.reduce((sum, analysis) => sum + analysis.current.cases, 0),
        averageCases: diseaseAnalyses.length > 0 ? 
          Math.round((diseaseAnalyses.reduce((sum, analysis) => sum + analysis.current.cases, 0) / diseaseAnalyses.length) * 100) / 100 : 0
      },
      outbreaks: diseaseAnalyses,
      activeOutbreaks: activeOutbreaks,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting disease outbreaks:', error);
    res.status(500).json({ error: 'Failed to get disease outbreaks' });
  }
});

// GET /outbreak/pandemic-alerts - Get current pandemic alerts
router.get('/pandemic-alerts', async (req, res) => {
  try {
    const { reportingPeriod = 'weekly' } = req.query;
    
    const outbreakAnalyses = await getAllOutbreakAnalysis(reportingPeriod);
    const pandemicDetection = await detectPandemicAlerts(outbreakAnalyses);
    
    res.json({
      reportingPeriod,
      pandemicDetection: pandemicDetection,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting pandemic alerts:', error);
    res.status(500).json({ error: 'Failed to get pandemic alerts' });
  }
});

// GET /outbreak/reports - Get disease reports with filters
router.get('/reports', async (req, res) => {
  try {
    const { 
      city, 
      disease, 
      startDate, 
      endDate, 
      reportingPeriod,
      severity 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (city) query.city = city;
    if (disease) query.disease = disease;
    if (reportingPeriod) query.reportingPeriod = reportingPeriod;
    if (severity) query.severity = severity;
    
    if (startDate || endDate) {
      query.periodStartDate = {};
      if (startDate) query.periodStartDate.$gte = new Date(startDate);
      if (endDate) query.periodStartDate.$lte = new Date(endDate);
    }
    
    const reports = await DiseaseReport.find(query)
      .sort({ periodStartDate: -1 })
      .limit(200);
    
    res.json({
      reports: reports,
      count: reports.length,
      filters: { city, disease, startDate, endDate, reportingPeriod, severity },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting disease reports:', error);
    res.status(500).json({ error: 'Failed to get disease reports' });
  }
});

// GET /outbreak/statistics - Get overall outbreak statistics
router.get('/statistics', async (req, res) => {
  try {
    const { reportingPeriod = 'weekly' } = req.query;
    
    const outbreakSummary = await getOutbreakSummary(reportingPeriod);
    
    // Calculate additional statistics
    const allReports = await DiseaseReport.find({
      reportingPeriod: reportingPeriod
    });
    
    const totalCases = allReports.reduce((sum, report) => sum + report.cases, 0);
    const uniqueCities = [...new Set(allReports.map(report => report.city))];
    const uniqueDiseases = [...new Set(allReports.map(report => report.disease))];
    
    // Severity breakdown
    const severityBreakdown = allReports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + report.cases;
      return acc;
    }, {});
    
    res.json({
      reportingPeriod,
      overview: {
        totalReports: allReports.length,
        totalCases: totalCases,
        uniqueCities: uniqueCities.length,
        uniqueDiseases: uniqueDiseases.length
      },
      severityBreakdown: severityBreakdown,
      outbreakSummary: outbreakSummary,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting outbreak statistics:', error);
    res.status(500).json({ error: 'Failed to get outbreak statistics' });
  }
});

module.exports = router;
