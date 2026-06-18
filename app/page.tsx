'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Eye, Shield, Headset, Lock,
  Cpu, Sparkles, Star, Zap, MessageCircle, Plus, Minus,
} from 'lucide-react'
import { SiteTopbar } from '@/components/site-topbar'
import { SiteFooter } from '@/components/site-footer'
import { PricingCard } from '@/components/pricing-card'

// Count-up animado pros stats
function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const dur = 1800
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(eased * to))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <span>{prefix}{n.toLocaleString('pt-BR')}{suffix}</span>
}

// FAQ accordion
function FAQItem({ q, a, delay = 0 }: { q: string; a: string; delay?: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="reveal reveal-up rounded-2xl border border-zinc-200/80 overflow-hidden"
      style={{ backgroundColor: 'rgb(255,255,255)', animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left text-zinc-900 hover:bg-[rgb(248,248,248)]"
      >
        <span className="font-semibold text-sm sm:text-base">{q}</span>
        <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-[rgb(245,245,245)]">
          {open ? <Minus className="h-3.5 w-3.5 text-zinc-700" /> : <Plus className="h-3.5 w-3.5 text-zinc-700" />}
        </span>
      </button>
      <div
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-zinc-600 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  // Scroll reveal
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )

    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div
      className="bg-sky relative min-h-screen overflow-x-hidden text-zinc-900"
    >
      <SiteTopbar />

      {/* ===== Background: nuvens azuladas (só desktop, escondidas no mobile via CSS) ===== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
        <div className="cloud cloud-3" />
      </div>

      {/* ===== HERO ===== */}
      <section
        id="home"
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 sm:px-6 pt-28 sm:pt-32 pb-16"
      >
        <div className="flex flex-col items-center gap-6 sm:gap-8 text-center max-w-3xl w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs uppercase tracking-widest text-zinc-600 card-in backdrop-blur-md shadow-sm">
            <Sparkles className="h-3 w-3" />
            <span>Cheats Indetectáveis</span>
          </div>

          <h1
            className="logo-shimmer-dark logo-glow-dark text-6xl sm:text-7xl md:text-9xl font-black tracking-tight card-in leading-none"
            style={{ animationDelay: '100ms' }}
          >
            Mrclrlq
          </h1>

          <p
            className="text-base sm:text-lg md:text-xl text-zinc-600 max-w-xl px-2 card-in"
            style={{ animationDelay: '200ms' }}
          >
            Vendemos qualidade, não <span className="text-zinc-400 line-through">hype</span>.
            <br />
            <span className="text-zinc-900 font-semibold">Cheats premium</span> com tecnologia anti-detecção.
          </p>

          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto card-in"
            style={{ animationDelay: '300ms' }}
          >
            <a
              href="https://discord.gg/ZCWxPCyc7B"
              target="_blank"
              rel="noopener noreferrer"
              className="button-shine group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-black hover:scale-[1.04] active:scale-[0.97] hover:shadow-[0_0_36px_rgba(0,0,0,0.18)]"
            >
              Comprar Agora
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-500" />
            </a>
            <a
              href="https://discord.gg/ZCWxPCyc7B"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-700 hover:border-zinc-500 hover:text-zinc-900 hover:bg-[rgb(245,245,245)]"
            >
              <MessageCircle className="h-4 w-4" />
              Discord
            </a>
          </div>

          {/* Stats */}
          <div
            className="mt-10 sm:mt-14 grid grid-cols-3 gap-4 sm:gap-12 w-full max-w-xl card-in"
            style={{ animationDelay: '400ms' }}
          >
            {[
              { label: 'Faturados',           value: 27459, prefix: 'R$' },
              { label: 'Clientes satisfeitos', value: 100,  suffix: '%' },
              { label: 'Suporte online',       value: 24,   suffix: '/7' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span
                  className="text-2xl sm:text-3xl font-black text-zinc-900 tabular-nums"
                  style={{ fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}
                >
                  <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative z-10 px-5 sm:px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal reveal-up mb-12 sm:mb-16 flex flex-col items-center text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-zinc-500 font-bold mb-3">━ Recursos ━</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 max-w-2xl leading-tight">
              Por que escolher a <span className="logo-shimmer-dark">Mrclrlq</span>?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-lg">
              A solução completa pra quem leva o jogo a sério.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Eye,    title: 'Indetectável',  desc: 'Tecnologia anti-ban de última geração. Seu acesso nunca será detectado.', delay: 0 },
              { icon: Headset,title: 'Suporte VIP',   desc: 'Atendimento exclusivo no Discord com resposta em menos de 5 minutos.',  delay: 120 },
              { icon: Lock,   title: 'Privacidade',   desc: '100% anônimo. Não coletamos dados pessoais nem informações do dispositivo.', delay: 240 },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="reveal reveal-up hover-lift relative overflow-hidden rounded-2xl border border-zinc-200/80 p-6 sm:p-7 group shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  style={{ backgroundColor: 'rgb(255,255,255)', animationDelay: `${f.delay}ms` }}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/[0.06] ring-1 ring-zinc-900/10 transition-all duration-500 group-hover:bg-zinc-900/10 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5 text-zinc-900" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative z-10 px-5 sm:px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="reveal reveal-up mb-12 sm:mb-16 flex flex-col items-center text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-zinc-500 font-bold mb-3">━ Produtos ━</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 max-w-2xl leading-tight">
              Escolha o seu plano
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-lg">
              Acesso imediato após confirmação. Suporte dedicado em todos os planos.
            </p>
          </div>

          {/* PUBLIC */}
          <div className="mb-16">
            <div className="reveal reveal-up mb-6 flex items-end justify-between flex-wrap gap-3">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-1">FreeFire · Public</span>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900">Plano Public</h3>
              </div>
              <p className="text-sm text-zinc-500 max-w-md">Praticidade, estabilidade e excelente custo-benefício.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <PricingCard
                name="Mensal"
                description="Melhor custo-benefício"
                price="R$200"
                pricePeriod="/mês"
                priceUsd="$40 USD"
                features={['Aimbot + ESP', 'Anti-Ban premium', 'Atualizações frequentes', 'Suporte no Discord']}
                delay={0}
              />
              <PricingCard
                name="Permanente"
                description="Acesso vitalício"
                price="R$350"
                pricePeriod="único"
                priceUsd="$70 USD"
                badge="Mais popular"
                highlight
                features={['Acesso permanente', 'Recursos atuais e futuros', 'Prioridade em updates', 'Suporte dedicado', 'Discord privado']}
                delay={120}
              />
            </div>
          </div>

          {/* PRIVATE */}
          <div className="mb-16">
            <div className="reveal reveal-up mb-6 flex items-end justify-between flex-wrap gap-3">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-1">FreeFire · Private</span>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900">Plano Private</h3>
              </div>
              <p className="text-sm text-zinc-500 max-w-md">Build privado com anti-screenshare avançado.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <PricingCard
                name="Mensal"
                description="Acesso completo"
                price="R$700"
                pricePeriod="/mês"
                priceUsd="$140 USD"
                features={[
                  'Todos os recursos Private',
                  'Instalação simplificada',
                  'Atualizações constantes',
                  'Suporte no Discord',
                ]}
                delay={0}
              />
              <PricingCard
                name="Permanente"
                description="Acesso vitalício"
                price="R$1.000"
                pricePeriod="único"
                priceUsd="$200 USD"
                badge="Premium"
                highlight
                features={[
                  'Acesso permanente',
                  'Todos os recursos Private',
                  'Instalação simplificada',
                  'Atualizações vitalícias',
                  'Suporte dedicado',
                  'Discord privado',
                ]}
                delay={120}
              />
            </div>
          </div>

          {/* REMOTE */}
          <div className="mb-16">
            <div className="reveal reveal-up mb-6 flex items-end justify-between flex-wrap gap-3">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-1">FreeFire · Remote</span>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900">Plano Remote</h3>
              </div>
              <p className="text-sm text-zinc-500 max-w-md">Controle total via web. Sem interface no PC.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <PricingCard
                name="Mensal"
                description="Acesso completo"
                price="R$400"
                pricePeriod="/mês"
                priceUsd="$80 USD"
                features={[
                  'PC + Celular',
                  'Painel web em tempo real',
                  'Sem interface no cliente',
                  'Atualizações constantes',
                  'Suporte no Discord',
                ]}
                delay={0}
              />
              <PricingCard
                name="Permanente"
                description="Acesso vitalício"
                price="R$600"
                pricePeriod="único"
                priceUsd="$120 USD"
                badge="Novo"
                highlight
                features={[
                  'Acesso permanente',
                  'PC + Celular',
                  'Painel web em tempo real',
                  'Sem interface no cliente',
                  'Atualizações vitalícias',
                  'Suporte VIP',
                  'Discord privado',
                ]}
                delay={120}
              />
            </div>
          </div>

          {/* VALORANT */}
          <div className="mb-4">
            <div className="reveal reveal-up mb-6 flex items-end justify-between flex-wrap gap-3">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-1">Valorant · Aimcolor</span>
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900">Aimcolor</h3>
              </div>
              <p className="text-sm text-zinc-500 max-w-md">Aimbot, trigger bot e aim assist para Valorant.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <PricingCard
                name="Semanal"
                description="Teste por 7 dias"
                price="R$50"
                pricePeriod="/semana"
                priceUsd="$10 USD"
                features={['Acesso por 7 dias', 'Todos os recursos', 'Suporte no Discord']}
                delay={0}
              />
              <PricingCard
                name="Mensal"
                description="Melhor custo-benefício"
                price="R$80"
                pricePeriod="/mês"
                priceUsd="$16 USD"
                badge="Recomendado"
                highlight
                features={['Acesso mensal', 'Todos os recursos', 'Suporte no Discord']}
                delay={120}
              />
              <PricingCard
                name="Permanente"
                description="Acesso vitalício"
                price="R$120"
                pricePeriod="único"
                priceUsd="$24 USD"
                features={['Acesso permanente', 'Atualizações vitalícias', 'Suporte dedicado', 'Discord privado']}
                delay={240}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative z-10 px-5 sm:px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="reveal reveal-up mb-10 sm:mb-12 flex flex-col items-center text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-zinc-500 font-bold mb-3">━ FAQ ━</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 max-w-2xl leading-tight">
              Perguntas frequentes
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { q: 'É realmente indetectável?', a: 'Sim. Usamos tecnologia anti-detecção atualizada constantemente, com bypass para anti-cheat e screenshare. Nossa taxa de banimento é praticamente zero.', delay: 0 },
              { q: 'Como recebo o produto após a compra?', a: 'Tudo é feito pelo nosso servidor do Discord. Após entrar, basta abrir um ticket que nossa equipe libera o acesso, envia a key e te orienta na instalação. Suporte humano em minutos, sem burocracia.', delay: 80 },
              { q: 'Funciona com a versão mais recente do jogo?', a: 'Sim. Mantemos o sistema atualizado a cada novo patch. Se houver algum delay temporário, todos os clientes ativos recebem aviso no Discord.', delay: 160 },
              { q: 'Posso usar em mais de um PC?', a: 'O HWID lock vincula a key ao seu hardware. Você pode resetar HWID pelo painel ou contatar o suporte se trocar de PC.', delay: 240 },
              { q: 'Tem suporte 24/7?', a: 'Sim, suporte ativo no Discord com resposta em menos de 5 minutos no horário comercial e até 30 minutos fora.', delay: 320 },
            ].map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} delay={item.delay} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative z-10 px-5 sm:px-6 pb-20 sm:pb-28">
        <div
          className="reveal reveal-zoom mx-auto max-w-4xl rounded-2xl sm:rounded-3xl border border-zinc-200/80 px-6 sm:px-12 py-14 sm:py-20 text-center hover-lift relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          style={{ backgroundColor: 'rgb(255,255,255)' }}
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-zinc-900/[0.05] blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-zinc-900 text-zinc-900" />
              ))}
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-zinc-900 mb-4 leading-tight">
              Pronto para <span className="logo-shimmer-dark">dominar</span> o jogo?
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 mb-8 max-w-md mx-auto">
              Entre no Discord, veja os showcases e tire suas dúvidas. Suporte 24/7.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href="https://discord.gg/ZCWxPCyc7B"
                target="_blank"
                rel="noopener noreferrer"
                className="button-shine group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 sm:px-9 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-black hover:scale-[1.04] active:scale-[0.97] hover:shadow-[0_0_44px_rgba(0,0,0,0.22)]"
              >
                <MessageCircle className="h-4 w-4" />
                Entrar no Discord
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-4 text-sm font-semibold uppercase tracking-wider text-zinc-700 hover:border-zinc-500 hover:text-zinc-900 hover:bg-[rgb(245,245,245)]"
              >
                Ver Produtos
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
