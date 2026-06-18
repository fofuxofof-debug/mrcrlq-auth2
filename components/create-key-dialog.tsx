'use client'

import React, { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [user, setUser] = useState('')
  const [maxDevices, setMaxDevices] = useState('1')
  const [expiryDays, setExpiryDays] = useState('30')
  const [discordId, setDiscordId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const days = Math.max(Number.parseInt(expiryDays) || 30, 1)
      const devices = Math.max(Number.parseInt(maxDevices) || 1, 1)

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: user || null,
          max_devices: devices,
          expires_in_days: days,
          discord_id: discordId || null,
          // Se discord_id estiver preenchido, usa como key (override)
          custom_key: discordId || null,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erro ao criar key')
      }
      const data = await res.json()
      toast.success(`${data.count} key(s) criada(s) com sucesso!`)

      setUser('')
      setMaxDevices('1')
      setExpiryDays('30')
      setDiscordId('')
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar key')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-200 bg-white text-zinc-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-900">Criar Nova Key</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Configure os parametros da licenca
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-zinc-600">User</Label>
            <Input
              placeholder="Ex: Cliente VIP"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="border-zinc-200 bg-[rgb(248,248,248)] text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-zinc-900/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-zinc-600">Max Dispositivos</Label>
              <Input
                type="number"
                min={1}
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className="border-zinc-200 bg-[rgb(248,248,248)] text-zinc-900 focus-visible:ring-zinc-900/30"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-zinc-600">Validade (dias)</Label>
              <Input
                type="number"
                min={1}
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="border-zinc-200 bg-[rgb(248,248,248)] text-zinc-900 focus-visible:ring-zinc-900/30"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-zinc-600">Discord ID</Label>
            <Input
              placeholder="Ex: 123456789012345678 (vira a key)"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              className="border-zinc-200 bg-[rgb(248,248,248)] text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-zinc-900/30"
            />
            <p className="text-[11px] text-zinc-500">
              Se preenchido, esse valor será usado como a própria key.
            </p>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-zinc-900 text-white hover:bg-black transition-all duration-300 hover:scale-[1.01] active:scale-[0.97]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Key
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
