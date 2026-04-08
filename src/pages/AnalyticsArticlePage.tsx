import { ChevronRight, Mail } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../components/layout/Container'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Card, CardContent } from '../components/ui/Card'
import { applyOfflineImageFallback } from '../components/ui/imageFallback'
import {
  getPostBySlug,
  getRelatedPosts,
  getTypeLabel,
} from '../data/analyticsData'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AnalyticsArticlePage() {
  const { slug } = useParams()
  const post = slug ? getPostBySlug(slug) : undefined
  const related = post ? getRelatedPosts(post, 3) : []

  if (!post) {
    return (
      <Container className="py-10">
        <Card>
          <CardContent className="py-8">
            <h1 className="text-xl font-semibold text-slate-900">Материал не найден</h1>
            <p className="mt-2 text-sm text-slate-600">Проверьте ссылку или вернитесь в раздел Аналитика.</p>
            <div className="mt-4">
              <ButtonLink to="/analytics" variant="secondary">
                В Аналитику
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <div>
      <Container className="py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
          <Link to="/" className="transition-colors duration-200 hover:text-slate-900">
            Главная
          </Link>
          <ChevronRight className="size-4 text-slate-400" />
          <Link to="/analytics" className="transition-colors duration-200 hover:text-slate-900">
            Аналитика
          </Link>
          <ChevronRight className="size-4 text-slate-400" />
          <span className="text-slate-900">{getTypeLabel(post.type)}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
          <article className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {post.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>{post.author_name}</span>
              <span>{formatDate(post.published_at)}</span>
              <span>{post.reading_time_min} мин</span>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-slate-100">
              <img
                src={post.cover_image_url}
                alt=""
                className="w-full object-cover"
                style={{ maxHeight: '420px' }}
                onError={applyOfflineImageFallback}
              />
            </div>

            {post.key_takeaways && post.key_takeaways.length > 0 && (
              <Card className="mt-8 border-brand-blue/20 bg-slate-50/50">
                <CardContent className="p-5">
                  <h2 className="text-base font-semibold text-slate-900">
                    Коротко по делу
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {post.key_takeaways.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-slate-700"
                      >
                        <span className="text-brand-blue">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="prose prose-slate mt-8 max-w-none">
              <p className="text-base leading-relaxed text-slate-700">
                {post.excerpt}
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-700">
                {post.body}
              </p>
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Похожие материалы
                </h3>
                <ul className="mt-3 space-y-2">
                  {related.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/analytics/${p.slug}`}
                        className="block rounded-xl px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-brand-blue"
                      >
                        {p.title}
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
                  Новые разборы и кейсы раз в неделю.
                </p>
                <ButtonLink
                  to="/request-access"
                  variant="primary"
                  size="sm"
                  className="mt-3 w-full gap-2"
                >
                  <Mail className="size-4" />
                  Подписаться
                </ButtonLink>
              </CardContent>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  )
}
