import { Mail, MapPin, Phone, Globe } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'

export function ContactsPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Контакты</h1>
        <p className="mt-2 text-base text-slate-600">
          Свяжитесь с командой Silk Road Hub для вопросов по платформе, партнёрству или поддержке
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <ContactCard
            icon={<Mail className="size-5" />}
            title="Email"
            value="info@silkroadhub.kz"
            href="mailto:info@silkroadhub.kz"
          />
          <ContactCard
            icon={<Phone className="size-5" />}
            title="Телефон"
            value="+7 (717) 272-00-00"
            href="tel:+77172720000"
          />
          <ContactCard
            icon={<MapPin className="size-5" />}
            title="Адрес"
            value="г. Астана, ул. Мангилик Ел, 55/22, БЦ «Silk Way»"
          />
          <ContactCard
            icon={<Globe className="size-5" />}
            title="Сайт"
            value="silkroadhub.kz"
            href="https://silkroadhub.kz"
          />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader title="QazTrade" />
            <CardContent className="text-sm text-slate-600">
              Центр развития торговой политики «QazTrade» — содействие экспорту несырьевых товаров из Казахстана.
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="KazakhExport" />
            <CardContent className="text-sm text-slate-600">
              Экспортная кредитная компания — страхование и финансирование экспортных операций казахстанских производителей.
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Kazakh Invest" />
            <CardContent className="text-sm text-slate-600">
              Национальная компания по привлечению инвестиций — сопровождение инвестиционных проектов на территории РК.
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}

function ContactCard({ icon, title, value, href }: { icon: React.ReactNode; title: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
        <div className="mt-0.5 text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardContent className="py-4">
        {href ? (
          <a href={href} className="block transition-opacity hover:opacity-80" target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
            {content}
          </a>
        ) : content}
      </CardContent>
    </Card>
  )
}
