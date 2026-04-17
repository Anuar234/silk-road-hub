import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Package } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { getCatalogProductsForAdmin } from '@features/admin/adminData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

export function AdminCatalogPage() {
  const [search, setSearch] = useState('')
  const version = usePlatformDataVersion()
  const products = useMemo(() => getCatalogProductsForAdmin(), [version])
  const verifiedCount = products.filter((product) => product.isVerified).length
  const totalActiveDeals = products.reduce((sum, product) => sum + product.activeDealsCount, 0)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => {
      return [product.name, product.seller.name, product.countryCode, product.sectorName, product.hsCode].some((value) => (value ?? '').toLowerCase().includes(query))
    })
  }, [products, search])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Каталог</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{products.length}</div>
            <div className="mt-1 text-sm text-slate-600">Карточек в каталоге</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{verifiedCount}</div>
            <div className="mt-1 text-sm text-slate-600">Проверенные карточки</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{totalActiveDeals}</div>
            <div className="mt-1 text-sm text-slate-600">Сделок по товарам</div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по товару, продавцу, сектору, HS-коду..." />
      </div>

      <Card>
        <CardHeader title={`Товары в каталоге (${filtered.length})`} subtitle="Admin oversight по всем карточкам каталога" />
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">Товар</th>
                <th className="pb-3 pr-4">Сектор</th>
                <th className="pb-3 pr-4">Продавец</th>
                <th className="pb-3 pr-4">HS</th>
                <th className="pb-3 pr-4">MOQ</th>
                <th className="pb-3 pr-4">Активные сделки</th>
                <th className="pb-3 pr-4">Статус</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-slate-100">
                        <Package className="size-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.price}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{product.sectorName}</td>
                  <td className="py-3 pr-4 text-slate-700">{product.seller.name}</td>
                  <td className="py-3 pr-4 text-slate-700">{product.hsCode}</td>
                  <td className="py-3 pr-4 text-slate-700">{product.moq}</td>
                  <td className="py-3 pr-4 text-slate-700">{product.activeDealsCount}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={product.isVerified ? 'success' : 'warning'}>{product.isVerified ? 'Проверен' : 'На модерации'}</Badge>
                  </td>
                  <td className="py-3">
                    <Link to={`/admin/catalog/${product.id}`} className="inline-flex items-center gap-1 text-brand-blue hover:underline">
                      Открыть <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Товары не найдены.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
