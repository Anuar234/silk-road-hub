import { Filter, X } from 'lucide-react'
import { CATALOG_COUNTRIES, CATALOG_SECTORS, KZ_REGIONS, getSectorById } from '../../data/catalogStructure'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { cx } from '../../components/utils/cx'
import {
  type CatalogFilterChip,
  type CatalogFilterState,
  CATALOG_CERTIFICATE_OPTIONS,
  CATALOG_INCOTERM_OPTIONS,
  CATALOG_RESPONSE_TIME_OPTIONS,
} from './catalogFilters'

export function CatalogFiltersPanel({
  filters,
  onChange,
  onReset,
  className,
}: {
  filters: CatalogFilterState
  onChange: (updates: Partial<CatalogFilterState>) => void
  onReset: () => void
  className?: string
}) {
  const sector = filters.sectorId ? getSectorById(filters.sectorId) : null

  return (
    <div className={cx('rounded-2xl border border-border bg-white p-4', className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Filter className="size-4 text-brand-blue" />
        Фильтры
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="catalog-sector">
            Сектор
          </label>
          <select
            id="catalog-sector"
            value={filters.sectorId}
            onChange={(e) => onChange({ sectorId: e.target.value, subcategoryId: '' })}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="">Все сектора</option>
            {CATALOG_SECTORS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="catalog-subcategory">
            Подкатегория
          </label>
          <select
            id="catalog-subcategory"
            value={filters.subcategoryId}
            onChange={(e) => onChange({ subcategoryId: e.target.value })}
            disabled={!sector}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">{sector ? 'Все подкатегории' : 'Сначала выберите сектор'}</option>
            {sector?.subcategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="catalog-country">
            Страна
          </label>
          <select
            id="catalog-country"
            value={filters.countryCode}
            onChange={(e) => onChange({ countryCode: e.target.value, regionCode: '' })}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="">Все страны</option>
            {CATALOG_COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {filters.countryCode === 'KZ' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="catalog-region">
              Регион
            </label>
            <select
              id="catalog-region"
              value={filters.regionCode}
              onChange={(e) => onChange({ regionCode: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] duration-[var(--duration-medium)] ease-[var(--ease-primary)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="">Все регионы</option>
              {KZ_REGIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">HS-код</label>
          <Input value={filters.hsCode} onChange={(e) => onChange({ hsCode: e.target.value })} placeholder="Напр. 040900" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">MOQ</label>
          <Input value={filters.moq} onChange={(e) => onChange({ moq: e.target.value })} placeholder="Напр. контейнер" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Компания</label>
          <Input value={filters.sellerQuery} onChange={(e) => onChange({ sellerQuery: e.target.value })} placeholder="Название продавца" />
        </div>

        <MultiSelectGroup
          label="Incoterms"
          options={CATALOG_INCOTERM_OPTIONS}
          values={filters.incoterms}
          onToggle={(value) =>
            onChange({
              incoterms: filters.incoterms.includes(value)
                ? filters.incoterms.filter((item) => item !== value)
                : [...filters.incoterms, value],
            })
          }
        />

        <MultiSelectGroup
          label="Сертификаты"
          options={CATALOG_CERTIFICATE_OPTIONS}
          values={filters.certificates}
          onToggle={(value) =>
            onChange({
              certificates: filters.certificates.includes(value as (typeof filters.certificates)[number])
                ? filters.certificates.filter((item) => item !== value)
                : [...filters.certificates, value as (typeof filters.certificates)[number]],
            })
          }
        />

        <div>
          <div className="mb-2 block text-xs font-medium text-slate-700">Статус проверки</div>
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={filters.verificationStatus === 'verified'}
              onClick={() => onChange({ verificationStatus: filters.verificationStatus === 'verified' ? 'all' : 'verified' })}
            >
              Проверенный
            </ToggleChip>
          </div>
        </div>

        <div>
          <div className="mb-2 block text-xs font-medium text-slate-700">Время ответа продавца</div>
          <div className="flex flex-wrap gap-2">
            {CATALOG_RESPONSE_TIME_OPTIONS.map((item) => (
              <ToggleChip
                key={item.value}
                active={filters.responseTime === item.value}
                onClick={() => onChange({ responseTime: filters.responseTime === item.value ? '' : item.value })}
              >
                {item.label}
              </ToggleChip>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.samplesOnly}
            onChange={(e) => onChange({ samplesOnly: e.target.checked })}
            className="rounded border-border"
          />
          Образцы доступны
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.privateLabelOnly}
            onChange={(e) => onChange({ privateLabelOnly: e.target.checked })}
            className="rounded border-border"
          />
          Private label
        </label>

        <Button variant="secondary" size="sm" className="w-full" onClick={onReset}>
          Сбросить фильтры
        </Button>
      </div>
    </div>
  )
}

function MultiSelectGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-2 block text-xs font-medium text-slate-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ToggleChip key={option} active={values.includes(option)} onClick={() => onToggle(option)}>
            {option}
          </ToggleChip>
        ))}
      </div>
    </div>
  )
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'motion-tap min-h-[40px] rounded-xl border px-3 py-2 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
        active
          ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
          : 'border-border bg-white text-slate-700 hover:border-brand-blue/40 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

export function CatalogActiveFilters({
  chips,
  onRemove,
}: {
  chips: CatalogFilterChip[]
  onRemove: (chip: CatalogFilterChip) => void
}) {
  if (chips.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button key={chip.id} type="button" onClick={() => onRemove(chip)} className="motion-tap">
          <Badge tone="neutral" className="gap-2 pr-2">
            {chip.label}
            <X className="size-3" />
          </Badge>
        </button>
      ))}
    </div>
  )
}

export function CatalogEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-slate-50 p-8 text-center">
      <div className="text-lg font-semibold text-slate-900">Ничего не найдено</div>
      <p className="mt-2 text-sm text-slate-600">Попробуйте изменить фильтры или сбросить их</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onReset}>
        Сбросить фильтры
      </Button>
    </div>
  )
}
