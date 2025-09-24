const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  rfidTag: { 
    type: String, 
    required: true, 
    unique: true 
  },
  role: { 
    type: String, 
    enum: ["member", "admin", "mentor"], 
    default: "member" 
  },
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  profilePicture: { 
    type: String, 
    default: "" 
  },
  joinedDate: { 
    type: Date, 
    default: Date.now 
  },
  skills: { 
    type: [String], 
    default: [] 
  },
  bio: { 
    type: String, 
    default: "" 
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Transform output to hide password
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users only
UserSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

module.exports = mongoose.model('User', UserSchema);
