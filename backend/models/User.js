const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      // Never return the password hash by default in any query.
      select: false,
    },
  },
  { timestamps: true }
);

/**
 * Hash the password before persisting whenever it has changed.
 * Keeping this in the model guarantees no plaintext password is ever stored,
 * regardless of which controller saves the document.
 */
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/** Compare a plaintext candidate against the stored hash. */
UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
