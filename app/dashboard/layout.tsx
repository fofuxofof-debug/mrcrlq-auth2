import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { SESSION_COOKIE_NAME, USER_COOKIE_NAME, isAuthenticated } from '@/lib/admin-auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!isAuthenticated(session)) {
    redirect('/login')
  }

  // Pega o nome do usuário que de fato logou (cookie definido em /api/auth/session)
  const username = cookieStore.get(USER_COOKIE_NAME)?.value || 'admin'

  // O DashboardShell espera um objeto { id, email }. O "email" é só o display name.
  const shellUser = {
    id: 'panel-admin',
    email: username,
  }

  return <DashboardShell user={shellUser as never}>{children}</DashboardShell>
}
