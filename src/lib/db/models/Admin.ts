import mongoose, { Model, Schema } from 'mongoose'

export interface IAdmin {
  username: string
  passwordHash: string
  role: 'user' | 'admin'
  createdAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], required: true, default: 'user' },
  },
  {
    collection: 'admins',
    timestamps: { createdAt: true, updatedAt: false },
  },
)

// Delete cached model so schema changes are picked up on hot-reload in dev
delete (mongoose.models as Record<string, unknown>).Admin

const Admin: Model<IAdmin> = mongoose.model<IAdmin>('Admin', AdminSchema)

export default Admin
