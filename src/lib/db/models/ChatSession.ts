import mongoose, { Model, Schema } from 'mongoose'

export interface IChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface IChatSession {
  sessionId: string
  visitorId: string
  messages: IChatMessage[]
  createdAt: Date
  updatedAt: Date
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { _id: false },
)

const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    visitorId: { type: String, required: true, trim: true },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  {
    collection: 'chat_sessions',
    timestamps: true,
  },
)

ChatSessionSchema.index({ visitorId: 1, updatedAt: -1 })

const ChatSession: Model<IChatSession> =
  mongoose.models.ChatSession ??
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema)

export default ChatSession
