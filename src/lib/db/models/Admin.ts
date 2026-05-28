import mongoose, { Model, Schema } from 'mongoose'

export interface IAdmin {
  username: string
  passwordHash: string
  role: 'admin'
  createdAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin'], required: true, default: 'admin' },
  },
  {
    collection: 'admins',
    timestamps: { createdAt: true, updatedAt: false },
  },
)

const Admin: Model<IAdmin> =
  mongoose.models.Admin ?? mongoose.model<IAdmin>('Admin', AdminSchema)

export default Admin
