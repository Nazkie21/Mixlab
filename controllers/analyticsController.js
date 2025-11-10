import { Analytics } from '../models/analytics.js';

export const getDashboard = async (req, res) => {
  try {
    console.log(' [getDashboard] Fetching dashboard');
    const metrics = await Analytics.getDashboardSummary();
    res.json({
      message: 'Dashboard metrics retrieved',
      data: metrics
    });
  } catch (error) {
    console.error('[getDashboard] Error:', error.message);
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

export const getRevenue = async (req, res) => {
  try {
    const { startDate, endDate, instructorId } = req.query;
    console.log(' [getRevenue] Fetching revenue report:', { startDate, endDate, instructorId });
    
    const data = await Analytics.getRevenueReport({
      startDate,
      endDate,
      instructorId
    });
    
    res.json({
      message: 'Revenue report retrieved',
      ...data
    });
  } catch (error) {
    console.error(' [getRevenue] Error:', error.message);
    res.status(500).json({ message: 'Error fetching revenue', error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log(' [getBookings] Fetching booking statistics');
    
    const data = await Analytics.getBookingStatistics({
      startDate,
      endDate
    });
    
    res.json({
      message: 'Booking statistics retrieved',
      data
    });
  } catch (error) {
    console.error(' [getBookings] Error:', error.message);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

export const getStudentEngagement = async (req, res) => {
  try {
    console.log(' [getStudentEngagement] Fetching student engagement');
    const data = await Analytics.getStudentEngagement();
    
    res.json({
      message: 'Student engagement metrics retrieved',
      total_students: data.length,
      data
    });
  } catch (error) {
    console.error('[getStudentEngagement] Error:', error.message);
    res.status(500).json({ message: 'Error fetching engagement', error: error.message });
  }
};

export const getLearningPerformance = async (req, res) => {
  try {
    console.log('[getLearningPerformance] Fetching learning performance');
    const data = await Analytics.getLearningPerformance();
    
    res.json({
      message: 'Learning performance metrics retrieved',
      total_modules: data.length,
      data
    });
  } catch (error) {
    console.error('[getLearningPerformance] Error:', error.message);
    res.status(500).json({ message: 'Error fetching learning performance', error: error.message });
  }
};

export const getCustomerBehavior = async (req, res) => {
  try {
    console.log('[getCustomerBehavior] Fetching customer behavior');
    const data = await Analytics.getCustomerBehavior();
    
    res.json({
      message: 'Customer behavior analysis retrieved',
      total_customers: data.length,
      data
    });
  } catch (error) {
    console.error(' [getCustomerBehavior] Error:', error.message);
    res.status(500).json({ message: 'Error fetching customer behavior', error: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { format = 'json', reportType = 'dashboard' } = req.query;
    console.log(' [exportReport] Exporting report:', { format, reportType });
    
    let data;
    
    switch (reportType) {
      case 'revenue':
        data = await Analytics.getRevenueReport();
        break;
      case 'bookings':
        data = await Analytics.getBookingStatistics();
        break;
      case 'engagement':
        data = await Analytics.getStudentEngagement();
        break;
      case 'learning':
        data = await Analytics.getLearningPerformance();
        break;
      case 'behavior':
        data = await Analytics.getCustomerBehavior();
        break;
      default:
        data = await Analytics.getDashboardSummary();
    }
    
    if (format === 'csv') {
      const csv = convertToCSV(data.data || data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report_${reportType}_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        message: 'Report exported',
        format: 'json',
        reportType,
        data
      });
    }
  } catch (error) {
    console.error('[exportReport] Error:', error.message);
    res.status(500).json({ message: 'Error exporting report', error: error.message });
  }
};

export const logActivity = async (req, res) => {
  try {
    const { userId, action, resourceType, resourceId } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    
    console.log(' [logActivity] Logging:', { userId, action, resourceType });
    
    if (!action || !resourceType) {
      return res.status(400).json({ message: 'action and resourceType are required' });
    }
    
    const result = await Analytics.logActivity({
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent
    });
    
    res.status(201).json({ message: 'Activity logged', result });
  } catch (error) {
    console.error('[logActivity] Error:', error.message);
    res.status(500).json({ message: 'Error logging activity', error: error.message });
  }
};

function convertToCSV(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csv = [headers.join(',')];
  
  data.forEach(row => {
    csv.push(headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','));
  });
  
  return csv.join('\n');
}