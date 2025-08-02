const express = require('express');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { upload, deleteFromCloudinary, cloudinary } = require('../config/cloudinary');
const {
  validateEmployee,
  validateEmployeeUpdate,
  validateEmployeeId,
  validateEmployeeQuery,
  validateAttendanceQuery,
  validateSalaryParams,
  validateLeaveApplication,
  validatePerformanceReview,
  validateBulkOperation
} = require('../middleware/validation');

const router = express.Router();

// Helper function for standardized responses
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
};

// Enhanced error handling with detailed logging
const handleError = (res, error, message = 'Server error', context = {}) => {
  console.error('Employee Route Error:', {
    error: error.message,
    stack: error.stack,
    context
  });
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return sendResponse(res, 400, false, 'Validation failed', { errors });
  }
  
  if (error.name === 'CastError') {
    return sendResponse(res, 400, false, 'Invalid ID format');
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    return sendResponse(res, 400, false, `${field} '${value}' already exists`);
  }
  
  if (error.name === 'TokenExpiredError') {
    return sendResponse(res, 401, false, 'Token expired');
  }
  
  if (error.name === 'JsonWebTokenError') {
    return sendResponse(res, 401, false, 'Invalid token');
  }
  
  sendResponse(res, 500, false, message);
};

// Utility function to build dynamic query
const buildQuery = (filters) => {
  const query = {};
  
  // Basic filters
  if (filters.active !== undefined) query.isActive = filters.active === 'true';
  if (filters.role) query.role = Array.isArray(filters.role) ? { $in: filters.role } : filters.role;
  if (filters.department) query.department = Array.isArray(filters.department) ? { $in: filters.department } : filters.department;
  if (filters.contractType) query.contractType = filters.contractType;
  
  // Date range filters
  if (filters.joinDateFrom || filters.joinDateTo) {
    query.joinDate = {};
    if (filters.joinDateFrom) query.joinDate.$gte = new Date(filters.joinDateFrom);
    if (filters.joinDateTo) query.joinDate.$lte = new Date(filters.joinDateTo);
  }
  
  // Salary range filter
  if (filters.salaryMin || filters.salaryMax) {
    query['salary.base'] = {};
    if (filters.salaryMin) query['salary.base'].$gte = parseInt(filters.salaryMin);
    if (filters.salaryMax) query['salary.base'].$lte = parseInt(filters.salaryMax);
  }
  
  // Age range filter
  if (filters.ageMin || filters.ageMax) {
    const today = new Date();
    query.dateOfBirth = {};
    if (filters.ageMax) {
      const minBirthDate = new Date(today.getFullYear() - parseInt(filters.ageMax) - 1, today.getMonth(), today.getDate());
      query.dateOfBirth.$gte = minBirthDate;
    }
    if (filters.ageMin) {
      const maxBirthDate = new Date(today.getFullYear() - parseInt(filters.ageMin), today.getMonth(), today.getDate());
      query.dateOfBirth.$lte = maxBirthDate;
    }
  }
  
  // Skills filter
  if (filters.skills) {
    const skillsArray = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
    query.skills = { $in: skillsArray };
  }
  
  // Search functionality
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { employeeId: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return query;
};

// Get all employees with advanced filtering, pagination, and sorting
router.get('/', auth, validateEmployeeQuery, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeInactive = false,
      fields = ''
    } = req.query;
    
    // Build query from filters
    const query = buildQuery(req.query);
    
    // Exclude inactive employees unless specifically requested
    if (!includeInactive) {
      query.isActive = true;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Build field selection
    let selectFields = fields ? fields.split(',').join(' ') : '-attendance -password';
    
    // Execute query with pagination
    const employees = await Employee.find(query)
      .select(selectFields)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy updatedBy', 'name employeeId')
      .lean();

    const total = await Employee.countDocuments(query);

    // Get comprehensive statistics
    const [roleStats, departmentStats, contractStats] = await Promise.all([
      Employee.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$contractType', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      roles: roleStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      departments: departmentStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      contracts: contractStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    };

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalRecords: total,
      limit: parseInt(limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    };

    sendResponse(res, 200, true, 'Employees retrieved successfully', {
      employees,
      stats
    }, { pagination });

  } catch (error) {
    handleError(res, error, 'Failed to retrieve employees', { query: req.query });
  }
});

// Get single employee with comprehensive details
router.get('/:id', auth, validateEmployeeId, async (req, res) => {
  try {
    const { includePassword = false, attendanceDays = 30 } = req.query;
    
    let selectFields = includePassword ? '' : '-password';
    
    const employee = await Employee.findById(req.params.id)
      .select(selectFields)
      .populate('createdBy updatedBy', 'name employeeId')
      .populate('performanceReviews.reviewer', 'name employeeId');
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    // Get recent attendance based on attendanceDays parameter
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(attendanceDays));
    
    const recentAttendance = employee.attendance
      .filter(att => att.date >= daysAgo)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate current month statistics
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyStats = employee.getMonthlyAttendance(currentMonth, currentYear);

    const employeeData = employee.toObject();
    employeeData.recentAttendance = recentAttendance;
    employeeData.currentMonthStats = monthlyStats;
    employeeData.currentLeaveBalance = employee.currentLeaveBalance;

    sendResponse(res, 200, true, 'Employee retrieved successfully', employeeData);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve employee', { employeeId: req.params.id });
  }
});

// Create new employee with enhanced validation
router.post('/', upload.single('profilePicture'), validateEmployee, async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      // createdBy: req.user.id
    };
console.log('Employee Data:', employeeData);
    // Handle profile picture upload
    if (req.file) {
      employeeData.profilePicture = req.file.path;
    }

    // Parse nested objects if they come as strings
    if (typeof req.body.salary === 'string') {
      employeeData.salary = JSON.parse(req.body.salary);
    }
    if (typeof req.body.address === 'string') {
      employeeData.address = JSON.parse(req.body.address);
    }
    if (typeof req.body.emergencyContact === 'string') {
      employeeData.emergencyContact = JSON.parse(req.body.emergencyContact);
    }
    if (typeof req.body.shiftTiming === 'string') {
      employeeData.shiftTiming = JSON.parse(req.body.shiftTiming);
    }

    const employee = new Employee(employeeData);
    await employee.save();

    // Remove password from response
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    sendResponse(res, 201, true, 'Employee created successfully', employeeResponse);
  } catch (error) {
    handleError(res, error, 'Failed to create employee', { body: req.body });
  }
});

// Update employee with enhanced validation and audit trail
router.put('/:id', auth, adminAuth, upload.single('profilePicture'), validateEmployeeId, validateEmployeeUpdate, async (req, res) => {
  try {
    const updateData = { 
      ...req.body, 
      updatedBy: req.user.id 
    };
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.employeeId;
    delete updateData.attendance;
    delete updateData.createdAt;
    delete updateData.createdBy;

    // Handle profile picture upload
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }

    // Parse nested objects if they come as strings
    ['salary', 'address', 'emergencyContact', 'shiftTiming', 'bankDetails'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          // If parsing fails, keep original value
        }
      }
    });

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    sendResponse(res, 200, true, 'Employee updated successfully', employee);
  } catch (error) {
    handleError(res, error, 'Failed to update employee', { 
      employeeId: req.params.id, 
      updates: Object.keys(req.body) 
    });
  }
});

