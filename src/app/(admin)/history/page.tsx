'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useChatStore } from '@/store/useChatStore';

interface SessionMeta {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

type ConfirmDialog = {
  targetSessionId: string;
} | null;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const router = useRouter();
  const visitorId = useUserStore((s) => s.visitorId);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<SessionMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [continuingIds, setContinuingIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    if (!visitorId) return;
    fetch(`/api/history?visitorId=${visitorId}`)
      .then((r) => r.json())
      .then((data: { sessions?: SessionMeta[] }) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visitorId]);

  const toggleSession = useCallback(async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      setExpandedMessages([]);
      return;
    }
    setLoadingSession(true);
    setExpandedId(sessionId);
    try {
      const res = await fetch(`/api/history/${sessionId}?visitorId=${visitorId}`);
      const data = await res.json() as { session?: { messages: SessionMessage[] } };
      setExpandedMessages(data.session?.messages ?? []);
    } catch {
      setExpandedMessages([]);
    } finally {
      setLoadingSession(false);
    }
  }, [expandedId, visitorId]);

  const deleteSession = useCallback(async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await fetch(`/api/history/${sessionId}?visitorId=${visitorId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (expandedId === sessionId) {
        setExpandedId(null);
        setExpandedMessages([]);
      }
    } catch {
      // fail silently
    } finally {
      setDeletingId(null);
    }
  }, [visitorId, expandedId]);

  const doLoadSession = useCallback(async (targetSessionId: string) => {
    setContinuingIds((prev) => new Set(prev).add(targetSessionId));
    try {
      const res = await fetch(`/api/history/${targetSessionId}?visitorId=${visitorId}`);
      const data = await res.json() as { session?: { messages: SessionMessage[] } };
      const rawMessages = data.session?.messages ?? [];
      const messages = rawMessages.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        isStreaming: false,
      }));
      useChatStore.getState().loadSession(messages, targetSessionId);
      router.push('/');
    } catch {
      // fail silently
    } finally {
      setContinuingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetSessionId);
        return next;
      });
    }
  }, [visitorId, router]);

  const saveCurrentAndLoad = useCallback(async (targetSessionId: string) => {
    const state = useChatStore.getState();
    const currentSessionId = state.sessionId;
    const messagesToSave = state.messages.map(({ role, content, timestamp }) => ({
      role,
      content,
      timestamp,
    }));
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, visitorId, messages: messagesToSave }),
      });
    } catch {
      // proceed even if save fails
    }
    await doLoadSession(targetSessionId);
  }, [visitorId, doLoadSession]);

  const handleContinue = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const state = useChatStore.getState();
    const hasUnsaved = state.messages.length > 0 && !state.sessionSaved;
    if (hasUnsaved) {
      setConfirmDialog({ targetSessionId: sessionId });
    } else {
      void doLoadSession(sessionId);
    }
  }, [doLoadSession]);

  const handleDialogSave = useCallback(async () => {
    if (!confirmDialog) return;
    const { targetSessionId } = confirmDialog;
    setConfirmDialog(null);
    await saveCurrentAndLoad(targetSessionId);
  }, [confirmDialog, saveCurrentAndLoad]);

  const handleDialogDiscard = useCallback(async () => {
    if (!confirmDialog) return;
    const { targetSessionId } = confirmDialog;
    setConfirmDialog(null);
    await doLoadSession(targetSessionId);
  }, [confirmDialog, doLoadSession]);

  const handleDialogCancel = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const deleteAllSessions = useCallback(async () => {
    setClearingAll(true);
    try {
      await fetch(`/api/history?visitorId=${visitorId}`, { method: 'DELETE' });
      setSessions([]);
      setExpandedId(null);
      setExpandedMessages([]);
    } catch {
      // fail silently
    } finally {
      setClearingAll(false);
      setClearAllDialog(false);
    }
  }, [visitorId]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#0D1117] px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-[--font-inter] text-2xl font-bold text-[#F0F6FC]">
          History
        </h1>
        {sessions.length > 0 && (
          <button
            onClick={() => setClearAllDialog(true)}
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Clear all history
          </button>
        )}
      </div>

      {loading && (
        <p className="text-sm text-[#8B949E]">Loading…</p>
      )}

      {!loading && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-[#8B949E] text-sm">No conversations yet.</p>
          <p className="text-[#8B949E] text-xs">Start a chat and your sessions will appear here.</p>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sessions.map((session) => {
            const isExpanded = expandedId === session.sessionId;
            const isContinuing = continuingIds.has(session.sessionId);
            return (
              <li key={session.sessionId}>
                {/* Session card */}
                <div
                  onClick={() => void toggleSession(session.sessionId)}
                  className="cursor-pointer rounded-lg border border-[#30363D] bg-[#161B22] p-4 transition-colors hover:border-[#2F81F7]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-[#F0F6FC]">
                        {session.preview || '(empty)'}
                      </p>
                      <p className="mt-1 text-xs text-[#8B949E]">
                        {formatDate(session.updatedAt)} · {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleContinue(e, session.sessionId)}
                        disabled={isContinuing}
                        className="rounded px-2 py-1 text-xs font-medium text-[#2F81F7] border border-[#2F81F7]/40 hover:bg-[#2F81F7]/10 transition-colors disabled:opacity-40"
                        aria-label="Continue this conversation"
                      >
                        {isContinuing ? 'Loading…' : 'Continue'}
                      </button>
                      <button
                        onClick={(e) => void deleteSession(e, session.sessionId)}
                        disabled={deletingId === session.sessionId}
                        className="rounded p-1 text-[#8B949E] hover:text-red-400 transition-colors disabled:opacity-40"
                        aria-label="Delete session"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-[#8B949E] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded messages */}
                {isExpanded && (
                  <div className="mt-1 rounded-lg border border-[#30363D] bg-[#0D1117] p-4">
                    {loadingSession ? (
                      <p className="text-xs text-[#8B949E]">Loading messages…</p>
                    ) : expandedMessages.length === 0 ? (
                      <p className="text-xs text-[#8B949E]">No messages.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {expandedMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm text-white whitespace-pre-wrap ${
                              msg.role === 'user'
                                ? 'ml-auto bg-[#2F81F7] rounded-br-sm'
                                : 'mr-auto bg-[#161B22] border border-[#30363D] rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Clear all history dialog */}
      {clearAllDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363D] bg-[#161B22] p-6 shadow-2xl">
            <p className="mb-4 text-sm text-[#F0F6FC]">
              Delete all {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}? This cannot be undone.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => void deleteAllSessions()}
                disabled={clearingAll}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-40"
              >
                {clearingAll ? 'Deleting…' : 'Delete all'}
              </button>
              <button
                onClick={() => setClearAllDialog(false)}
                disabled={clearingAll}
                className="w-full rounded-lg px-4 py-2 text-sm text-[#8B949E] hover:text-[#F0F6FC] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save/Discard/Cancel dialog */}
      {confirmDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363D] bg-[#161B22] p-6 shadow-2xl">
            <p className="mb-4 text-sm text-[#F0F6FC]">
              You have an unsaved conversation. Save it before opening this one?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => void handleDialogSave()}
                className="w-full rounded-lg bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white hover:bg-[#388bfd] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => void handleDialogDiscard()}
                className="w-full rounded-lg border border-[#30363D] px-4 py-2 text-sm font-medium text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleDialogCancel}
                className="w-full rounded-lg px-4 py-2 text-sm text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
