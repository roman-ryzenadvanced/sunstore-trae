'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface Ticket {
  id: string
  subject: string
  fromEmail: string
  siteName: string
  status: string
  createdAt: string
  replies: { id: string; body: string; createdAt: string; isAdmin: boolean }[]
}

interface SiteOption {
  id: string
  name: string
}

export function CrmTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [siteFilter, setSiteFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (siteFilter !== 'all') params.set('siteId', siteFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/tickets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [siteFilter, statusFilter])

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites')
      if (res.ok) {
        const data = await res.json()
        setSites(data.sites || data || [])
      }
    } catch {
      // empty
    }
  }, [])

  useEffect(() => {
    fetchTickets()
    fetchSites()
  }, [fetchTickets, fetchSites])

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return
    setSending(true)
    try {
      await fetch(`/api/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      })
      setReply('')
      fetchTickets()
    } catch {
      // empty
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground text-sm">
          Manage customer support across all stores
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tickets found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.fromEmail}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.siteName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === 'open' ? 'default' : 'secondary'}
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Reply Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedTicket?.fromEmail} &middot; Store:{' '}
              {selectedTicket?.siteName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {(selectedTicket?.replies || []).map((r) => (
              <div
                key={r.id}
                className={`rounded-lg border p-3 text-sm ${
                  r.isAdmin
                    ? 'ml-8 bg-primary/5 border-primary/20'
                    : 'mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {r.isAdmin ? 'You' : selectedTicket?.fromEmail}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <Button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="self-end"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Reply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}