// Soft delete employee with reason
router.delete('/:id', auth, adminAuth, validateEmployeeId, async (req, res) => {
  try {
    const { reason = 'Administrative action' } = req.body;
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        terminationDate: new Date(),
        terminationReason: reason,
        updatedBy: req.user.id
      },
      { new: true }
    ).select('employeeId name email');
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    sendResponse(res, 200, true, 'Employee deactivated successfully', {
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      terminationReason: reason
    });
  } catch (error) {
    handleError(res, error, 'Failed to deactivate employee', { employeeId: req.params.id });
  }
});

// Enhanced Check-in with location verification and break handling
router.post('/:id/checkin', auth, validateEmployeeId, async (req, res) => {
  try {
    const { latitude, longitude, address, workLocation = 'dining' } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    if (!employee.isActive) {
      return sendResponse(res, 400, false, 'Cannot check in inactive employee');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if already checked in today
    const existingAttendance = employee.attendance.find(
      att => att.date.toDateString() === today.toDateString()
    );

    if (existingAttendance && existingAttendance.loginTime) {
      return sendResponse(res, 400, false, 'Already checked in today', {
        loginTime: existingAttendance.loginTime,
        workLocation: existingAttendance.workLocation
      });
    }

    // Calculate late status
    const shiftStart = employee.shiftTiming.startTime || '09:00';
    const [startHour, startMinute] = shiftStart.split(':').map(Number);
    const shiftStartTime = new Date(today);
    shiftStartTime.setHours(startHour, startMinute, 0, 0);
    
    const lateMinutes = Math.max(0, Math.floor((now - shiftStartTime) / (1000 * 60)));
    const status = lateMinutes > 15 ? 'late' : 'present';

    const attendanceData = {
      date: today,
      loginTime: now,
      isPresent: true,
      status: status,
      lateMinutes: lateMinutes,
      workLocation: workLocation,
      checkInLocation: latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || ''
      } : undefined
    };

    if (existingAttendance) {
      Object.assign(existingAttendance, attendanceData);
    } else {
      employee.attendance.push(attendanceData);
    }

    employee.lastLogin = now;
    await employee.save();

    sendResponse(res, 200, true, 'Check-in successful', {
      loginTime: now,
      status: status,
      lateMinutes: lateMinutes,
      workLocation: workLocation,
      message: lateMinutes > 15 ? `Late by ${lateMinutes} minutes` : 'On time check-in'
    });
  } catch (error) {
    handleError(res, error, 'Check-in failed', { employeeId: req.params.id });
  }
});

// Enhanced Check-out with overtime calculation
router.post('/:id/checkout', auth, validateEmployeeId, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayAttendance = employee.attendance.find(
      att => att.date.toDateString() === today.toDateString()
    );

    if (!todayAttendance || !todayAttendance.loginTime) {
      return sendResponse(res, 400, false, 'Not checked in today');
    }

    if (todayAttendance.logoutTime) {
      return sendResponse(res, 400, false, 'Already checked out today', {
        logoutTime: todayAttendance.logoutTime,
        hoursWorked: todayAttendance.hoursWorked
      });
    }

    // Calculate total hours worked
    const totalMinutesWorked = (now - todayAttendance.loginTime) / (1000 * 60);
    const totalBreakTime = todayAttendance.totalBreakTime || 0;
    const actualMinutesWorked = totalMinutesWorked - totalBreakTime;
    const hoursWorked = actualMinutesWorked / 60;

    // Calculate shift hours and overtime
    const shiftStart = employee.shiftTiming.startTime || '09:00';
    const shiftEnd = employee.shiftTiming.endTime || '18:00';
    const [startHour, startMinute] = shiftStart.split(':').map(Number);
    const [endHour, endMinute] = shiftEnd.split(':').map(Number);
    
    const shiftEndTime = new Date(today);
    shiftEndTime.setHours(endHour, endMinute, 0, 0);
    
    const standardShiftHours = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
    const overtimeHours = Math.max(0, hoursWorked - standardShiftHours);
    const earlyLeaveMinutes = Math.max(0, Math.floor((shiftEndTime - now) / (1000 * 60)));

    // Update attendance record
    todayAttendance.logoutTime = now;
    todayAttendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
    todayAttendance.overtimeHours = Math.round(overtimeHours * 100) / 100;
    
    if (latitude && longitude) {
      todayAttendance.checkOutLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || ''
      };
    }

    // Determine final status
    if (overtimeHours > 0.5) {
      todayAttendance.status = 'overtime';
    } else if (earlyLeaveMinutes > 30) {
      todayAttendance.status = 'early-leave';
      todayAttendance.earlyLeaveMinutes = earlyLeaveMinutes;
    } else if (hoursWorked < 4) {
      todayAttendance.status = 'half-day';
    }

    await employee.save();

    const responseData = {
      logoutTime: now,
      hoursWorked: todayAttendance.hoursWorked,
      overtimeHours: todayAttendance.overtimeHours,
      status: todayAttendance.status,
      totalBreakTime: Math.round(totalBreakTime / 60 * 100) / 100, // Convert to hours
      earlyLeaveMinutes: todayAttendance.earlyLeaveMinutes || 0
    };

    let message = 'Check-out successful';
    if (overtimeHours > 0.5) {
      message += ` with ${Math.round(overtimeHours * 100) / 100} hours overtime`;
    } else if (earlyLeaveMinutes > 30) {
      message += ` (Early leave by ${earlyLeaveMinutes} minutes)`;
    }

    sendResponse(res, 200, true, message, responseData);
  } catch (error) {
    handleError(res, error, 'Check-out failed', { employeeId: req.params.id });
  }
});

// Break management - Start break
router.post('/:id/break/start', auth, validateEmployeeId, async (req, res) => {
  try {
    const { type = 'other' } = req.body;
    const validBreakTypes = ['lunch', 'tea', 'dinner', 'other'];
    
    if (!validBreakTypes.includes(type)) {
      return sendResponse(res, 400, false, 'Invalid break type');
    }
    
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const today = new Date();
    const todayString = today.toDateString();
    
    const todayAttendance = employee.attendance.find(
      att => att.date.toDateString() === todayString
    );

    if (!todayAttendance || !todayAttendance.loginTime) {
      return sendResponse(res, 400, false, 'Employee not checked in today');
    }

    if (todayAttendance.logoutTime) {
      return sendResponse(res, 400, false, 'Employee already checked out');
    }

    // Check if there's an ongoing break
    const ongoingBreak = todayAttendance.breaks.find(b => !b.endTime);
    if (ongoingBreak) {
      return sendResponse(res, 400, false, 'Break already in progress', {
        breakType: ongoingBreak.type,
        startTime: ongoingBreak.startTime
      });
    }

    // Add new break
    todayAttendance.breaks.push({
      startTime: today,
      type: type
    });

    await employee.save();

    sendResponse(res, 200, true, `${type.charAt(0).toUpperCase() + type.slice(1)} break started`, {
      breakType: type,
      startTime: today
    });
  } catch (error) {
    handleError(res, error, 'Failed to start break', { employeeId: req.params.id });
  }
});

