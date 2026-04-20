import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Badge } from '@shared/ui/Badge'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent } from '@shared/ui/Card'
import { applyOfflineImageFallback } from '@shared/ui/imageFallback'
import { cx } from '@shared/lib/cx'
import {
  ANALYTICS_TAGS,
  getFeaturedPost,
  getPopularPosts,
  getPostsByTag,
  getTypeLabel,
  type AnalyticsPost,
} from '@features/analytics/analyticsData'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type ForumAnnouncement = {
  id: string
  title: string
  dateLabel: string
  city: string
  level: 'Международный' | 'Республиканский'
  status: string
  summary: string
}

const FORUM_ANNOUNCEMENTS: ForumAnnouncement[] = [
  {
    id: 'forum-astana-trade-2026',
    title: 'Astana Trade Forum 2026',
    dateLabel: '12-13 мая 2026',
    city: 'Астана',
    level: 'Международный',
    status: 'Регистрация открыта',
    summary: 'Экспортные контракты и B2B-встречи с международными закупщиками.',
  },
  {
    id: 'agro-export-kz-2026',
    title: 'Agro Export Kazakhstan',
    dateLabel: '27 мая 2026',
    city: 'Костанай',
    level: 'Республиканский',
    status: 'Приём заявок до 15 мая',
    summary: 'Форум по агроэкспорту: логистика, сертификация и выход на новые рынки.',
  },
  {
    id: 'eurasia-logistics-forum-2026',
    title: 'Eurasia Logistics Forum',
    dateLabel: '6-7 июня 2026',
    city: 'Алматы',
    level: 'Международный',
    status: 'Слоты B2B ограничены',
    summary: 'Маршруты, страхование и цифровое сопровождение международных сделок.',
  },
  {
    id: 'industry-invest-week-2026',
    title: 'Industry & Invest Week',
    dateLabel: '18 июня 2026',
    city: 'Караганда',
    level: 'Республиканский',
    status: 'Формируется программа',
    summary: 'Презентации инвестпроектов и встречи с институтами развития.',
  },
]

export function AnalyticsFeedPage() {
  const [params, setParams] = useSearchParams()
  const tag = params.get('tag') ?? ''
  const view = params.get('view') ?? 'analytics'
  const announcementsView = view === 'announcements'

  const featured = getFeaturedPost()
  const popular = getPopularPosts(5)
  const list = getPostsByTag(tag || null)

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        Аналитика
      </h1>
      <p className="mt-2 text-base text-slate-600">
        Разборы, кейсы и новости для экспортёров и байеров.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParams(tag ? { view: 'analytics', tag } : { view: 'analytics' })}
          className={cx(
            'motion-tap rounded-xl border px-3 py-1.5 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
            !announcementsView
              ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
              : 'border-border bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          Материалы
        </button>
        <button
          type="button"
          onClick={() => setParams({ view: 'announcements' })}
          className={cx(
            'motion-tap rounded-xl border px-3 py-1.5 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
            announcementsView
              ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
              : 'border-border bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          Объявления форумов
        </button>
      </div>

      {/* Tag chips */}
      {!announcementsView ? (
        <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParams({ view: 'analytics' })}
          className={cx(
            'motion-tap rounded-xl border px-3 py-1.5 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
            !tag
              ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
              : 'border-border bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          Все
        </button>
        {ANALYTICS_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setParams({ view: 'analytics', tag: t })}
            className={cx(
              'motion-tap rounded-xl border px-3 py-1.5 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
              tag === t
                ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                : 'border-border bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {t}
          </button>
        ))}
        </div>
      ) : null}

      {announcementsView ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FORUM_ANNOUNCEMENTS.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    <CalendarDays className="size-3.5 text-brand-blue" />
                    {announcement.dateLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    <MapPin className="size-3.5 text-brand-blue" />
                    {announcement.city}
                  </span>
                  <span className="inline-flex rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-semibold text-brand-blue">
                    {announcement.level}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{announcement.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{announcement.summary}</p>
                <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {announcement.status}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-8">
          {/* Featured */}
          {featured && !tag && (
            <Card className="overflow-hidden">
              <Link to={`/analytics/${featured.slug}`} className="block">
                <div className="aspect-[21/9] overflow-hidden bg-slate-100">
                  <img
                    src={featured.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]"
                    onError={applyOfflineImageFallback}
                  />
                </div>
                <CardContent className="p-5">
                  <Badge tone="warning" className="mb-2">
                    {getTypeLabel(featured.type)}
                  </Badge>
                  <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
                    {featured.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                    {featured.excerpt}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-brand-blue">
                    Читать →
                  </span>
                </CardContent>
              </Link>
            </Card>
          )}

          {/* List */}
          <div className="space-y-4">
            {list.map((post) => (
              <FeedItem key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Популярное
              </h3>
              <ul className="mt-3 space-y-2">
                {popular.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/analytics/${p.slug}`}
                      className="flex gap-3 rounded-xl px-2 py-1.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                        {p.popular_rank}
                      </span>
                      <span className="line-clamp-2">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Подписка
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Новые материалы раз в неделю на почту.
              </p>
              <ButtonLink
                to="/request-access"
                variant="primary"
                size="sm"
                className="mt-3 w-full"
              >
                Подписаться
              </ButtonLink>
            </CardContent>
          </Card>
        </aside>
      </div>
      )}
    </Container>
  )
}

function FeedItem({ post }: { post: AnalyticsPost }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <img
            src={post.cover_image_url}
            alt=""
            className="size-full object-cover"
            onError={applyOfflineImageFallback}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{formatDate(post.published_at)}</span>
            <span>·</span>
            <span>{post.reading_time_min} мин</span>
          </div>
          <Badge tone="neutral" className="mt-1">
            {getTypeLabel(post.type)}
          </Badge>
          <h3 className="mt-2 text-base font-semibold text-slate-900">
            <Link to={`/analytics/${post.slug}`} className="transition-colors duration-200 hover:text-brand-blue">
              {post.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
          <Link
            to={`/analytics/${post.slug}`}
            className="mt-2 inline-block text-sm font-medium text-brand-blue transition-opacity duration-200 hover:underline"
          >
            Открыть
          </Link>
        </div>
      </div>
    </Card>
  )
}
