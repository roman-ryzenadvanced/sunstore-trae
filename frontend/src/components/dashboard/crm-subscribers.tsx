'use client'

import { useCallback, useEffect, useState } from 'react'
import { Send, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
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
import { Skeleton } from '@/components/ui/skeleton'

interface Subscriber {
  id: string
  email: string
  siteName: string
  siteId: string
  status: string
  createdAt: string
}

interface SiteOption {
  id: string
  name: string
}

export function CrmSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [siteFilter, setSiteFilter] = useState('all')

  // Broadcast dialog
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastSite, setBroadcastSite] = useState('all')
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (siteFilter !== 'all') params.set('siteId', siteFilter)
      const res = await fetch(`/api/subscribers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || data || [])
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
    }
  }, [siteFilter])

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
    fetchSubscribers()
    fetchSites()
  }, [fetchSubscribers, fetchSites])

  const handleBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return
    setSending(true)
    setMsg('')
    try {
      const body: Record<string, string> = {
        subject: broadcastSubject,
        body: broadcastBody,
      }
      if (broadcastSite !== 'all') body.siteId = broadcastSite
      const res = await fetch('/api/subscribers/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setMsg('Broadcast sent successfully')
        setBroadcastOpen(false)
        setBroadcastSubject('')
        setBroadcastBody('')
      } else {
        setMsg('Failed to send broadcast')
      }
    } catch {
      setMsg('Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground text-sm">
            Manage newsletter subscribers across all stores
          </p>
        </div>
        <Button onClick={() => setBroadcastOpen(true)}>
          <Mail className="size-4" />
          Broadcast Email
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
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
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subscribers found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Subscribed
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.siteName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Broadcast Email</DialogTitle>
            <DialogDescription>
              Send an email to your subscribers
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Target Store</Label>
              <Select value={broadcastSite} onValueChange={setBroadcastSite}>
                <SelectTrigger className="w-full">
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
            </div>
            <div className="flex flex-col gap-2">
              <Label>Subject</Label>
              <Input
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Newsletter subject"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Body (HTML supported)</Label>
              <Textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="<h1>Hello!</h1><p>Check out our new products...</p>"
                className="min-h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBroadcastOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={
                sending ||
                !broadcastSubject.trim() ||
                !broadcastBody.trim()
              }
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}