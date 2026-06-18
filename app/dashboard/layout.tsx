import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'

const SESSION_COOKIE = 'panel_session'
const VALID_TOKEN = 'mrcrlq:authorized'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)?.value

  if (session !== VALID_TOKEN) {
    redirect('/login')
  }

  // Usuário fake passado pro shell (compatibilidade com componente antigo)
  const fakeUser = {
    id: 'local-admin',
    email: 'mrcrlq@local',
  }

  return <DashboardShell user={fakeUser as never}>{children}</DashboardShell>
}
