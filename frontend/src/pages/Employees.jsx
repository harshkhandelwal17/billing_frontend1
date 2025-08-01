import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Search, Clock, 
  User, Phone, Mail, MapPin, Calendar, DollarSign,
  UserCheck, UserX, Users, Award, AlertCircle
} from 'lucide-react';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'waiter',
    salary: '',
    address: '',
    emergencyContact: ''
  });

  const API_BASE_URL = 'http://localhost:4000/api';

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

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await apiCall('/employees');
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await apiCall('/employees/attendance/today');
      setAttendanceData(data.attendanceSummary || []);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const roles = ['all', 'waiter', 'cook', 'cashier', 'cleaner', 'manager'];
  const roleColors = {
    waiter: 'bg-blue-100 text-blue-800',
    cook: 'bg-orange-100 text-orange-800',
    cashier: 'bg-green-100 text-green-800',
    cleaner: 'bg-purple-100 text-purple-800',
    manager: 'bg-red-100 text-red-800'
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = async () => {
    try {
      if (editingEmployee) {
        // Update existing employee
        const response = await apiCall(`/employees/${editingEmployee._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        
        setEmployees(prev => prev.map(emp => 
          emp._id === editingEmployee._id ? response.employee : emp
        ));
        
        setEditingEmployee(null);
      } else {
        // Create new employee
        const response = await apiCall('/employees', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        setEmployees(prev => [response.employee, ...prev]);
        setShowAddModal(false);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'waiter',
        salary: '',
        address: '',
        emergencyContact: ''
      });
      
    } catch (error) {
      alert('Failed to save employee: ' + error.message);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      salary: employee.salary.toString(),
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || ''
    });
  };

  const handleDelete = async (employeeId) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    
    try {
      await apiCall(`/employees/${employeeId}`, { method: 'DELETE' });
      setEmployees(prev => prev.map(emp => 
        emp._id === employeeId ? { ...emp, isActive: false } : emp
      ));
    } catch (error) {
      alert('Failed to deactivate employee: ' + error.message);
    }
  };

  const handleCheckIn = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/checkin`, { method: 'POST' });
      fetchTodayAttendance();
      alert('Check-in successful!');
    } catch (error) {
      alert('Check-in failed: ' + error.message);
    }
  };

  const handleCheckOut = async (employeeId) => {
    try {
      await apiCall(`/employees/${employeeId}/checkout`, { method: 'POST' });
      fetchTodayAttendance();
      alert('Check-out successful!');
    } catch (error) {
      alert('Check-out failed: ' + error.message);
    }
  };

  const viewAttendance = async (employee) => {
    try {
      const data = await apiCall(`/employees/${employee._id}/attendance?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
      setSelectedEmployee({ ...employee, attendanceDetails: data });
      setShowAttendanceModal(true);
    } catch (error) {
      alert('Failed to fetch attendance details: ' + error.message);
    }
  };

  const EmployeeCard = ({ employee }) => {
    const attendance = attendanceData.find(att => att.id === employee._id);
    
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
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[employee.role]}`}>
              {employee.role}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>₹{employee.salary.toLocaleString()}/month</span>
            </div>
          </div>

          {/* Attendance Status */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {attendance?.isPresent ? (
                <UserCheck className="w-5 h-5 text-green-600" />
              ) : (
                <UserX className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {attendance?.isPresent ? 'Present' : 'Absent'}
              </span>
            </div>
            {attendance?.loginTime && (
              <span className="text-sm text-gray-600">
                In: {attendance.loginTime}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {attendance?.isPresent ? (
              <button
                onClick={() => handleCheckOut(employee._id)}
                disabled={attendance.logoutTime}
                className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {attendance.logoutTime ? 'Checked Out' : 'Check Out'}
              </button>
            ) : (
              <button
                onClick={() => handleCheckIn(employee._id)}
                className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Check In
              </button>
            )}
            
            <button
              onClick={() => viewAttendance(employee)}
              className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Attendance
            </button>
          </div>

          {/* Management Actions */}
          <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => handleEdit(employee)}
              className="flex-1 flex items-center justify-center py-2 px-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
            
            <button
              onClick={() => handleDelete(employee._id)}
              className="flex-1 flex items-center justify-center py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmployeeForm = ({ isModal = false }) => (
    <div className={isModal ? 'space-y-4' : 'space-y-6'}>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="waiter">Waiter</option>
            <option value="cook">Cook</option>
            <option value="cashier">Cashier</option>
            <option value="cleaner">Cleaner</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Salary (₹) *
          </label>
          <input
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter monthly salary"
            min="0"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact
          </label>
          <input
            type="tel"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Emergency contact number"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter complete address"
        />
      </div>
      
      <div className="flex space-x-4 pt-4">
        <button
          onClick={() => {
            if (isModal) {
              setShowAddModal(false);
            } else {
              setEditingEmployee(null);
            }
            setFormData({
              name: '',
              email: '',
              phone: '',
              role: 'waiter',
              salary: '',
              address: '',
              emergencyContact: ''
            });
          }}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{editingEmployee ? 'Update Employee' : 'Add Employee'}</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Management</h1>
            <p className="text-gray-600">Manage your restaurant staff and attendance</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceData.filter(att => att.isPresent).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {attendanceData.filter(att => !att.isPresent).length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Payroll</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{employees.reduce((sum, emp) => sum + emp.salary, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
          >
            {roles.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Edit Form */}
      {editingEmployee && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Employee</h2>
          <EmployeeForm />
        </div>
      )}

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(employee => (
          <EmployeeCard key={employee._id} employee={employee} />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No employees found</p>
          <p className="text-gray-400">Try adjusting your search or add new employees</p>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Employee</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <EmployeeForm isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Attendance - {selectedEmployee.name}
                </h2>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {selectedEmployee.attendanceDetails && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Present Days</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedEmployee.attendanceDetails.summary.presentDays}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Hours</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedEmployee.attendanceDetails.summary.totalHours}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Hours/Day</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedEmployee.attendanceDetails.summary.averageHours}
                      </p>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    <h3 className="font-semibold text-gray-800 mb-3">Recent Attendance</h3>
                    <div className="space-y-2">
                      {selectedEmployee.attendanceDetails.attendance.slice(0, 10).map((att, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {att.isPresent ? (
                              <UserCheck className="w-5 h-5 text-green-600" />
                            ) : (
                              <UserX className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium">
                              {new Date(att.date).toLocaleDateString()}
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;