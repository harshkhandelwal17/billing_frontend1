const express = require('express');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    const { active, role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (active !== undefined) query.isActive = active === 'true';
    if (role) query.role = role;

    const employees = await Employee.find(query)
      .select('-attendance')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(query);

    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single employee with attendance
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new employee (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      salary,
      address,
      emergencyContact
    } = req.body;

    // Check if employee with email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const employee = new Employee({
      name,
      email,
      phone,
      role,
      salary,
      address,
      emergencyContact
    });

    await employee.save();

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      salary,
      address,
      emergencyContact,
      isActive
    } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        role,
        salary,
        address,
        emergencyContact,
        isActive
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance - Login
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Check if already checked in today
    const existingAttendance = employee.attendance.find(
      att => att.date.toISOString().split('T')[0] === todayString
    );

    if (existingAttendance && existingAttendance.loginTime) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (existingAttendance) {
      existingAttendance.loginTime = today;
      existingAttendance.isPresent = true;
    } else {
      employee.attendance.push({
        date: today,
        loginTime: today,
        isPresent: true
      });
    }

    await employee.save();

    res.json({
      message: 'Check-in successful',
      loginTime: today
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance - Logout
router.post('/:id/checkout', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const todayAttendance = employee.attendance.find(
      att => att.date.toISOString().split('T')[0] === todayString
    );

    if (!todayAttendance || !todayAttendance.loginTime) {
      return res.status(400).json({ message: 'Not checked in today' });
    }

    if (todayAttendance.logoutTime) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    todayAttendance.logoutTime = today;
    
    // Calculate hours worked
    const hoursWorked = (today - todayAttendance.loginTime) / (1000 * 60 * 60);
    todayAttendance.hoursWorked = Math.round(hoursWorked * 100) / 100;

    await employee.save();

    res.json({
      message: 'Check-out successful',
      logoutTime: today,
      hoursWorked: todayAttendance.hoursWorked
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance report
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let attendance = employee.attendance;

    if (month && year) {
      attendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        return attDate.getMonth() === parseInt(month) - 1 && 
               attDate.getFullYear() === parseInt(year);
      });
    }

    const presentDays = attendance.filter(att => att.isPresent).length;
    const totalHours = attendance.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);

    res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        salary: employee.salary
      },
      attendance: attendance.sort((a, b) => new Date(b.date) - new Date(a.date)),
      summary: {
        presentDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate monthly salary
router.get('/:id/salary/:month/:year', auth, adminAuth, async (req, res) => {
  try {
    const { month, year } = req.params;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const monthAttendance = employee.attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate.getMonth() === parseInt(month) - 1 && 
             attDate.getFullYear() === parseInt(year);
    });

    const presentDays = monthAttendance.filter(att => att.isPresent).length;
    const totalWorkingDays = new Date(year, month, 0).getDate(); // Days in month
    
    // Calculate salary based on present days
    const dailySalary = employee.salary / totalWorkingDays;
    const earnedSalary = Math.round(dailySalary * presentDays);

    res.json({
      employee: {
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        baseSalary: employee.salary
      },
      period: `${month}/${year}`,
      presentDays,
      totalWorkingDays,
      earnedSalary,
      deduction: employee.salary - earnedSalary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's attendance summary
router.get('/attendance/today', auth, async (req, res) => {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const employees = await Employee.find({ isActive: true });
    
    const attendanceSummary = employees.map(emp => {
      const todayAttendance = emp.attendance.find(
        att => att.date.toISOString().split('T')[0] === todayString
      );
      
      return {
        id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        role: emp.role,
        isPresent: todayAttendance?.isPresent || false,
        loginTime: todayAttendance?.loginTime || null,
        logoutTime: todayAttendance?.logoutTime || null,
        hoursWorked: todayAttendance?.hoursWorked || 0
      };
    });

    const presentCount = attendanceSummary.filter(emp => emp.isPresent).length;
    const totalEmployees = employees.length;

    res.json({
      date: todayString,
      attendanceSummary,
      summary: {
        present: presentCount,
        absent: totalEmployees - presentCount,
        total: totalEmployees
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;