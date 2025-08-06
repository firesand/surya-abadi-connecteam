// src/components/Admin/MonthlyReports.jsx
import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { sendMonthlyReportWhatsApp } from '../../services/whatsappService';
import { sendMonthlyReport } from '../../services/emailService';

function MonthlyReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employeesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        where('accountStatus', '==', 'active')
      );
      const snapshot = await getDocs(employeesQuery);
      const employeesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get date range for selected month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      // Format dates for query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch attendance records for the month
      const attendanceQuery = query(
        collection(db, 'attendances'),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr),
        orderBy('date', 'asc')
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendances = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAttendanceData(attendances);

      // Process data for report
      const employeeAttendance = {};
      const dailyAttendance = {};
      let totalLate = 0;
      let totalOnTime = 0;
      let totalAbsent = 0;

      // Initialize employee attendance tracking
      employees.forEach(emp => {
        employeeAttendance[emp.id] = {
          name: emp.name,
          email: emp.email,
          department: emp.department || 'N/A',
          position: emp.position || 'N/A',
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          totalWorkHours: 0,
          attendanceRate: 0,
          records: []
        };
      });

      // Calculate working days (exclude weekends)
      let workingDays = 0;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) { // Not Sunday or Saturday
          workingDays++;
          const dateStr = d.toISOString().split('T')[0];
          dailyAttendance[dateStr] = {
            present: 0,
            late: 0,
            absent: 0
          };
        }
      }

      // Process attendance records
      attendances.forEach(record => {
        const empId = record.userId;
        const date = record.date;

        if (employeeAttendance[empId]) {
          employeeAttendance[empId].presentDays++;
          employeeAttendance[empId].records.push(record);

          if (record.status === 'late') {
            employeeAttendance[empId].lateDays++;
            totalLate++;
          } else {
            totalOnTime++;
          }

          // Calculate work hours
          if (record.checkIn && record.checkOut) {
            const checkIn = record.checkIn.toDate ? record.checkIn.toDate() : new Date(record.checkIn);
            const checkOut = record.checkOut.toDate ? record.checkOut.toDate() : new Date(record.checkOut);
            const hours = (checkOut - checkIn) / (1000 * 60 * 60);
            employeeAttendance[empId].totalWorkHours += hours;
          }

          // Update daily attendance
          if (dailyAttendance[date]) {
            dailyAttendance[date].present++;
            if (record.status === 'late') {
              dailyAttendance[date].late++;
            }
          }
        }
      });

      // Calculate absent days and attendance rate
      Object.keys(employeeAttendance).forEach(empId => {
        const emp = employeeAttendance[empId];
        emp.absentDays = workingDays - emp.presentDays;
        emp.attendanceRate = workingDays > 0
          ? ((emp.presentDays / workingDays) * 100).toFixed(1)
          : 0;
        totalAbsent += emp.absentDays;
      });

      // Find perfect attendance
      const perfectAttendance = Object.values(employeeAttendance).filter(
        emp => emp.presentDays === workingDays && emp.lateDays === 0
      );

      // Find most punctual employees
      const mostPunctual = Object.values(employeeAttendance)
        .sort((a, b) => a.lateDays - b.lateDays)
        .slice(0, 5);

      // Calculate averages
      const totalEmployees = employees.length;
      const avgAttendance = totalEmployees > 0
        ? (Object.values(employeeAttendance).reduce((sum, emp) =>
            sum + parseFloat(emp.attendanceRate), 0) / totalEmployees).toFixed(1)
        : 0;

      const avgWorkHours = totalEmployees > 0
        ? (Object.values(employeeAttendance).reduce((sum, emp) =>
            sum + emp.totalWorkHours, 0) / (totalEmployees * workingDays)).toFixed(1)
        : 0;

      // Compile report data
      const report = {
        month: getMonthName(selectedMonth),
        year: selectedYear,
        period: `${startDateStr} - ${endDateStr}`,
        totalEmployees,
        totalWorkDays: workingDays,
        totalAttendanceRecords: attendances.length,
        totalPresent: totalOnTime + totalLate,
        totalOnTime,
        totalLate,
        totalAbsent,
        avgAttendance: `${avgAttendance}%`,
        avgWorkHours: `${avgWorkHours} hours`,
        perfectAttendance,
        mostPunctual,
        employeeDetails: Object.values(employeeAttendance),
        dailyBreakdown: dailyAttendance,
        generatedAt: new Date().toLocaleString('id-ID')
      };

      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) {
      alert('Please generate report first');
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['MONTHLY ATTENDANCE REPORT'],
      [''],
      ['Period', `${reportData.month} ${reportData.year}`],
      ['Date Range', reportData.period],
      ['Generated', reportData.generatedAt],
      [''],
      ['SUMMARY STATISTICS'],
      ['Total Employees', reportData.totalEmployees],
      ['Working Days', reportData.totalWorkDays],
      ['Total Attendance Records', reportData.totalAttendanceRecords],
      [''],
      ['Average Attendance Rate', reportData.avgAttendance],
      ['Average Work Hours/Day', reportData.avgWorkHours],
      ['Total On Time', reportData.totalOnTime],
      ['Total Late', reportData.totalLate],
      ['Total Absent Days', reportData.totalAbsent],
      [''],
      ['Perfect Attendance Count', reportData.perfectAttendance.length]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sheet 2: Employee Details
    const employeeHeaders = [
      'Name', 'Email', 'Department', 'Position',
      'Present Days', 'Late Days', 'Absent Days',
      'Attendance Rate (%)', 'Total Work Hours'
    ];
    const employeeRows = reportData.employeeDetails.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      emp.position,
      emp.presentDays,
      emp.lateDays,
      emp.absentDays,
      emp.attendanceRate,
      emp.totalWorkHours.toFixed(2)
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([employeeHeaders, ...employeeRows]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Employee Details');

    // Sheet 3: Daily Attendance Records
    const attendanceHeaders = [
      'Date', 'Employee Name', 'Check In', 'Check Out',
      'Status', 'Work Hours', 'Location'
    ];
    const attendanceRows = attendanceData.map(record => {
      const checkIn = record.checkIn?.toDate ? record.checkIn.toDate() : new Date(record.checkIn);
      const checkOut = record.checkOut?.toDate ? record.checkOut.toDate() : new Date(record.checkOut);
      const workHours = record.checkOut
        ? ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2)
        : 'N/A';

      return [
        record.date,
        record.userName,
        checkIn.toLocaleTimeString('id-ID'),
        record.checkOut ? checkOut.toLocaleTimeString('id-ID') : 'Not checked out',
        record.status === 'ontime' ? 'On Time' : 'Late',
        workHours,
        record.location || 'N/A'
      ];
    });
    const ws3 = XLSX.utils.aoa_to_sheet([attendanceHeaders, ...attendanceRows]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Attendance Records');

    // Sheet 4: Perfect Attendance
    if (reportData.perfectAttendance.length > 0) {
      const perfectHeaders = ['Name', 'Email', 'Department', 'Position'];
      const perfectRows = reportData.perfectAttendance.map(emp => [
        emp.name, emp.email, emp.department, emp.position
      ]);
      const ws4 = XLSX.utils.aoa_to_sheet([perfectHeaders, ...perfectRows]);
      XLSX.utils.book_append_sheet(wb, ws4, 'Perfect Attendance');
    }

    // Save file
    const fileName = `Attendance_Report_${reportData.month}_${reportData.year}.xlsx`;
    XLSX.writeFile(wb, fileName);

    alert(`Report exported successfully as ${fileName}`);
  };

  const sendReportNotifications = async () => {
    if (!reportData) {
      alert('Please generate report first');
      return;
    }

    const adminPhone = '081234567890'; // Replace with actual admin phone
    const adminEmail = 'admin@suryaabadi.com'; // Replace with actual admin email

    try {
      // Send WhatsApp notification
      sendMonthlyReportWhatsApp(adminPhone, reportData);

      // Send Email notification if configured
      const emailResult = await sendMonthlyReport(adminEmail, {
        ...reportData,
        recipientName: 'Admin'
      });

      if (emailResult.success) {
        alert('✅ Report notifications sent successfully!');
      } else {
        alert('⚠️ WhatsApp opened, but email failed. Please check email configuration.');
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Failed to send notifications');
    }
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Monthly Attendance Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={exportToExcel}
              disabled={!reportData}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 Export
            </button>
            <button
              onClick={sendReportNotifications}
              disabled={!reportData}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📨 Send
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-800">{reportData.totalEmployees}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Working Days</p>
              <p className="text-2xl font-bold text-gray-800">{reportData.totalWorkDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">{reportData.avgAttendance}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total Late</p>
              <p className="text-2xl font-bold text-orange-600">{reportData.totalLate}</p>
            </div>
          </div>

          {/* Perfect Attendance */}
          {reportData.perfectAttendance.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🏆 Perfect Attendance ({reportData.perfectAttendance.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reportData.perfectAttendance.map((emp, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {emp.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Details Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Attendance Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Present</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Late</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Absent</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Rate</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Avg Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.employeeDetails.map((emp, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.department}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-green-600 font-medium">{emp.presentDays}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-orange-600 font-medium">{emp.lateDays}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-red-600 font-medium">{emp.absentDays}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`font-medium ${
                          parseFloat(emp.attendanceRate) >= 90 ? 'text-green-600' :
                          parseFloat(emp.attendanceRate) >= 75 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {emp.attendanceRate}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-600">
                        {emp.presentDays > 0
                          ? (emp.totalWorkHours / emp.presentDays).toFixed(1)
                          : '0'}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MonthlyReports;