// Break management - End break
router.post('/:id/break/end', auth, validateEmployeeId, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const today = new Date();
    const todayString = today.toDateString();
    
    const todayAttendance = employee.attendance.find(
      att => att.date.toDateString() === todayString
    );

    if (!todayAttendance) {
      return sendResponse(res, 400, false, 'No attendance record found for today');
    }

    // Find ongoing break
    const ongoingBreak = todayAttendance.breaks.find(b => !b.endTime);
    if (!ongoingBreak) {
      return sendResponse(res, 400, false, 'No ongoing break found');
    }

    // End the break
    ongoingBreak.endTime = today;
    ongoingBreak.duration = Math.round((today - ongoingBreak.startTime) / (1000 * 60)); // in minutes

    // Update total break time
    todayAttendance.totalBreakTime = todayAttendance.breaks.reduce(
      (total, breakItem) => total + (breakItem.duration || 0), 0
    );

    await employee.save();

    sendResponse(res, 200, true, `${ongoingBreak.type.charAt(0).toUpperCase() + ongoingBreak.type.slice(1)} break ended`, {
      breakType: ongoingBreak.type,
      duration: ongoingBreak.duration,
      totalBreakTime: todayAttendance.totalBreakTime
    });
  } catch (error) {
    handleError(res, error, 'Failed to end break', { employeeId: req.params.id });
  }
});

// Leave application
router.post('/:id/leave/apply', auth, validateLeaveApplication, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, isEmergency = false } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Check leave balance
    if (!employee.canTakeLeave(leaveType, daysDiff)) {
      const currentBalance = employee.currentLeaveBalance;
      return sendResponse(res, 400, false, `Insufficient ${leaveType} leave balance`, {
        requested: daysDiff,
        available: currentBalance[leaveType]?.remaining || 0
      });
    }

    // Apply leave to dates
    const leaveStatus = isEmergency ? leaveType : `${leaveType}-leave`;
    const approvalRequired = daysDiff > 1 || ['annual', 'casual'].includes(leaveType);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const existingAttendance = employee.attendance.find(
        att => att.date.toDateString() === d.toDateString()
      );

      const leaveData = {
        date: new Date(d),
        isPresent: false,
        status: leaveStatus,
        leaveType: leaveType,
        leaveReason: reason,
        approvedBy: isEmergency ? req.user.id : null
      };

      if (existingAttendance) {
        Object.assign(existingAttendance, leaveData);
      } else {
        employee.attendance.push(leaveData);
      }
    }

    // Deduct from leave balance if approved or emergency
    if (isEmergency || !approvalRequired) {
      employee.applyLeave(leaveType, daysDiff);
    }

    await employee.save();

    sendResponse(res, 200, true, `Leave application ${isEmergency || !approvalRequired ? 'approved' : 'submitted for approval'}`, {
      leaveType,
      days: daysDiff,
      startDate,
      endDate,
      reason,
      requiresApproval: approvalRequired && !isEmergency
    });
  } catch (error) {
    handleError(res, error, 'Failed to apply leave', { employeeId: req.params.id });
  }
});

// Get attendance report with advanced filtering
router.get('/:id/attendance', auth, validateEmployeeId, validateAttendanceQuery, async (req, res) => {
  try {
    const { 
      month, 
      year, 
      startDate, 
      endDate,
      includeBreaks = false,
      groupBy = 'day'
    } = req.query;
    
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    let attendanceData;
    let period;

    if (startDate && endDate) {
      // Custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const attendanceInRange = employee.attendance.filter(att => 
        att.date >= start && att.date <= end
      );

      attendanceData = {
        attendance: attendanceInRange,
        presentDays: attendanceInRange.filter(att => att.isPresent).length,
        absentDays: attendanceInRange.filter(att => !att.isPresent).length,
        totalHours: attendanceInRange.reduce((sum, att) => sum + (att.hoursWorked || 0), 0),
        overtimeHours: attendanceInRange.reduce((sum, att) => sum + (att.overtimeHours || 0), 0),
        lateCount: attendanceInRange.filter(att => att.status === 'late').length,
        earlyLeaveCount: attendanceInRange.filter(att => att.status === 'early-leave').length
      };
      
      period = `${startDate} to ${endDate}`;
    } else {
      // Monthly report
      const currentMonth = month || (new Date().getMonth() + 1);
      const currentYear = year || new Date().getFullYear();
      attendanceData = employee.getMonthlyAttendance(currentMonth, currentYear);
      period = `${currentMonth}/${currentYear}`;
    }

    // Group attendance data if requested
    if (groupBy === 'week' && attendanceData.attendance) {
      const weeklyData = {};
      attendanceData.attendance.forEach(att => {
        const weekStart = new Date(att.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            weekStart: weekKey,
            days: [],
            totalHours: 0,
            presentDays: 0
          };
        }
        
        weeklyData[weekKey].days.push(att);
        weeklyData[weekKey].totalHours += att.hoursWorked || 0;
        if (att.isPresent) weeklyData[weekKey].presentDays++;
      });
      
      attendanceData.weeklyBreakdown = Object.values(weeklyData);
    }

    const responseData = {
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department,
        salary: employee.salary
      },
      period,
      ...attendanceData
    };

    // Include break details if requested
    if (includeBreaks === 'true' && attendanceData.attendance) {
      responseData.breakAnalysis = {
        totalBreakTime: attendanceData.attendance.reduce((sum, att) => sum + (att.totalBreakTime || 0), 0),
        averageBreakTime: attendanceData.presentDays > 0 ? 
          Math.round((attendanceData.attendance.reduce((sum, att) => sum + (att.totalBreakTime || 0), 0) / attendanceData.presentDays) * 100) / 100 : 0,
        breaksByType: {}
      };
      
      attendanceData.attendance.forEach(att => {
        if (att.breaks && att.breaks.length > 0) {
          att.breaks.forEach(breakItem => {
            if (!responseData.breakAnalysis.breaksByType[breakItem.type]) {
              responseData.breakAnalysis.breaksByType[breakItem.type] = {
                count: 0,
                totalDuration: 0
              };
            }
            responseData.breakAnalysis.breaksByType[breakItem.type].count++;
            responseData.breakAnalysis.breaksByType[breakItem.type].totalDuration += breakItem.duration || 0;
          });
        }
      });
    }

    sendResponse(res, 200, true, 'Attendance retrieved successfully', responseData);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve attendance', { employeeId: req.params.id });
  }
});

