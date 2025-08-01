const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  loginTime: Date,
  logoutTime: Date,
  isPresent: {
    type: Boolean,
    default: false
  },
  hoursWorked: {
    type: Number,
    default: 0
  }
});

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['waiter', 'cook', 'cashier', 'cleaner', 'manager']
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attendance: [attendanceSchema],
  address: String,
  emergencyContact: String
}, {
  timestamps: true
});

// Generate employee ID before saving
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);