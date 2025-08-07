// src/services/dailyReminderService.js
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { sendWhatsAppDirect, sendBulkWhatsApp } from './whatsappService';
import { sendDailyReminder, sendBulkEmails } from './emailService';

/**
 * Daily Reminder Service
 * Handles sending daily reminders to employees with flexible options
 */

// ============================================
// REMINDER CONFIGURATION
// ============================================

export const REMINDER_TYPES = {
  ALL_EMPLOYEES: 'all',
  SELECTED_EMPLOYEES: 'selected',
  SINGLE_EMPLOYEE: 'single',
  BY_DEPARTMENT: 'department',
  BY_STATUS: 'status'
};

export const REMINDER_METHODS = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  BOTH: 'both',
  WHATSAPP_ONLY: 'whatsapp_only',
  EMAIL_ONLY: 'email_only'
};

// ============================================
// CORE REMINDER FUNCTIONS
// ============================================

/**
 * Get all active employees
 * @returns {Array} Array of employee objects
 */
export const getAllActiveEmployees = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('accountStatus', '==', 'active'),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching active employees:', error);
    return [];
  }
};

/**
 * Get employees by department
 * @param {string} department - Department name
 * @returns {Array} Array of employee objects
 */
export const getEmployeesByDepartment = async (department) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('accountStatus', '==', 'active'),
      where('isActive', '==', true),
      where('department', '==', department)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    return [];
  }
};

/**
 * Get single employee by ID
 * @param {string} employeeId - Employee ID
 * @returns {Object} Employee object or null
 */