// Calculate salary with detailed breakdown
router.get('/:id/salary/:month/:year', auth, adminAuth, validateSalaryParams, async (req, res) => {
  try {
    const { month, year } = req.params;
    const { includeDeductions = true, includeAllowances = true } = req.query;
    
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const salaryData = employee.calculateSalary(month, year);
    const monthlyAttendance = employee.getMonthlyAttendance(month, year);

    // Calculate additional allowances and deductions
    const allowances = {
      transport: 1000,
      meal: 500,
      mobile: 300,
      performance: monthlyAttendance.attendancePercentage >= 95 ? 2000 : 0
    };

    const deductions = {
      pf: Math.round(salaryData.baseSalary * 0.12), // 12% PF
      esi: Math.round(salaryData.baseSalary * 0.0175), // 1.75% ESI
      tax: 0, // Would be calculated based on income tax slabs
      advance: employee.salary.deductions || 0
    };

    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);

    const enhancedSalaryData = {
      ...salaryData,
      allowances: includeAllowances === 'true' ? allowances : undefined,
      totalAllowances: includeAllowances === 'true' ? totalAllowances : 0,
      deductions: includeDeductions === 'true' ? deductions : undefined,
      totalDeductions: includeDeductions === 'true' ? totalDeductions : 0,
      finalNetSalary: (salaryData.netSalary || salaryData.grossSalary) + 
                     (includeAllowances === 'true' ? totalAllowances : 0) - 
                     (includeDeductions === 'true' ? totalDeductions : 0)
    };

    sendResponse(res, 200, true, 'Salary calculated successfully', {
      employee: {
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department,
        payrollType: employee.payrollType
      },
      period: `${month}/${year}`,
      attendanceDetails: monthlyAttendance,
      salaryBreakdown: enhancedSalaryData
    });
  } catch (error) {
    handleError(res, error, 'Failed to calculate salary', { 
      employeeId: req.params.id, 
      month: req.params.month, 
      year: req.params.year 
    });
  }
});

// Performance review management
router.post('/:id/performance', auth, adminAuth, validatePerformanceReview, async (req, res) => {
  try {
    const {
      ratings,
      strengths = [],
      improvements = [],
      goals = [],
      comments = '',
      nextReviewDate
    } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    // Calculate overall rating
    const ratingValues = Object.values(ratings);
    const overallRating = Math.round((ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length) * 100) / 100;

    const performanceReview = {
      reviewDate: new Date(),
      reviewer: req.user.id,
      ratings,
      overallRating,
      strengths,
      improvements,
      goals,
      comments,
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
    };

    employee.performanceReviews.push(performanceReview);
    await employee.save();

    await employee.populate('performanceReviews.reviewer', 'name employeeId');

    sendResponse(res, 200, true, 'Performance review added successfully', {
      review: employee.performanceReviews[employee.performanceReviews.length - 1],
      overallRating,
      reviewCount: employee.performanceReviews.length
    });
  } catch (error) {
    handleError(res, error, 'Failed to add performance review', { employeeId: req.params.id });
  }
});

// Get today's attendance summary with enhanced analytics
router.get('/attendance/today', auth, async (req, res) => {
  try {
    const { department, role, includeBreaks = false } = req.query;
    
    let matchQuery = { isActive: true };
    if (department) matchQuery.department = department;
    if (role) matchQuery.role = role;

    const summaryData = await Employee.getTodayAttendanceSummary();
    
    // Filter if department or role specified
    if (department || role) {
      summaryData.attendanceSummary = summaryData.attendanceSummary.filter(emp => {
        return (!department || emp.department === department) && 
               (!role || emp.role === role);
      });
      
      // Recalculate summary
      const filteredPresent = summaryData.attendanceSummary.filter(emp => emp.isPresent).length;
      const filteredTotal = summaryData.attendanceSummary.length;
      
      summaryData.summary = {
        ...summaryData.summary,
        present: filteredPresent,
        absent: filteredTotal - filteredPresent,
        total: filteredTotal,
        attendancePercentage: filteredTotal > 0 ? Math.round((filteredPresent / filteredTotal) * 100) : 0
      };
    }

    // Add shift-wise analysis
    const shiftAnalysis = {
      morning: { present: 0, total: 0 },
      afternoon: { present: 0, total: 0 },
      evening: { present: 0, total: 0 },
      night: { present: 0, total: 0 }
    };

    summaryData.attendanceSummary.forEach(emp => {
      const shiftStart = emp.shiftStart || '09:00';
      const hour = parseInt(shiftStart.split(':')[0]);
      
      let shiftType = 'morning';
      if (hour >= 12 && hour < 17) shiftType = 'afternoon';
      else if (hour >= 17 && hour < 21) shiftType = 'evening';
      else if (hour >= 21 || hour < 6) shiftType = 'night';
      
      shiftAnalysis[shiftType].total++;
      if (emp.isPresent) shiftAnalysis[shiftType].present++;
    });

    summaryData.shiftAnalysis = shiftAnalysis;

    sendResponse(res, 200, true, 'Today\'s attendance retrieved successfully', summaryData);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve today\'s attendance');
  }
});

