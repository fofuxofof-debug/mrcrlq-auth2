import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { SESSION_COOKIE_NAME, isAuthenticated } from '@/lib/admin-auth'

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

  // Usuário fake passado pro shell (compatibilidade com componente antigo)
  const fakeUser = {
    id: 'local-admin',
    email: process.env.ADMIN_USERNAME ?? 'admin',
  }

  return <DashboardShell user={fakeUser as never}>{children}</DashboardShell>
}
