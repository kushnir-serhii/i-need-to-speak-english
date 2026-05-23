import mongoose, { Model, Schema } from 'mongoose'

export interface IVisitor {
  visitorId: string
  enrolledAt: Date
  dailyRequests: number
  dailyTokens: number
  lastResetAt: Date
}

const VisitorSchema = new Schema<IVisitor>(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enrolledAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dailyRequests: {
      type: Number,
      min: 0,
      default: 0,
    },
    dailyTokens: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastResetAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: 'visitors',
  }
)

VisitorSchema.index({ enrolledAt: 1 })

const Visitor: Model<IVisitor> =
  mongoose.models.Visitor ?? mongoose.model<IVisitor>('Visitor', VisitorSchema)

export default Visitor