// Advanced attendance statistics with predictive analytics
router.get('/stats/attendance', auth, async (req, res) => {
  try {
    const { 
      month, 
      year, 
      department, 
      role,
      includeComparison = false,
      includeTrends = false 
    } = req.query;
    
    const currentMonth = month || (new Date().getMonth() + 1);
    const currentYear = year || new Date().getFullYear();

    let query = { isActive: true };
    if (department) query.department = department;
    if (role) query.role = role;

    const employees = await Employee.find(query);
    
    const analytics = {
      period: `${currentMonth}/${currentYear}`,
      totalEmployees: employees.length,
      overallStats: {
        totalPresent: 0,
        totalHours: 0,
        totalOvertimeHours: 0,
        averageAttendance: 0,
        punctualityScore: 0
      },
      departmentStats: {},
      roleStats: {},
      performanceMetrics: {
        topPerformers: [],
        concernedEmployees: [],
        attendanceTrends: []
      }
    };

    let totalPresentDays = 0;
    let totalPossibleDays = 0;
    let totalLateCount = 0;
    let totalEarlyLeaveCount = 0;

    const employeeMetrics = [];

    employees.forEach(emp => {
      const monthlyData = emp.getMonthlyAttendance(currentMonth, currentYear);
      const salaryData = emp.calculateSalary(currentMonth, currentYear);
      
      totalPresentDays += monthlyData.presentDays;
      totalPossibleDays += (monthlyData.presentDays + monthlyData.absentDays);
      totalLateCount += monthlyData.lateCount || 0;
      totalEarlyLeaveCount += monthlyData.earlyLeaveCount || 0;
      
      analytics.overallStats.totalHours += monthlyData.totalHours;
      analytics.overallStats.totalOvertimeHours += monthlyData.overtimeHours || 0;

      // Department stats
      if (!analytics.departmentStats[emp.department]) {
        analytics.departmentStats[emp.department] = {
          employees: 0,
          totalPresent: 0,
          totalHours: 0,
          averageAttendance: 0,
          totalSalary: 0
        };
      }
      
      const deptStats = analytics.departmentStats[emp.department];
      deptStats.employees++;
      deptStats.totalPresent += monthlyData.presentDays;
      deptStats.totalHours += monthlyData.totalHours;
      deptStats.totalSalary += salaryData.netSalary || salaryData.grossSalary;

      // Role stats
      if (!analytics.roleStats[emp.role]) {
        analytics.roleStats[emp.role] = {
          employees: 0,
          totalPresent: 0,
          averageAttendance: 0,
          averageSalary: 0
        };
      }
      
      const roleStats = analytics.roleStats[emp.role];
      roleStats.employees++;
      roleStats.totalPresent += monthlyData.presentDays;

      // Employee metrics for performance analysis
      employeeMetrics.push({
        id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        role: emp.role,
        attendancePercentage: monthlyData.attendancePercentage,
        punctualityScore: monthlyData.punctualityScore,
        totalHours: monthlyData.totalHours,
        overtimeHours: monthlyData.overtimeHours || 0,
        netSalary: salaryData.netSalary || salaryData.grossSalary
      });
    });

    // Calculate overall averages
    analytics.overallStats.averageAttendance = totalPossibleDays > 0 ? 
      Math.round((totalPresentDays / totalPossibleDays) * 100) : 0;
    
    analytics.overallStats.punctualityScore = totalPresentDays > 0 ?
      Math.round(((totalPresentDays - totalLateCount - totalEarlyLeaveCount) / totalPresentDays) * 100) : 0;

    // Calculate department averages
    Object.keys(analytics.departmentStats).forEach(dept => {
      const stats = analytics.departmentStats[dept];
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      stats.averageAttendance = Math.round((stats.totalPresent / (stats.employees * daysInMonth)) * 100);
      stats.averageSalary = Math.round(stats.totalSalary / stats.employees);
    });

    // Calculate role averages
    Object.keys(analytics.roleStats).forEach(role => {
      const stats = analytics.roleStats[role];
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      stats.averageAttendance = Math.round((stats.totalPresent / (stats.employees * daysInMonth)) * 100);
      
      const roleEmployees = employeeMetrics.filter(emp => emp.role === role);
      stats.averageSalary = Math.round(
        roleEmployees.reduce((sum, emp) => sum + emp.netSalary, 0) / roleEmployees.length
      );
    });

    // Performance metrics
    const sortedByAttendance = [...employeeMetrics].sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    const sortedByPunctuality = [...employeeMetrics].sort((a, b) => b.punctualityScore - a.punctualityScore);

    analytics.performanceMetrics.topPerformers = sortedByAttendance.slice(0, 5).map(emp => ({
      ...emp,
      performanceScore: Math.round((emp.attendancePercentage * 0.7 + emp.punctualityScore * 0.3) * 100) / 100
    }));

    analytics.performanceMetrics.concernedEmployees = sortedByAttendance
      .filter(emp => emp.attendancePercentage < 80 || emp.punctualityScore < 70)
      .slice(0, 10);

    // Add comparison with previous month if requested
    if (includeComparison === 'true') {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      let prevTotalPresent = 0;
      let prevTotalPossible = 0;
      
      employees.forEach(emp => {
        const prevMonthData = emp.getMonthlyAttendance(prevMonth, prevYear);
        prevTotalPresent += prevMonthData.presentDays;
        prevTotalPossible += (prevMonthData.presentDays + prevMonthData.absentDays);
      });
      
      const prevAttendancePercentage = prevTotalPossible > 0 ? 
        Math.round((prevTotalPresent / prevTotalPossible) * 100) : 0;
      
      analytics.comparison = {
        previousMonth: `${prevMonth}/${prevYear}`,
        previousAttendance: prevAttendancePercentage,
        change: analytics.overallStats.averageAttendance - prevAttendancePercentage,
        trend: analytics.overallStats.averageAttendance > prevAttendancePercentage ? 'improving' : 
               analytics.overallStats.averageAttendance < prevAttendancePercentage ? 'declining' : 'stable'
      };
    }

    sendResponse(res, 200, true, 'Attendance statistics retrieved successfully', analytics);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve attendance statistics');
  }
});

// Bulk operations with enhanced validation
router.post('/bulk/checkin', auth, adminAuth, validateBulkOperation, async (req, res) => {
  try {
    const { employeeIds, workLocation = 'dining', location } = req.body;
    
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return sendResponse(res, 400, false, 'Employee IDs array is required');
    }

    if (employeeIds.length > 50) {
      return sendResponse(res, 400, false, 'Maximum 50 employees can be processed at once');
    }

    const results = [];
    const errors = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < employeeIds.length; i += 10) {
      const batch = employeeIds.slice(i, i + 10);
      
      const employees = await Employee.find({
        _id: { $in: batch },
        isActive: true
      });

      for (const employee of employees) {
        try {
          const existingAttendance = employee.attendance.find(
            att => att.date.toDateString() === today.toDateString()
          );

          if (existingAttendance && existingAttendance.loginTime) {
            errors.push({ 
              employeeId: employee.employeeId, 
              name: employee.name,
              error: 'Already checked in today' 
            });
            continue;
          }

          // Calculate late status
          const shiftStart = employee.shiftTiming.startTime || '09:00';
          const [startHour, startMinute] = shiftStart.split(':').map(Number);
          const shiftStartTime = new Date(today);
          shiftStartTime.setHours(startHour, startMinute, 0, 0);
          
          const lateMinutes = Math.max(0, Math.floor((now - shiftStartTime) / (1000 * 60)));
          const status = lateMinutes > 15 ? 'late' : 'present';

          const attendanceData = {
            date: today,
            loginTime: now,
            isPresent: true,
            status: status,
            lateMinutes: lateMinutes,
            workLocation: workLocation
          };

          if (location) {
            attendanceData.checkInLocation = {
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address || 'Bulk check-in location'
            };
          }

          if (existingAttendance) {
            Object.assign(existingAttendance, attendanceData);
          } else {
            employee.attendance.push(attendanceData);
          }

          employee.lastLogin = now;
          await employee.save();

          results.push({ 
            employeeId: employee.employeeId, 
            name: employee.name, 
            loginTime: now,
            status: status,
            lateMinutes: lateMinutes
          });
        } catch (error) {
          errors.push({ 
            employeeId: employee.employeeId || 'unknown', 
            name: employee.name || 'unknown',
            error: error.message 
          });
        }
      }
    }

    // Find employees that weren't found in database
    const foundEmployeeIds = results.map(r => r.employeeId).concat(errors.map(e => e.employeeId));
    const notFoundIds = employeeIds.filter(id => !foundEmployeeIds.includes(id));
    
    notFoundIds.forEach(id => {
      errors.push({ employeeId: id, error: 'Employee not found or inactive' });
    });

    sendResponse(res, 200, true, 'Bulk check-in completed', {
      successful: results,
      failed: errors,
      summary: {
        total: employeeIds.length,
        successful: results.length,
        failed: errors.length,
        successRate: Math.round((results.length / employeeIds.length) * 100)
      }
    });
  } catch (error) {
    handleError(res, error, 'Bulk check-in failed');
  }
});

