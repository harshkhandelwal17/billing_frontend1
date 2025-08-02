import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, Clock, 
  User, Phone, Mail, MapPin, Calendar, DollarSign,
  UserCheck, UserX, Users, Award, AlertCircle, Eye,
  Filter, Download, FileText, TrendingUp, Coffee,
  CheckCircle, XCircle, PlayCircle, PauseCircle,
  BarChart3, PieChart, Activity, Settings
} from 'lucide-react';

const EmployeeManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    role: 'waiter',
    department: 'service',
    salary: { base: '', overtime: '', bonus: '', deductions: '' },
    payrollType: 'monthly',
    hourlyRate: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
      address: ''
    },
    shiftTiming: {
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      breakDuration: 60,
      weeklyOffs: []
    },
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    skills: [],
    qualification: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      accountHolderName: ''
    }
  });

  const API_BASE_URL = 'http://localhost:4000/api';

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Data fetching functions
  const fetchEmployees = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...filters
      });
      
      const data = await apiCall(`/employees?${params}`);
      setEmployees(data.data.employees || []);
      setStats(data.data.stats || {});
      setTotalPages(data.meta?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await apiCall('/employees/attendance/today');
      setTodayAttendance(data.data.attendanceSummary || []);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const data = await apiCall('/employees/stats/attendance');
      return data.data;
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchEmployees(currentPage, {
      search: searchTerm,
      role: selectedRole !== 'all' ? selectedRole : undefined,
      department: selectedDepartment !== 'all' ? selectedDepartment : undefined
    });
    fetchTodayAttendance();
  }, [currentPage, searchTerm, selectedRole, selectedDepartment]);

  // Employee operations
  const handleAddEmployee = async () => {
    try {
      const response = await apiCall('/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      await fetchEmployees(currentPage);
      setShowAddModal(false);
      resetForm();
      alert('Employee added successfully!');
    } catch (error) {
      alert('Failed to add employee: ' + error.message);
    }
  };

  const handleUpdateEmployee = async () => {
    try {
      await apiCall(`/employees/${editingEmployee._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      await fetchEmployees(currentPage);
      setEditingEmployee(null);
      resetForm();
      alert('Employee updated successfully!');
    } catch (error) {
      alert('Failed to update employee: ' + error.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    
    try {
      await apiCall(`/employees/${employeeId}`, { 
        method: 'DELETE',
        body: JSON.stringify({ reason: 'Administrative deactivation' })
      });
      
      await fetchEmployees(currentPage);
      alert('Employee deactivated successfully!');
    } catch (error) {
      alert('Failed to deactivate employee: ' + error.message);
    }
  };

  // Attendance operations
  const handleCheckIn = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/checkin`, { 
        method: 'POST',
        body: JSON.stringify({
          workLocation: 'dining',
          latitude: 0,
          longitude: 0,
          address: 'Restaurant Location'
        })
      });
      
      await fetchTodayAttendance();
      alert('Check-in successful!');
    } catch (error) {
      alert('Check-in failed: ' + error.message);
    }
  };

  const handleCheckOut = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/checkout`, { 
        method: 'POST',
        body: JSON.stringify({
          latitude: 0,
          longitude: 0,
          address: 'Restaurant Location'
        })
      });
      
      await fetchTodayAttendance();
      alert('Check-out successful!');
    } catch (error) {
      alert('Check-out failed: ' + error.message);
    }
  };

  const handleStartBreak = async (employeeId, type = 'other') => {
    try {
      await apiCall(`/employees/${employeeId}/break/start`, {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      
      await fetchTodayAttendance();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} break started!`);
    } catch (error) {
      alert('Failed to start break: ' + error.message);
    }
  };

  const handleEndBreak = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/break/end`, {
        method: 'POST'
      });
      
      await fetchTodayAttendance();
      alert('Break ended!');
    } catch (error) {
      alert('Failed to end break: ' + error.message);
    }
  };

  // View employee details
  const viewEmployeeDetails = async (employee) => {
    try {
      const data = await apiCall(`/employees/${employee._id}?attendanceDays=30`);
      setSelectedEmployee(data.data);
      setShowAttendanceModal(true);
    } catch (error) {
      alert('Failed to fetch employee details: ' + error.message);
    }
  };

  const viewSalaryDetails = async (employee) => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const data = await apiCall(`/employees/${employee._id}/salary/${month}/${year}`);
      setSelectedEmployee({ ...employee, salaryDetails: data.data });
      setShowSalaryModal(true);
    } catch (error) {
      alert('Failed to fetch salary details: ' + error.message);
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      role: 'waiter',
      department: 'service',
      salary: { base: '', overtime: '', bonus: '', deductions: '' },
      payrollType: 'monthly',
      hourlyRate: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
        address: ''
      },
      shiftTiming: {
        type: 'fixed',
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
        weeklyOffs: []
      },
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      skills: [],
      qualification: '',
      bankDetails: {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        accountHolderName: ''
      }
    });
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      alternatePhone: employee.alternatePhone || '',
      role: employee.role || 'waiter',
      department: employee.department || 'service',
      salary: {
        base: employee.salary?.base?.toString() || '',
        overtime: employee.salary?.overtime?.toString() || '',
        bonus: employee.salary?.bonus?.toString() || '',
        deductions: employee.salary?.deductions?.toString() || ''
      },
      payrollType: employee.payrollType || 'monthly',
      hourlyRate: employee.hourlyRate?.toString() || '',
      address: employee.address || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      emergencyContact: employee.emergencyContact || {
        name: '',
        phone: '',
        relationship: '',
        address: ''
      },
      shiftTiming: employee.shiftTiming || {
        type: 'fixed',
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
        weeklyOffs: []
      },
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      gender: employee.gender || '',
      bloodGroup: employee.bloodGroup || '',
      skills: employee.skills || [],
      qualification: employee.qualification || '',
      bankDetails: employee.bankDetails || {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        accountHolderName: ''
      }
    });
  };

  // Constants
  const roles = ['all', 'waiter', 'cook', 'chef', 'cashier', 'cleaner', 'manager', 'supervisor', 'host', 'bartender', 'delivery-boy', 'security'];
  const departments = ['all', 'kitchen', 'service', 'management', 'maintenance', 'security', 'delivery'];
  const breakTypes = ['lunch', 'tea', 'dinner', 'other'];
  
  const roleColors = {
    waiter: 'bg-blue-100 text-blue-800',
    cook: 'bg-orange-100 text-orange-800',
    chef: 'bg-red-100 text-red-800',
    cashier: 'bg-green-100 text-green-800',
    cleaner: 'bg-purple-100 text-purple-800',
    manager: 'bg-indigo-100 text-indigo-800',
    supervisor: 'bg-yellow-100 text-yellow-800',
    host: 'bg-pink-100 text-pink-800',
    bartender: 'bg-teal-100 text-teal-800',
    'delivery-boy': 'bg-cyan-100 text-cyan-800',
    security: 'bg-gray-100 text-gray-800'
  };

  // Dashboard Component
  const Dashboard = () => {
    const [attendanceStats, setAttendanceStats] = useState(null);

    useEffect(() => {
      fetchAttendanceStats().then(setAttendanceStats);
    }, []);

    const presentToday = todayAttendance.filter(att => att.isPresent).length;
    const absentToday = todayAttendance.filter(att => !att.isPresent).length;
    const totalEmployees = employees.length;
    const attendancePercentage = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-800">{totalEmployees}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{presentToday}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{absentToday}</p>
              </div>
              <UserX className="w-12 h-12 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{attendancePercentage}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Today's Attendance Summary */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Today's Attendance</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAttendance.slice(0, 6).map(emp => {
                const isOnBreak = emp.onBreak || false;
                
                return (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{emp.name}</p>
                        <p className="text-sm text-gray-600">{emp.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {emp.isPresent ? (
                        <>
                          {isOnBreak ? (
                            <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              On Break
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Present
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Absent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {todayAttendance.length > 6 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All ({todayAttendance.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Department Breakdown */}
        {attendanceStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Department Overview</h2>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(attendanceStats.departmentSummary || {}).map(([dept, data]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 capitalize">{dept}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {data.present}/{data.total}
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${data.total > 0 ? (data.present / data.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Employee</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  <span>Manage Attendance</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>View Reports</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Employee Card Component
  const EmployeeCard = ({ employee }) => {
    const attendance = todayAttendance.find(att => att.id === employee._id);
    const isOnBreak = attendance?.onBreak || false;
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 ${
        !employee.isActive ? 'opacity-75' : ''
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{employee.name}</h3>
                <p className="text-sm text-gray-600">{employee.employeeId}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[employee.role] || 'bg-gray-100 text-gray-800'}`}>
              {employee.role}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>₹{employee.salary?.base?.toLocaleString()}/month</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="capitalize">{employee.department}</span>
            </div>
          </div>

          {/* Attendance Status */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {attendance?.isPresent ? (
                isOnBreak ? (
                  <Coffee className="w-5 h-5 text-yellow-600" />
                ) : (
                  <UserCheck className="w-5 h-5 text-green-600" />
                )
              ) : (
                <UserX className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {attendance?.isPresent 
                  ? (isOnBreak ? 'On Break' : 'Present') 
                  : 'Absent'
                }
              </span>
            </div>
            {attendance?.loginTime && (
              <span className="text-xs text-gray-600">
                In: {new Date(attendance.loginTime).toLocaleTimeString('en-US', { 
                  hour12: true, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Attendance Actions */}
            <div className="flex space-x-2">
              {attendance?.isPresent ? (
                <>
                  {isOnBreak ? (
                    <button
                      onClick={() => handleEndBreak(employee._id)}
                      className="flex-1 bg-orange-100 text-orange-700 py-2 px-3 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                    >
                      End Break
                    </button>
                  ) : (
                    <div className="flex space-x-1 flex-1">
                      <button
                        onClick={() => handleStartBreak(employee._id, 'lunch')}
                        className="flex-1 bg-yellow-100 text-yellow-700 py-2 px-2 rounded-lg hover:bg-yellow-200 transition-colors text-xs font-medium"
                        title="Lunch Break"
                      >
                        Lunch
                      </button>
                      <button
                        onClick={() => handleStartBreak(employee._id, 'tea')}
                        className="flex-1 bg-green-100 text-green-700 py-2 px-2 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
                        title="Tea Break"
                      >
                        Tea
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleCheckOut(employee._id)}
                    disabled={attendance.logoutTime}
                    className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {attendance.logoutTime ? 'Checked Out' : 'Check Out'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleCheckIn(employee._id)}
                  className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Check In
                </button>
              )}
            </div>

            {/* View Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => viewEmployeeDetails(employee)}
                className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              
              <button
                onClick={() => viewSalaryDetails(employee)}
                className="flex-1 bg-purple-100 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <DollarSign className="w-4 h-4" />
                <span>Salary</span>
              </button>
            </div>

            {/* Management Actions */}
            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => handleEdit(employee)}
                className="flex-1 flex items-center justify-center py-2 px-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              
              <button
                onClick={() => handleDeleteEmployee(employee._id)}
                className="flex-1 flex items-center justify-center py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Employee Form Component
  const EmployeeForm = ({ isModal = false }) => (
    <div className={isModal ? 'space-y-4 max-h-96 overflow-y-auto' : 'space-y-6'}>
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternate Phone
            </label>
            <input
              type="tel"
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter alternate phone"
            />
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {roles.filter(role => role !== 'all').map(role => (
                <option key={role} value={role}>
                  {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {departments.filter(dept => dept !== 'all').map(dept => (
                <option key={dept} value={dept}>
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payroll Type *
            </label>
            <select
              value={formData.payrollType}
              onChange={(e) => setFormData({ ...formData, payrollType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salary Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Salary (₹) *
            </label>
            <input
              type="number"
              value={formData.salary.base}
              onChange={(e) => setFormData({ 
                ...formData, 
                salary: { ...formData.salary, base: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter base salary"
              min="0"
              required
            />
          </div>
          
          {formData.payrollType === 'hourly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (₹)
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter hourly rate"
                min="0"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overtime Rate (₹)
            </label>
            <input
              type="number"
              value={formData.salary.overtime}
              onChange={(e) => setFormData({ 
                ...formData, 
                salary: { ...formData.salary, overtime: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter overtime rate"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Bonus (₹)
            </label>
            <input
              type="number"
              value={formData.salary.bonus}
              onChange={(e) => setFormData({ 
                ...formData, 
                salary: { ...formData.salary, bonus: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter monthly bonus"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Shift Timing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Shift Timing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={formData.shiftTiming.startTime}
              onChange={(e) => setFormData({ 
                ...formData, 
                shiftTiming: { ...formData.shiftTiming, startTime: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.shiftTiming.endTime}
              onChange={(e) => setFormData({ 
                ...formData, 
                shiftTiming: { ...formData.shiftTiming, endTime: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Break Duration (mins)
            </label>
            <input
              type="number"
              value={formData.shiftTiming.breakDuration}
              onChange={(e) => setFormData({ 
                ...formData, 
                shiftTiming: { ...formData.shiftTiming, breakDuration: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Group
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...formData.address, street: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter street address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...formData.address, city: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter city"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...formData.address, state: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter state"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.emergencyContact.name}
              onChange={(e) => setFormData({ 
                ...formData, 
                emergencyContact: { ...formData.emergencyContact, name: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter emergency contact name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.emergencyContact.phone}
              onChange={(e) => setFormData({ 
                ...formData, 
                emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter emergency contact phone"
            />
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={() => {
            if (isModal) {
              setShowAddModal(false);
            } else {
              setEditingEmployee(null);
            }
            resetForm();
          }}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{editingEmployee ? 'Update Employee' : 'Add Employee'}</span>
        </button>
      </div>
    </div>
  );

  // Employees Tab Component
  const EmployeesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
          <p className="text-gray-600">Manage your restaurant staff</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
          >
            {roles.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept.charAt(0).toUpperCase() + dept.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Edit Form */}
      {editingEmployee && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Edit Employee</h3>
          <EmployeeForm />
        </div>
      )}

      {/* Employee Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(employee => (
              <EmployeeCard key={employee._id} employee={employee} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}

          {employees.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No employees found</p>
              <p className="text-gray-400">Try adjusting your search or add new employees</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Attendance Tab Component
  const AttendanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
          <p className="text-gray-600">Monitor real-time attendance and manage check-ins</p>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Today's Attendance Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-3xl font-bold text-blue-600">{todayAttendance.length}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-3xl font-bold text-green-600">
                {todayAttendance.filter(att => att.isPresent).length}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-3xl font-bold text-red-600">
                {todayAttendance.filter(att => !att.isPresent).length}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">On Break</p>
              <p className="text-3xl font-bold text-yellow-600">
                {todayAttendance.filter(att => att.onBreak).length}
              </p>
            </div>
          </div>

          {/* Attendance List */}
          <div className="space-y-3">
            {todayAttendance.map(emp => {
              const isOnBreak = emp.onBreak || false;
              
              return (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.role} • {emp.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      {emp.isPresent ? (
                        <>
                          <p className="text-gray-600">
                            In: {emp.loginTime ? new Date(emp.loginTime).toLocaleTimeString('en-US', { 
                              hour12: true, 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : '-'}
                          </p>
                          <p className="text-gray-600">
                            Hours: {emp.hoursWorked || 0}
                          </p>
                        </>
                      ) : (
                        <p className="text-red-600">Not checked in</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {emp.isPresent ? (
                        <>
                          {isOnBreak ? (
                            <>
                              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                On Break
                              </span>
                              <button
                                onClick={() => handleEndBreak(emp.id)}
                                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                              >
                                End Break
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Present
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleStartBreak(emp.id, 'lunch')}
                                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                  title="Start Lunch Break"
                                >
                                  Lunch
                                </button>
                                <button
                                  onClick={() => handleStartBreak(emp.id, 'tea')}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  title="Start Tea Break"
                                >
                                  Tea
                                </button>
                              </div>
                              <button
                                onClick={() => handleCheckOut(emp.id)}
                                disabled={emp.logoutTime}
                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                              >
                                {emp.logoutTime ? 'Checked Out' : 'Check Out'}
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Absent
                          </span>
                          <button
                            onClick={() => handleCheckIn(emp.id)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          >
                            Check In
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Reports Tab Component
  const ReportsTab = () => {
    const [reportType, setReportType] = useState('attendance');
    const [reportPeriod, setReportPeriod] = useState('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
            <p className="text-gray-600">Generate comprehensive reports and insights</p>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="attendance">Attendance Report</option>
                <option value="salary">Salary Report</option>
                <option value="performance">Performance Report</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={2020 + i} value={2020 + i}>
                    {2020 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Average Attendance</h3>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">87.5%</p>
            <p className="text-sm text-gray-600">This month</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Payroll</h3>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">₹{employees.reduce((sum, emp) => sum + (emp.salary?.base || 0), 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">This month</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Overtime Hours</h3>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">142</p>
            <p className="text-sm text-gray-600">This month</p>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Department Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(stats.departments || {}).map(([dept, count]) => {
                const total = Object.values(stats.departments || {}).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="font-medium text-gray-700 capitalize">{dept}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{count} employees</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render function
  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">Restaurant EMS</h1>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'dashboard' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'employees' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Employees
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'attendance' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'reports' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Reports
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back</p>
                <p className="font-medium text-gray-800">Restaurant Manager</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </main>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Add New Employee</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <EmployeeForm isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showAttendanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedEmployee.name} - Employee Details
                </h2>
                <button
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Employee Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Employee ID:</span> {selectedEmployee.employeeId}</p>
                      <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedEmployee.phone}</p>
                      <p><span className="font-medium">Department:</span> {selectedEmployee.department}</p>
                      <p><span className="font-medium">Join Date:</span> {new Date(selectedEmployee.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Salary Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Base Salary:</span> ₹{selectedEmployee.salary?.base?.toLocaleString()}</p>
                      <p><span className="font-medium">Payroll Type:</span> {selectedEmployee.payrollType}</p>
                      {selectedEmployee.salary?.overtime && (
                        <p><span className="font-medium">Overtime Rate:</span> ₹{selectedEmployee.salary.overtime}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Month Stats */}
              {selectedEmployee.currentMonthStats && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Current Month Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Present Days</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedEmployee.currentMonthStats.presentDays}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Hours</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedEmployee.currentMonthStats.totalHours}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Overtime</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedEmployee.currentMonthStats.overtimeHours || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Attendance</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {selectedEmployee.currentMonthStats.attendancePercentage}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Attendance */}
              {selectedEmployee.recentAttendance && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Attendance (Last 30 days)</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedEmployee.recentAttendance.slice(0, 10).map((att, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {att.isPresent ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {new Date(att.date).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            att.status === 'present' ? 'bg-green-100 text-green-800' :
                            att.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            att.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {att.status}
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {att.isPresent && (
                            <div>
                              <div>In: {att.loginTime ? new Date(att.loginTime).toLocaleTimeString() : '-'}</div>
                              <div>Out: {att.logoutTime ? new Date(att.logoutTime).toLocaleTimeString() : '-'}</div>
                              <div>Hours: {att.hoursWorked || 0}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Salary Details Modal */}
      {showSalaryModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Salary Details - {selectedEmployee.name}
                </h2>
                <button
                  onClick={() => {
                    setShowSalaryModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedEmployee.salaryDetails && (
                <div className="space-y-6">
                  {/* Period Info */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Salary Breakdown for {selectedEmployee.salaryDetails.period}
                    </h3>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Base Salary:</span>
                        <span className="font-medium">₹{selectedEmployee.salaryDetails.salaryBreakdown.baseSalary?.toLocaleString()}</span>
                      </div>
                      
                      {selectedEmployee.salaryDetails.salaryBreakdown.overtimePay > 0 && (
                        <div className="flex justify-between">
                          <span>Overtime Pay:</span>
                          <span className="font-medium">₹{selectedEmployee.salaryDetails.salaryBreakdown.overtimePay?.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {selectedEmployee.salaryDetails.salaryBreakdown.bonus > 0 && (
                        <div className="flex justify-between">
                          <span>Bonus:</span>
                          <span className="font-medium">₹{selectedEmployee.salaryDetails.salaryBreakdown.bonus?.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <hr className="border-gray-300" />
                      
                      <div className="flex justify-between">
                        <span>Gross Salary:</span>
                        <span className="font-medium">₹{selectedEmployee.salaryDetails.salaryBreakdown.grossSalary?.toLocaleString()}</span>
                      </div>
                      
                      {selectedEmployee.salaryDetails.salaryBreakdown.deductions > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Deductions:</span>
                          <span className="font-medium">-₹{selectedEmployee.salaryDetails.salaryBreakdown.deductions?.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <hr className="border-gray-300" />
                      
                      <div className="flex justify-between text-lg font-bold text-green-600">
                        <span>Net Salary:</span>
                        <span>₹{selectedEmployee.salaryDetails.salaryBreakdown.netSalary?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Present Days</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedEmployee.salaryDetails.attendanceDetails.presentDays}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Attendance %</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedEmployee.salaryDetails.attendanceDetails.attendancePercentage}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagementSystem;