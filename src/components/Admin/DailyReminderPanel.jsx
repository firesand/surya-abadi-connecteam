// src/components/Admin/DailyReminderPanel.jsx
import { useState, useEffect } from 'react';
import { 
  sendDailyReminders, 
  getAllActiveEmployees, 
  getEmployeesByDepartment,
  getReminderStatistics,
  validateReminderOptions,
  REMINDER_TYPES,
  REMINDER_METHODS 
} from '../../services/dailyReminderService';

function DailyReminderPanel() {
  console.log('🚀 DailyReminderPanel component loaded');
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statistics, setStatistics] = useState({});
  
  // Form state
  const [reminderType, setReminderType] = useState('all');
  const [reminderMethod, setReminderMethod] = useState('both');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Results state
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees and statistics
      const [employeesData, statsData] = await Promise.all([
        getAllActiveEmployees(),
        getReminderStatistics()
      ]);
      
      setEmployees(employeesData);
      setStatistics(statsData);
      setDepartments(statsData.departments || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    console.log('🔧 handleSendReminders called');
    console.log('🔧 Current state:', {
      reminderType,
      reminderMethod,
      selectedEmployees,
      selectedDepartment,
      selectedEmployeeId,
      customMessage
    });
    
    try {
      setLoading(true);
      setShowResults(false);
      
      // Debug: Log the values being sent
      console.log('Debug - Reminder Options:', {
        type: reminderType,
        method: reminderMethod,
        selectedEmployees,
        department: selectedDepartment,
        employeeId: selectedEmployeeId,
        customMessage
      });
      
      // Debug: Log REMINDER_TYPES values
      console.log('Debug - REMINDER_TYPES:', Object.values(REMINDER_TYPES));
      console.log('Debug - REMINDER_METHODS:', Object.values(REMINDER_METHODS));
      console.log('Debug - Type check:', Object.values(REMINDER_TYPES).includes(reminderType));
      console.log('Debug - Method check:', Object.values(REMINDER_METHODS).includes(reminderMethod));

      // Ensure values are valid before validation
      const sanitizedType = reminderType || 'all';
      const sanitizedMethod = reminderMethod || 'both';
      
      console.log('Debug - Sanitized values:', {
        type: sanitizedType,
        method: sanitizedMethod
      });

      // Validate options
      console.log('🔍 About to validate options:', {
        type: sanitizedType,
        method: sanitizedMethod,
        selectedEmployees,
        department: selectedDepartment,
        employeeId: selectedEmployeeId
      });

      const validation = validateReminderOptions({
        type: sanitizedType,
        method: sanitizedMethod,
        selectedEmployees,
        department: selectedDepartment,
        employeeId: selectedEmployeeId
      });

      console.log('🔍 Validation result:', validation);

      if (!validation.isValid) {
        console.error('❌ Validation errors:', validation.errors);
        alert('Validation errors:\n' + validation.errors.join('\n'));
        return;
      }

      // Prepare options
      const options = {
        type: sanitizedType,
        method: sanitizedMethod,
        selectedEmployees,
        department: selectedDepartment,
        employeeId: selectedEmployeeId,
        customMessage
      };

      // Send reminders
      const result = await sendDailyReminders(options);
      setResults(result);
      setShowResults(true);

      // Show success message
      if (result.successCount > 0) {
        alert(`Reminders sent successfully!\n\nTotal: ${result.totalEmployees}\nSuccess: ${result.successCount}\nFailed: ${result.failedCount}`);
      } else {
        alert('Failed to send reminders. Please check the results.');
      }

    } catch (error) {
      console.error('❌ Error sending reminders:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      });
      alert('Error sending reminders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelection = (employeeId, checked) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const getSelectedEmployeeNames = () => {
    return selectedEmployees
      .map(id => employees.find(emp => emp.id === id)?.name)
      .filter(name => name);
  };

  const resetForm = () => {
    setReminderType('all');
    setReminderMethod('both');
    setSelectedEmployees([]);
    setSelectedDepartment('');
    setSelectedEmployeeId('');
    setCustomMessage('');
    setResults(null);
    setShowResults(false);
  };

  console.log('🎨 DailyReminderPanel rendering with state:', {
    reminderType,
    reminderMethod,
    selectedEmployees: selectedEmployees.length,
    employees: employees.length,
    statistics
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Reminder System</h2>
          <p className="text-gray-600 mt-1">Send reminders to employees with flexible options</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Total Active: {statistics.totalActiveEmployees || 0}
          </div>
          <div className="text-sm text-gray-500">
            Departments: {departments.length}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {statistics.totalActiveEmployees || 0}
          </div>
          <div className="text-sm text-blue-600">Active Employees</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {departments.length}
          </div>
          <div className="text-sm text-green-600">Departments</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {reminderMethod === 'both' ? 'WhatsApp + Email' : reminderMethod}
          </div>
          <div className="text-sm text-purple-600">Reminder Method</div>
        </div>
      </div>

      {/* Reminder Configuration */}
      <div className="space-y-6">
        {/* Reminder Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(REMINDER_TYPES).map(([key, value]) => (
              <label key={value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reminderType"
                  value={value}
                  checked={reminderType === value}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">
                  {key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reminder Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(REMINDER_METHODS).map(([key, value]) => (
              <label key={value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reminderMethod"
                  value={value}
                  checked={reminderMethod === value}
                  onChange={(e) => setReminderMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">
                  {key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Conditional Fields Based on Type */}
        {reminderType === 'selected' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employees ({selectedEmployees.length} selected)
            </label>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-3">
              {employees.map(employee => (
                <label key={employee.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {employee.name} - {employee.department} ({employee.email})
                  </span>
                </label>
              ))}
            </div>
            {selectedEmployees.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {getSelectedEmployeeNames().join(', ')}
              </div>
            )}
          </div>
        )}

        {reminderType === 'single' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an employee...</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.department} ({employee.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {reminderType === 'department' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a department...</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept} ({statistics.departmentsWithEmployees?.find(d => d.name === dept)?.count || 0} employees)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Message (Optional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Leave empty to use default message..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSendReminders}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reminders'}
          </button>
          
          <button
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Display */}
      {showResults && results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Reminder Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{results.totalEmployees}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.successCount}</div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.failedCount}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{reminderMethod}</div>
              <div className="text-sm text-gray-600">Method</div>
            </div>
          </div>

          {results.error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-3">
              Error: {results.error}
            </div>
          )}

          {results.details && results.details.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              <h4 className="font-medium text-gray-700 mb-2">Details:</h4>
              {results.details.map((detail, index) => (
                <div key={index} className="text-sm p-2 bg-white rounded border mb-1">
                  <div className="font-medium">{detail.employeeName || detail.recipient}</div>
                  <div className="text-gray-600">
                    Status: {detail.status || (detail.success ? 'Success' : 'Failed')}
                  </div>
                  {detail.error && (
                    <div className="text-red-600 text-xs">{detail.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Department Statistics */}
      {departments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Department Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {statistics.departmentsWithEmployees?.map(dept => (
              <div key={dept.name} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-800">{dept.name}</div>
                <div className="text-sm text-gray-600">{dept.count} employees</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyReminderPanel; 