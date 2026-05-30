import { useEffect, useState } from 'react'
import { Bell, CheckCircle, RefreshCcw, Trash2 } from 'lucide-react'
import { saveToken } from '../api/notifications'
import { EmptyState } from '../components/EmptyState'
import {
  clearNotifications,
  getNotifications,
  markAllRead,
  markRead,
} from '../notifications/notificationStore'
import type { NotificationItem } from '../types/notification'

export const NotificationsPage = () => {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const refresh = () => setItems(getNotifications())

  useEffect(() => {
    refresh()
  }, [])

  const unreadCount = items.filter((item) => !item.isRead).length

  const handleMarkAll = () => {
    setItems(markAllRead())
  }

  const handleClear = () => {
    setItems(clearNotifications())
  }

  const handleSaveToken = async () => {
    if (!token.trim()) return
    setStatus(null)
    try {
      await saveToken(token.trim())
      setStatus('Token saved to backend.')
      setToken('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save token'
      setStatus(message)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Updates</p>
          <h1 className="text-2xl font-semibold text-ink">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount ? (
            <button
              type="button"
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-ink-muted"
              onClick={handleMarkAll}
            >
              Mark all read
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Clear all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications yet"
          subtitle="Substitution approvals and reminders will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setItems(markRead(item.id))}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                item.isRead
                  ? 'border-border bg-white'
                  : 'border-brand/40 bg-brand/10'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  item.isRead
                    ? 'bg-ink-muted/10 text-ink-muted'
                    : 'bg-brand/20 text-brand'
                }`}
              >
                {item.isRead ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {item.title}
                </span>
                <span className="block text-xs text-ink-muted">{item.body}</span>
                {item.receivedAt ? (
                  <span className="mt-1 block text-[10px] text-ink-muted">
                    {new Date(item.receivedAt).toLocaleString()}
                  </span>
                ) : null}
              </span>
              {!item.isRead ? (
                <span className="mt-2 h-2 w-2 rounded-full bg-brand" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="text-sm font-semibold text-ink">Register device token</div>
        <p className="mt-1 text-xs text-ink-muted">
          Paste an FCM token to register this device for push notifications.
        </p>
        <div className="mt-3 grid gap-2">
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Paste token from web push setup"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <button
            type="button"
            className="self-start rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white"
            onClick={handleSaveToken}
            disabled={!token.trim()}
          >
            Save token
          </button>
          {status ? <div className="text-xs text-ink-muted">{status}</div> : null}
        </div>
      </div>
    </div>
  )
}