// Export comprehensive data
router.get('/export/:format', auth, adminAuth, async (req, res) => {
  try {
    const { format } = req.params;
    const { 
      month, 
      year, 
      department, 
      role, 
      includeAttendance = true,
      includeSalary = true,
      includePersonal = false 
    } = req.query;

    if (!['json', 'csv', 'excel'].includes(format)) {
      return sendResponse(res, 400, false, 'Invalid export format. Use json, csv, or excel');
    }

    const currentMonth = month || (new Date().getMonth() + 1);
    const currentYear = year || new Date().getFullYear();

    let query = { isActive: true };
    if (department) query.department = department;
    if (role) query.role = role;

    const employees = await Employee.find(query)
      .select(includePersonal === 'true' ? '' : '-documents -bankDetails -password')
      .lean();
    
    const exportData = employees.map(emp => {
      const monthlyData = includeAttendance === 'true' ? 
        Employee.schema.methods.getMonthlyAttendance.call(emp, current.month, currentYear) : null;
      const salaryData = includeSalary === 'true' ? 
        Employee.schema.methods.calculateSalary.call(emp, currentMonth, currentYear) : null;
      
      return {
        // Basic Info
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        department: emp.department,
        joinDate: emp.joinDate,
        isActive: emp.isActive,
        
        // Salary Info
        ...(includeSalary === 'true' && salaryData ? {
          baseSalary: emp.salary.base,
          earnedSalary: salaryData.netSalary || salaryData.grossSalary,
          attendancePercentage: salaryData.attendancePercentage
        } : {}),
        
        // Attendance Info
        ...(includeAttendance === 'true' && monthlyData ? {
          presentDays: monthlyData.presentDays,
          absentDays: monthlyData.absentDays,
          totalHours: monthlyData.totalHours,
          overtimeHours: monthlyData.overtimeHours || 0,
          lateCount: monthlyData.lateCount || 0,
          earlyLeaveCount: monthlyData.earlyLeaveCount || 0,
          punctualityScore: monthlyData.punctualityScore || 0
        } : {}),
        
        // Personal Info (if requested)
        ...(includePersonal === 'true' ? {
          dateOfBirth: emp.dateOfBirth,
          gender: emp.gender,
          address: emp.address,
          emergencyContact: emp.emergencyContact,
          bloodGroup: emp.bloodGroup
        } : {})
      };
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `employees_${currentMonth}_${currentYear}_${timestamp}`;

    if (format === 'csv') {
      if (exportData.length === 0) {
        return sendResponse(res, 404, false, 'No data to export');
      }
      
      const csvHeader = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.send(csvContent);
    }

    if (format === 'excel') {
      // This would require a library like 'xlsx' to generate Excel files
      return sendResponse(res, 501, false, 'Excel export not implemented yet');
    }

    // JSON export
    sendResponse(res, 200, true, 'Employee data exported successfully', {
      period: `${currentMonth}/${currentYear}`,
      exportDate: new Date().toISOString(),
      filters: { department, role },
      data: exportData,
      summary: {
        totalEmployees: exportData.length,
        departments: [...new Set(exportData.map(emp => emp.department))],
        roles: [...new Set(exportData.map(emp => emp.role))],
        ...(includeSalary === 'true' ? {
          totalSalary: exportData.reduce((sum, emp) => sum + (emp.earnedSalary || 0), 0),
          averageSalary: Math.round(exportData.reduce((sum, emp) => sum + (emp.earnedSalary || 0), 0) / exportData.length)
        } : {}),
        ...(includeAttendance === 'true' ? {
          averageAttendance: Math.round(exportData.reduce((sum, emp) => sum + (emp.attendancePercentage || 0), 0) / exportData.length)
        } : {})
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to export employee data');
  }
});

// Advanced search with AI-like suggestions
router.post('/search/advanced', auth, async (req, res) => {
  try {
    const {
      searchTerm = '',
      filters = {},
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
      suggestions = true
    } = req.body;

    let query = { isActive: true };

    // Apply advanced filters
    if (filters.role && filters.role.length > 0) {
      query.role = { $in: filters.role };
    }
    
    if (filters.department && filters.department.length > 0) {
      query.department = { $in: filters.department };
    }
    
    if (filters.salaryRange) {
      query['salary.base'] = {};
      if (filters.salaryRange.min) query['salary.base'].$gte = filters.salaryRange.min;
      if (filters.salaryRange.max) query['salary.base'].$lte = filters.salaryRange.max;
    }
    
    if (filters.experienceRange) {
      query['experience.total'] = {};
      if (filters.experienceRange.min) query['experience.total'].$gte = filters.experienceRange.min;
      if (filters.experienceRange.max) query['experience.total'].$lte = filters.experienceRange.max;
    }
    
    if (filters.joinDateRange) {
      query.joinDate = {};
      if (filters.joinDateRange.from) query.joinDate.$gte = new Date(filters.joinDateRange.from);
      if (filters.joinDateRange.to) query.joinDate.$lte = new Date(filters.joinDateRange.to);
    }
    
    if (filters.skills && filters.skills.length > 0) {
      query.skills = { $in: filters.skills };
    }
    
    if (filters.contractType) {
      query.contractType = filters.contractType;
    }
    
    if (filters.attendanceThreshold) {
      // This would require aggregation to filter by attendance percentage
      // For now, we'll retrieve all and filter in memory (not ideal for large datasets)
    }

    // Text search
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { employeeId: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { skills: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const employees = await Employee.find(query)
      .select('-attendance -password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy updatedBy', 'name employeeId')
      .lean();

    const total = await Employee.countDocuments(query);

    let searchSuggestions = [];
    
    // Generate search suggestions if requested and search term is provided
    if (suggestions && searchTerm && searchTerm.length >= 2) {
      const suggestionQuery = {
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { skills: { $regex: searchTerm, $options: 'i' } },
          { role: { $regex: searchTerm, $options: 'i' } },
          { department: { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      const suggestionEmployees = await Employee.find(suggestionQuery)
        .select('name role department skills')
        .limit(10)
        .lean();
      
      // Extract unique suggestions
      const names = suggestionEmployees.map(emp => emp.name);
      const roles = [...new Set(suggestionEmployees.map(emp => emp.role))];
      const departments = [...new Set(suggestionEmployees.map(emp => emp.department))];
      const skills = [...new Set(suggestionEmployees.flatMap(emp => emp.skills || []))];
      
      searchSuggestions = {
        names: names.slice(0, 5),
        roles: roles.slice(0, 3),
        departments: departments.slice(0, 3),
        skills: skills.filter(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)
      };
    }

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalRecords: total,
      limit: parseInt(limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    };

    sendResponse(res, 200, true, 'Advanced search completed successfully', {
      employees,
      suggestions: searchSuggestions,
      searchMetadata: {
        searchTerm,
        appliedFilters: Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== ''),
        resultCount: employees.length
      }
    }, { pagination });

  } catch (error) {
    handleError(res, error, 'Advanced search failed');
  }
});

// Get employee dashboard data
router.get('/:id/dashboard', auth, validateEmployeeId, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-password')
      .populate('performanceReviews.reviewer', 'name employeeId');
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get comprehensive data
    const monthlyAttendance = employee.getMonthlyAttendance(currentMonth, currentYear);
    const salaryData = employee.calculateSalary(currentMonth, currentYear);
    const todayAttendance = employee.getTodayAttendance();
    const currentLeaveBalance = employee.currentLeaveBalance;
    
    // Get last 7 days attendance
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const attendance = employee.attendance.find(
        att => att.date.toDateString() === date.toDateString()
      );
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isPresent: attendance?.isPresent || false,
        status: attendance?.status || 'absent',
        hoursWorked: attendance?.hoursWorked || 0,
        loginTime: attendance?.loginTime,
        logoutTime: attendance?.logoutTime
      });
    }
    
    // Get recent performance reviews
    const recentReviews = employee.performanceReviews
      .sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate))
      .slice(0, 3);
    
    // Calculate trends (last 3 months)
    const trends = {
      attendance: [],
      punctuality: [],
      overtime: []
    };
    
    for (let i = 2; i >= 0; i--) {
      const trendMonth = currentMonth - i;
      const trendYear = trendMonth <= 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = trendMonth <= 0 ? trendMonth + 12 : trendMonth;
      
      const trendData = employee.getMonthlyAttendance(adjustedMonth, trendYear);
      
      trends.attendance.push({
        month: `${adjustedMonth}/${trendYear}`,
        percentage: trendData.attendancePercentage
      });
      
      trends.punctuality.push({
        month: `${adjustedMonth}/${trendYear}`,
        score: trendData.punctualityScore || 0
      });
      
      trends.overtime.push({
        month: `${adjustedMonth}/${trendYear}`,
        hours: trendData.overtimeHours || 0
      });
    }
    
    // Get upcoming events/reminders
    const upcomingEvents = [];
    
    // Contract renewal
    if (employee.contractType !== 'permanent' && employee.terminationDate) {
      const daysUntilExpiry = Math.ceil((new Date(employee.terminationDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        upcomingEvents.push({
          type: 'contract_renewal',
          title: 'Contract Renewal Due',
          date: employee.terminationDate,
          daysRemaining: daysUntilExpiry,
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium'
        });
      }
    }
    
    // Performance review
    const lastReview = recentReviews[0];
    if (lastReview && lastReview.nextReviewDate) {
      const daysUntilReview = Math.ceil((new Date(lastReview.nextReviewDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilReview <= 30 && daysUntilReview > 0) {
        upcomingEvents.push({
          type: 'performance_review',
          title: 'Performance Review Due',
          date: lastReview.nextReviewDate,
          daysRemaining: daysUntilReview,
          priority: daysUntilReview <= 7 ? 'high' : 'medium'
        });
      }
    }
    
    // Probation end
    if (employee.probationEndDate) {
      const daysUntilProbationEnd = Math.ceil((new Date(employee.probationEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilProbationEnd <= 15 && daysUntilProbationEnd > 0) {
        upcomingEvents.push({
          type: 'probation_end',
          title: 'Probation Period Ending',
          date: employee.probationEndDate,
          daysRemaining: daysUntilProbationEnd,
          priority: 'high'
        });
      }
    }
    
    // Generate insights and recommendations
    const insights = [];
    
    if (monthlyAttendance.attendancePercentage < 85) {
      insights.push({
        type: 'warning',
        category: 'attendance',
        message: `Attendance is below average at ${monthlyAttendance.attendancePercentage}%. Consider improving consistency.`,
        suggestion: 'Schedule a meeting to discuss attendance concerns and provide support.'
      });
    }
    
    if (monthlyAttendance.lateCount > 5) {
      insights.push({
        type: 'warning',
        category: 'punctuality',
        message: `${monthlyAttendance.lateCount} late arrivals this month.`,
        suggestion: 'Review shift timings or discuss transportation/personal challenges.'
      });
    }
    
    if ((monthlyAttendance.overtimeHours || 0) > 20) {
      insights.push({
        type: 'info',
        category: 'overtime',
        message: `High overtime hours: ${monthlyAttendance.overtimeHours} this month.`,
        suggestion: 'Consider workload distribution or additional staffing.'
      });
    }
    
    if (monthlyAttendance.attendancePercentage >= 95 && (monthlyAttendance.lateCount || 0) <= 2) {
      insights.push({
        type: 'success',
        category: 'performance',
        message: 'Excellent attendance and punctuality this month!',
        suggestion: 'Consider for recognition or performance incentives.'
      });
    }

    const dashboardData = {
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department,
        profilePicture: employee.profilePicture,
        joinDate: employee.joinDate,
        contractType: employee.contractType
      },
      currentStatus: {
        isPresent: todayAttendance?.isPresent || false,
        loginTime: todayAttendance?.loginTime,
        logoutTime: todayAttendance?.logoutTime,
        hoursWorked: todayAttendance?.hoursWorked || 0,
        status: todayAttendance?.status || 'absent',
        onBreak: todayAttendance?.breaks?.some(b => !b.endTime) || false
      },
      monthlyStats: {
        attendance: monthlyAttendance,
        salary: salaryData,
        leaveBalance: currentLeaveBalance
      },
      weeklyAttendance: last7Days,
      trends: trends,
      recentReviews: recentReviews,
      upcomingEvents: upcomingEvents,
      insights: insights,
      quickActions: [
        {
          id: 'apply_leave',
          title: 'Apply for Leave',
          icon: 'calendar',
          available: true
        },
        {
          id: 'view_payslip',
          title: 'View Payslip',
          icon: 'receipt',
          available: true
        },
        {
          id: 'update_profile',
          title: 'Update Profile',
          icon: 'user',
          available: true
        },
        {
          id: 'performance_goals',
          title: 'Performance Goals',
          icon: 'target',
          available: recentReviews.length > 0
        }
      ]
    };

    sendResponse(res, 200, true, 'Employee dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    handleError(res, error, 'Failed to retrieve dashboard data', { employeeId: req.params.id });
  }
});

// Update employee shift timing
router.put('/:id/shift', auth, adminAuth, validateEmployeeId, async (req, res) => {
  try {
    const { shiftTiming } = req.body;
    
    if (!shiftTiming || !shiftTiming.startTime || !shiftTiming.endTime) {
      return sendResponse(res, 400, false, 'Valid shift timing with startTime and endTime is required');
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        shiftTiming: {
          ...shiftTiming,
          type: shiftTiming.type || 'fixed'
        },
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).select('name employeeId shiftTiming');
    
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }
    
    sendResponse(res, 200, true, 'Shift timing updated successfully', {
      employee: {
        name: employee.name,
        employeeId: employee.employeeId
      },
      shiftTiming: employee.shiftTiming
    });
  } catch (error) {
    handleError(res, error, 'Failed to update shift timing', { employeeId: req.params.id });
  }
});

// Get comprehensive reports
router.get('/reports/comprehensive', auth, adminAuth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department,
      role,
      reportType = 'summary'
    } = req.query;
    
    if (!startDate || !endDate) {
      return sendResponse(res, 400, false, 'Start date and end date are required');
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return sendResponse(res, 400, false, 'End date must be after start date');
    }
    
    let query = { isActive: true };
    if (department) query.department = department;
    if (role) query.role = role;
    
    const employees = await Employee.find(query);
    
    const report = {
      period: `${startDate} to ${endDate}`,
      generatedAt: new Date().toISOString(),
      filters: { department, role },
      summary: {
        totalEmployees: employees.length,
        totalWorkingDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
        totalPresent: 0,
        totalAbsent: 0,
        totalHours: 0,
        totalOvertimeHours: 0,
        totalSalaryPaid: 0
      },
      departmentBreakdown: {},
      roleBreakdown: {},
      topPerformers: [],
      attendanceIssues: [],
      salaryBreakdown: {
        totalBaseSalary: 0,
        totalOvertimePay: 0,
        totalDeductions: 0,
        totalNetPay: 0
      }
    };
    
    const employeeDetails = [];
    
    employees.forEach(emp => {
      // Filter attendance within date range
      const attendanceInRange = emp.attendance.filter(att => 
        att.date >= start && att.date <= end
      );
      
      const presentDays = attendanceInRange.filter(att => att.isPresent).length;
      const absentDays = attendanceInRange.filter(att => !att.isPresent).length;
      const totalHours = attendanceInRange.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);
      const overtimeHours = attendanceInRange.reduce((sum, att) => sum + (att.overtimeHours || 0), 0);
      const lateCount = attendanceInRange.filter(att => att.status === 'late').length;
      const earlyLeaveCount = attendanceInRange.filter(att => att.status === 'early-leave').length;
      
      // Calculate attendance percentage
      const workingDays = presentDays + absentDays;
      const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
      const punctualityScore = presentDays > 0 ? Math.round(((presentDays - lateCount - earlyLeaveCount) / presentDays) * 100) : 0;
      
      // Salary calculation (simplified for report period)
      const dailyBaseSalary = emp.salary.base / 30; // Assuming 30 days per month
      const basePay = dailyBaseSalary * presentDays;
      const overtimePay = (emp.salary.overtime || emp.hourlyRate * 1.5 || 0) * overtimeHours;
      const grossPay = basePay + overtimePay + (emp.salary.bonus || 0);
      const netPay = grossPay - (emp.salary.deductions || 0);
      
      // Update summary
      report.summary.totalPresent += presentDays;
      report.summary.totalAbsent += absentDays;
      report.summary.totalHours += totalHours;
      report.summary.totalOvertimeHours += overtimeHours;
      report.summary.totalSalaryPaid += netPay;
      
      // Update salary breakdown
      report.salaryBreakdown.totalBaseSalary += basePay;
      report.salaryBreakdown.totalOvertimePay += overtimePay;
      report.salaryBreakdown.totalDeductions += (emp.salary.deductions || 0);
      report.salaryBreakdown.totalNetPay += netPay;
      
      // Department breakdown
      if (!report.departmentBreakdown[emp.department]) {
        report.departmentBreakdown[emp.department] = {
          employees: 0,
          totalPresent: 0,
          totalHours: 0,
          averageAttendance: 0,
          totalSalary: 0
        };
      }
      const deptStats = report.departmentBreakdown[emp.department];
      deptStats.employees++;
      deptStats.totalPresent += presentDays;
      deptStats.totalHours += totalHours;
      deptStats.totalSalary += netPay;
      
      // Role breakdown
      if (!report.roleBreakdown[emp.role]) {
        report.roleBreakdown[emp.role] = {
          employees: 0,
          totalPresent: 0,
          averageAttendance: 0,
          averageSalary: 0
        };
      }
      const roleStats = report.roleBreakdown[emp.role];
      roleStats.employees++;
      roleStats.totalPresent += presentDays;
      
      // Employee details for further analysis
      employeeDetails.push({
        id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        role: emp.role,
        attendancePercentage,
        punctualityScore,
        presentDays,
        absentDays,
        totalHours,
        overtimeHours,
        lateCount,
        earlyLeaveCount,
        netPay,
        performanceScore: Math.round((attendancePercentage * 0.4 + punctualityScore * 0.3 + Math.min(totalHours/160, 1) * 100 * 0.3) * 100) / 100
      });
    });
    
    // Calculate department averages
    Object.keys(report.departmentBreakdown).forEach(dept => {
      const stats = report.departmentBreakdown[dept];
      const deptEmployees = employeeDetails.filter(emp => emp.department === dept);
      stats.averageAttendance = Math.round(deptEmployees.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / deptEmployees.length);
    });
    
    // Calculate role averages
    Object.keys(report.roleBreakdown).forEach(role => {
      const stats = report.roleBreakdown[role];
      const roleEmployees = employeeDetails.filter(emp => emp.role === role);
      stats.averageAttendance = Math.round(roleEmployees.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / roleEmployees.length);
      stats.averageSalary = Math.round(roleEmployees.reduce((sum, emp) => sum + emp.netPay, 0) / roleEmployees.length);
    });
    
    // Top performers (top 10 by performance score)
    report.topPerformers = employeeDetails
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10)
      .map(emp => ({
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        role: emp.role,
        performanceScore: emp.performanceScore,
        attendancePercentage: emp.attendancePercentage,
        punctualityScore: emp.punctualityScore
      }));
    
    // Attendance issues (employees with < 80% attendance or > 5 late arrivals)
    report.attendanceIssues = employeeDetails
      .filter(emp => emp.attendancePercentage < 80 || emp.lateCount > 5)
      .map(emp => ({
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        role: emp.role,
        attendancePercentage: emp.attendancePercentage,
        lateCount: emp.lateCount,
        earlyLeaveCount: emp.earlyLeaveCount,
        issues: [
          ...(emp.attendancePercentage < 80 ? [`Low attendance: ${emp.attendancePercentage}%`] : []),
          ...(emp.lateCount > 5 ? [`Frequent late arrivals: ${emp.lateCount} times`] : []),
          ...(emp.earlyLeaveCount > 3 ? [`Early leaves: ${emp.earlyLeaveCount} times`] : [])
        ]
      }));
    
    // Round summary numbers
    report.summary.totalSalaryPaid = Math.round(report.summary.totalSalaryPaid);
    report.summary.totalHours = Math.round(report.summary.totalHours * 100) / 100;
    report.summary.totalOvertimeHours = Math.round(report.summary.totalOvertimeHours * 100) / 100;
    
    Object.keys(report.salaryBreakdown).forEach(key => {
      report.salaryBreakdown[key] = Math.round(report.salaryBreakdown[key]);
    });
    
    // Include detailed employee data if requested
    if (reportType === 'detailed') {
      report.employeeDetails = employeeDetails;
    }
    
    sendResponse(res, 200, true, 'Comprehensive report generated successfully', report);
  } catch (error) {
    handleError(res, error, 'Failed to generate comprehensive report');
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  sendResponse(res, 200, true, 'Employee service is healthy', {
    timestamp: new Date().toISOString(),
    service: 'employee-management',
    version: '1.0.0',
    status: 'operational'
  });
});

module.exports = router;