export const getEmployeeById = async (employeeId) => {
  try {
    const docRef = doc(db, 'users', employeeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    return null;
  }
};

// ============================================
// REMINDER SENDING FUNCTIONS
// ============================================

/**
 * Send reminder to single employee
 * @param {Object} employee - Employee object
 * @param {string} method - Reminder method
 * @returns {Object} Result object
 */
export const sendReminderToEmployee = async (employee, method = 'both') => {
  const results = {
    employeeId: employee.id,
    employeeName: employee.name,
    whatsapp: null,
    email: null,
    success: false
  };

  try {
    // WhatsApp reminder
    if (method === 'whatsapp' || method === 'both' || method === 'whatsapp_only') {
      if (employee.phoneNumber) {
        const whatsappResult = sendDailyReminder(employee.phoneNumber, employee.name);
        results.whatsapp = {
          success: true,
          link: whatsappResult
        };
      } else {
        results.whatsapp = {
          success: false,
          error: 'No phone number available'
        };
      }
    }

    // Email reminder
    if (method === 'email' || method === 'both' || method === 'email_only') {
      if (employee.email) {
        const emailResult = await sendDailyReminder(employee.email, employee.name);
        results.email = emailResult;
      } else {
        results.email = {
          success: false,
          error: 'No email available'
        };
      }
    }

    // Log reminder sent
    await logReminderSent(employee.id, method, results);

    results.success = true;
    return results;

  } catch (error) {
    console.error('Error sending reminder to employee:', error);
    results.success = false;
    results.error = error.message;
    return results;
  }
};

/**
 * Send bulk reminders to multiple employees
 * @param {Array} employees - Array of employee objects
 * @param {string} method - Reminder method
 * @returns {Array} Array of result objects
 */
export const sendBulkReminders = async (employees, method = 'both') => {
  const results = [];
  const whatsappRecipients = [];
  const emailRecipients = [];

  // Separate recipients by method
  employees.forEach(employee => {
    if (method === 'whatsapp' || method === 'both' || method === 'whatsapp_only') {
      if (employee.phoneNumber) {
        whatsappRecipients.push({
          phone: employee.phoneNumber,
          name: employee.name
        });
      }
    }

    if (method === 'email' || method === 'both' || method === 'email_only') {
      if (employee.email) {
        emailRecipients.push({
          email: employee.email,
          name: employee.name
        });
      }
    }
  });

  // Send WhatsApp messages
  if (whatsappRecipients.length > 0) {
    const whatsappResults = sendBulkWhatsApp(whatsappRecipients, 
      `Pagi {name}! Jangan lupa check-in hari ini ya. Jam kerja: 08:00-17:00 WIB`);
    
    results.push(...whatsappResults);
  }

  // Send email messages
  if (emailRecipients.length > 0) {
    const emailResults = await sendBulkEmails(emailRecipients, 
      'Reminder: Check-in Hari Ini',
      'Pagi {name}! Jangan lupa check-in hari ini ya. Jam kerja: 08:00-17:00 WIB');
    
    results.push(...emailResults);
  }

  // Log bulk reminder
  await logBulkReminderSent(employees.length, method, results);

  return results;
};

// ============================================
// MAIN REMINDER FUNCTION
// ============================================

/**
 * Send daily reminders with flexible options
 * @param {Object} options - Reminder options
 * @returns {Object} Result object
 */
export const sendDailyReminders = async (options = {}) => {
  const {
    type = 'all',
    method = 'both',
    selectedEmployees = [],
    department = '',
    employeeId = '',
    customMessage = ''
  } = options;

  let employees = [];
  const results = {
    type,
    method,
    totalEmployees: 0,
    successCount: 0,
    failedCount: 0,
    details: []
  };

  try {
    // Get employees based on type
    switch (type) {
      case 'all':
        employees = await getAllActiveEmployees();
        break;
      
      case 'selected':
        if (selectedEmployees.length === 0) {
          throw new Error('No employees selected');
        }
        // selectedEmployees is an array of employee IDs, we need to get the full employee objects
        const allEmployees = await getAllActiveEmployees();
        employees = allEmployees.filter(emp => selectedEmployees.includes(emp.id));
        if (employees.length === 0) {
          throw new Error('No valid employees found from selected IDs');
        }
        break;
      
      case 'single':
        if (!employeeId) {
          throw new Error('Employee ID is required for single reminder');
        }
        const employee = await getEmployeeById(employeeId);
        if (!employee) {
          throw new Error('Employee not found');
        }
        employees = [employee];
        break;
      
      case 'department':
        if (!department) {
          throw new Error('Department is required for department reminder');
        }
        employees = await getEmployeesByDepartment(department);
        break;
      
      default:
        throw new Error('Invalid reminder type');
    }

    results.totalEmployees = employees.length;

    if (employees.length === 0) {
      return {
        ...results,
        error: 'No employees found for the specified criteria'
      };
    }

    // Send reminders
    if (employees.length === 1) {
      // Single employee
      const result = await sendReminderToEmployee(employees[0], method);
      results.details.push(result);
      results.successCount = result.success ? 1 : 0;
      results.failedCount = result.success ? 0 : 1;
    } else {
      // Multiple employees
      const bulkResults = await sendBulkReminders(employees, method);
      results.details = bulkResults;
      results.successCount = bulkResults.filter(r => r.status === 'sent').length;
      results.failedCount = bulkResults.filter(r => r.status === 'failed').length;
    }

    return results;

  } catch (error) {
    console.error('Error sending daily reminders:', error);
    return {
      ...results,
      error: error.message
    };
  }
};

// ============================================
// LOGGING FUNCTIONS
// ============================================

/**
 * Log reminder sent to database
 * @param {string} employeeId - Employee ID
 * @param {string} method - Reminder method
 * @param {Object} result - Result object
 */
export const logReminderSent = async (employeeId, method, result) => {
  try {
    await addDoc(collection(db, 'reminderLogs'), {
      employeeId,
      method,
      result,
      timestamp: serverTimestamp(),
      type: 'daily_reminder'
    });
  } catch (error) {
    console.error('Error logging reminder:', error);
  }
};

/**
 * Log bulk reminder sent to database
 * @param {number} totalEmployees - Total employees
 * @param {string} method - Reminder method
 * @param {Array} results - Results array
 */
export const logBulkReminderSent = async (totalEmployees, method, results) => {
  try {
    await addDoc(collection(db, 'reminderLogs'), {
      type: 'bulk_daily_reminder',
      totalEmployees,
      method,
      results,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging bulk reminder:', error);
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get reminder statistics
 * @returns {Object} Statistics object
 */
export const getReminderStatistics = async () => {
  try {
    const totalEmployees = await getAllActiveEmployees();
    const departments = [...new Set(totalEmployees.map(emp => emp.department))];
    
    return {
      totalActiveEmployees: totalEmployees.length,
      departments: departments,
      departmentsWithEmployees: departments.map(dept => ({
        name: dept,
        count: totalEmployees.filter(emp => emp.department === dept).length
      }))
    };
  } catch (error) {
    console.error('Error getting reminder statistics:', error);
    return {
      totalActiveEmployees: 0,
      departments: [],
      departmentsWithEmployees: []
    };
  }
};

/**
 * Validate reminder options
 * @param {Object} options - Reminder options
 * @returns {Object} Validation result
 */
export const validateReminderOptions = (options) => {
  const errors = [];

  // Debug logging
  console.log('validateReminderOptions - Input options:', options);
  console.log('validateReminderOptions - REMINDER_TYPES:', REMINDER_TYPES);
  console.log('validateReminderOptions - REMINDER_METHODS:', REMINDER_METHODS);

  if (!options.type) {
    errors.push('Reminder type is required');
  } else {
    // Check if type is valid by checking if it exists in REMINDER_TYPES values
    const validTypes = Object.values(REMINDER_TYPES);
    console.log('validateReminderOptions - Valid types:', validTypes);
    console.log('validateReminderOptions - Input type:', options.type);
    console.log('validateReminderOptions - Type check result:', validTypes.includes(options.type));
    
    if (!validTypes.includes(options.type)) {
      errors.push(`Invalid reminder type: "${options.type}". Valid types are: ${validTypes.join(', ')}`);
    }
  }

  if (!options.method) {
    errors.push('Reminder method is required');
  } else {
    // Check if method is valid by checking if it exists in REMINDER_METHODS values
    const validMethods = Object.values(REMINDER_METHODS);
    console.log('validateReminderOptions - Valid methods:', validMethods);
    console.log('validateReminderOptions - Input method:', options.method);
    console.log('validateReminderOptions - Method check result:', validMethods.includes(options.method));
    
    if (!validMethods.includes(options.method)) {
      errors.push(`Invalid reminder method: "${options.method}". Valid methods are: ${validMethods.join(', ')}`);
    }
  }

  if (options.type === 'selected' && (!options.selectedEmployees || options.selectedEmployees.length === 0)) {
    errors.push('Selected employees are required for selected type');
  }

  if (options.type === 'single' && !options.employeeId) {
    errors.push('Employee ID is required for single reminder');
  }

  if (options.type === 'department' && !options.department) {
    errors.push('Department is required for department reminder');
  }

  console.log('validateReminderOptions - Final errors:', errors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  REMINDER_TYPES,
  REMINDER_METHODS,
  getAllActiveEmployees,
  getEmployeesByDepartment,
  getEmployeeById,
  sendReminderToEmployee,
  sendBulkReminders,
  sendDailyReminders,
  getReminderStatistics,
  validateReminderOptions,
  logReminderSent,
  logBulkReminderSent
}; 