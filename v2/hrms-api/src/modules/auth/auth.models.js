import mongoose from 'mongoose';

// Existing physical collections; auto-create/indexing stays disabled during coexistence.
export const createModels = (connection) => {


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    organizationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "organizations"
      }
    ],

    activeOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organizations"
    },

    lastActiveRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles"
    },

    otp: String,
    otpTimestamp: Date,
    otpAttempts: { type: Number, default: 0 },
    resetPasswordVerifiedAt: Date,
    resetPasswordVerifiedUntil: Date,

    tokenList: [
      {
        token: String,
        organizationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "organizations",
          default: null
        },
        loginTimestamp: String,
        logoutTimestamp: String,
        status: String,
        reason: String
      }
    ],

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    },

    passwordChangeRequired: {
      type: Boolean,
      default: false
    },

    passwordChangedAt: Date,

    lastLoginAt: Date,
    softDeleteMeta: {
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "organizations",
        default: null
      },
      originalEmail: {
        type: String,
        default: null
      },
      deletedAt: {
        type: Date,
        default: null
      }
    }
  },
  { timestamps: true }
);




const orgUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organizations",
      required: true
    },

    roleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "roles",
        required: true
      }
    ]
  },
  { timestamps: true }
);

orgUserSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true }
);




const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    code: {
      type: String,
      required: true,
      unique: true
    },

    timezone: {
      type: String,
      required: true
    },

    currency: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    isSoftDeleted: {
      type: Boolean,
      default: false
    },
    softDeletedAt: {
      type: Date,
      default: null
    },
    softDeletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },

    leaveCycleStartMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: 1   // Apr–Mar
    }

  },
  { timestamps: true }
);




const roleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organizations",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    slug: {
      type: String,
      required: true
    },

    permissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permissions",
        required: true
      }
    ],

    isSystemRole: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

roleSchema.index(
  { organizationId: 1, slug: 1 },
  { unique: true }
);




const permissionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organizations",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    code: {
      type: String,
      required: true
    },

    module: {
      type: String,
      required: true
    },

    description: {
      type: String
    }
  },
  { timestamps: true }
);

permissionSchema.index(
  { organizationId: 1, code: 1 },
  { unique: true }
);



  // Read-only projections for auth; other domains retain ownership of their schema.
  const employeeSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, organizationId: mongoose.Schema.Types.ObjectId, isDeleted: Boolean, dateOfJoining: Date, firstName: String, lastName: String, employeeCode: String, managerId: mongoose.Schema.Types.ObjectId, shiftId: mongoose.Schema.Types.ObjectId, profileImage: String, employmentLifecycleStatus: String, noticeEndDate: Date });
  const settingsSchema = new mongoose.Schema({ organizationId: mongoose.Schema.Types.ObjectId, maxActiveLoginsPerUser: Number, leaveCreditFrequency: String, leaveTypeCreditMode: String });
  const definitions = {
    User: ['users', userSchema, 'users'],
    Membership: ['org_users', orgUserSchema, 'org_users'],
    Organization: ['organizations', organizationSchema, 'organizations'],
    Role: ['roles', roleSchema, 'roles'],
    Permission: ['permissions', permissionSchema, 'permissions'],
    Employee: ['employees', employeeSchema, 'employees'],
    Settings: ['orgSettings', settingsSchema, 'org_settings'],
  };
  return Object.fromEntries(Object.entries(definitions).map(([key, [name, schema, collection]]) => {
    schema.set('autoIndex', false);
    schema.set('autoCreate', false);
    schema.set('bufferCommands', false);
    return [key, connection.models[name] || connection.model(name, schema, collection)];
  }));
};
