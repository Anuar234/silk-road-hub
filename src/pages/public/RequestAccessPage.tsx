import type React from 'react'
import { Building2, Send, ShoppingCart, User } from 'lucide-react'
import { useState } from 'react'
import { Container } from '@widgets/layout/Container'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import { cx } from '@shared/lib/cx'

type AccountType = 'buyer' | 'seller'

export function RequestAccessPage() {
  const [accountType, setAccountType] = useState<AccountType>('buyer')
  const [submitted, setSubmitted] = useState(false)

  return (
    <Container className="py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Запросить доступ</h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Выберите тип аккаунта. Покупателям — упрощённая верификация по email; полная верификация при участии в сделке. Продавцам — полная проверка компании (БИН, должность) до доступа.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-brand-blue/10 bg-brand-blue/5 p-5">
              <div className="text-sm font-semibold text-slate-900">Как проходит подключение</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/70 bg-white px-4 py-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">1. Заявка</div>
                  <div className="mt-1">Укажите тип аккаунта и базовую информацию о компании.</div>
                </div>
                <div className="rounded-xl border border-white/70 bg-white px-4 py-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">2. Проверка</div>
                  <div className="mt-1">Команда проверяет профиль, email и статус компании.</div>
                </div>
                <div className="rounded-xl border border-white/70 bg-white px-4 py-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">3. Доступ</div>
                  <div className="mt-1">После подтверждения открываются каталог, сообщения и сделки.</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-brand-yellow-soft text-brand-blue">
                  <ShoppingCart className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Покупатель</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Верификация по email. Полная верификация (галочка) — при переходе к сделке.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-brand-yellow-soft text-brand-blue">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Продавец</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Обязательна полная проверка: БИН компании, должность, название компании. Доступ после подтверждения.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader title="Тип аккаунта" />
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('buyer')}
                aria-pressed={accountType === 'buyer'}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-[border-color,background-color,color,transform] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]',
                  accountType === 'buyer'
                    ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                    : 'border-border bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                <User className="size-4" />
                Покупатель
              </button>
              <button
                type="button"
                onClick={() => setAccountType('seller')}
                aria-pressed={accountType === 'seller'}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-[border-color,background-color,color,transform] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]',
                  accountType === 'seller'
                    ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                    : 'border-border bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                <Building2 className="size-4" />
                Продавец
              </button>
            </div>

            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Заявка отправлена. Мы свяжемся с вами по указанному email.
              </div>
            ) : (
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmitted(true)
                }}
              >
                <Field label="Email *" htmlFor="request-email">
                  <Input id="request-email" placeholder="name@company.com" type="email" required />
                </Field>

                {accountType === 'seller' && (
                  <>
                    <Field label="Название компании *" htmlFor="request-company-name">
                      <Input id="request-company-name" placeholder="ООО «Компания»" required />
                    </Field>
                    <Field label="БИН компании *" htmlFor="request-bin">
                      <Input id="request-bin" placeholder="12 цифр" required />
                    </Field>
                    <Field label="Должность *" htmlFor="request-position">
                      <Input id="request-position" placeholder="Директор по экспорту" required />
                    </Field>
                    <Field label="Сайт / домен" htmlFor="request-website">
                      <Input id="request-website" placeholder="https://…" />
                    </Field>
                  </>
                )}

                {accountType === 'buyer' && (
                  <Field label="Имя (необязательно)" htmlFor="request-buyer-name">
                    <Input id="request-buyer-name" placeholder="Как к вам обращаться" />
                  </Field>
                )}

                <Field label="Комментарий" htmlFor="request-comment">
                  <Textarea id="request-comment" placeholder="Кратко: чем занимаетесь, страны, объёмы…" />
                </Field>

                <Button
                  type="submit"
                  className="gap-2"
                >
                  <Send className="size-4" />
                  Отправить заявку
                </Button>
              </form>
            )}

            <div className="text-xs text-slate-500">
              Дублируйте на{' '}
              <a className="font-medium text-brand-blue transition-opacity duration-200 hover:underline hover:opacity-90" href="mailto:hello@silkroadhub.io">
                hello@silkroadhub.io
              </a>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4 text-xs text-slate-600">
              Для офлайн-демо форма подтверждает отправку локально. В боевом режиме здесь будет отправка в CRM/операционный контур.
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}
