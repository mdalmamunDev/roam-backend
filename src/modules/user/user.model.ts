import { model, Schema } from 'mongoose';
import { TUser, UserModal } from './user.interface';
import paginate from '../../common/plugins/paginate';
import bcrypt from 'bcrypt';
import { config } from '../../config';
import { UserRole, UserStatus } from './user.constant';

// User Schema Definition
const userSchema = new Schema<TUser, UserModal>(
  {
    sid: {
      type: String,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      // required: [true, 'Phone number is required'],
    },
    address: { type: String },
    dateOfBirth: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    profileImage: {
      type: String,
      default: 'users/user.png',
    },
    wallet: {
      type: Number,
      default: 0.00,
    },

    role: {
      type: String,
      enum: {
        values: UserRole,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [8, 'Password must be at least 8 characters long'],
    },

    status: {
      type: String,
      enum: {
        values: UserStatus,
        message: '{VALUE} is not a valid role',
      },
      default: 'pending',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lastPasswordChange: { type: Date },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: { type: Date },
    step: {
      type: Number,
      default: 1,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply the paginate plugin
userSchema.plugin(paginate);

// Static methods
userSchema.statics.isExistUserById = async function (id: string) {
  return await this.findById(id);
};

userSchema.statics.isExistUserByEmail = async function (email: string) {
  return await this.findOne({ email });
};

userSchema.statics.isMatchPassword = async function (
  password: string,
  hashPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashPassword);
};

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt.saltRounds)
    );
  }

  next();
});


// for location
userSchema.index({ location: '2dsphere' });

// Export the User model
export const User = model<TUser, UserModal>('User', userSchema);
