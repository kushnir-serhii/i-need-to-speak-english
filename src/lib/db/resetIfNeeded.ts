import type { IVisitor } from '@/lib/db/models/Visitor'
import Visitor from '@/lib/db/models/Visitor'
import type { Document } from 'mongoose'

type VisitorDoc = (Document & IVisitor) | IVisitor

export async function resetIfNeeded(doc: VisitorDoc): Promise<IVisitor> {
  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  if (doc.lastResetAt < todayStart) {
    const updated = await Visitor.findOneAndUpdate(
      { visitorId: doc.visitorId, lastResetAt: { $lt: todayStart } },
      { $set: { dailyRequests: 0, dailyTokens: 0, lastResetAt: todayStart } },
      { new: true }
    )

    if (updated) {
      return updated
    }
  }

  return doc
}
