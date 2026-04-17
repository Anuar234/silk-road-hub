import { Container } from '@widgets/layout/Container'
import { ButtonLink } from '@shared/ui/ButtonLink'

export function NotFoundPage() {
  return (
    <Container className="py-14">
      <div className="rounded-2xl border border-border bg-white p-8">
        <div className="text-xl font-semibold text-slate-900">Страница не найдена</div>
        <div className="mt-2 text-sm text-slate-600">
          Похоже, такой страницы нет или ссылка устарела. Вернитесь в основной поток: каталог, аналитика или рабочий кабинет.
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to="/" variant="primary">
            На главную
          </ButtonLink>
          <ButtonLink to="/catalog" variant="secondary">
            В каталог
          </ButtonLink>
          <ButtonLink to="/analytics" variant="ghost">
            В аналитику
          </ButtonLink>
        </div>
      </div>
    </Container>
  )
}

