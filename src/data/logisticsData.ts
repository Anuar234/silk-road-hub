import { notifyPlatformDataChange } from './storeEvents'

export type ShipmentStageStatus = 'pending' | 'in_progress' | 'completed'

export type ShipmentStage = {
  id: string
  name: string
  status: ShipmentStageStatus
  location: string
  date: string | null
  notes: string
}

export type Shipment = {
  id: string
  dealId: string
  origin: string
  destination: string
  routeName: string
  stages: ShipmentStage[]
  documentIds: string[]
  createdAt: string
  updatedAt: string
}

/* ── Типовые маршруты ── */

export type RouteTemplate = {
  id: string
  name: string
  origin: string
  destination: string
  stages: string[]
}

export const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'route-kz-cn',
    name: 'Казахстан → Китай',
    origin: 'Казахстан',
    destination: 'Китай',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Транзит Хоргос', 'Таможенное оформление (КНР)', 'Доставка получателю'],
  },
  {
    id: 'route-kz-tr',
    name: 'Казахстан → Турция',
    origin: 'Казахстан',
    destination: 'Турция',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Транзит Каспий / Грузия', 'Таможенное оформление (ТР)', 'Доставка получателю'],
  },
  {
    id: 'route-kz-ae',
    name: 'Казахстан → ОАЭ',
    origin: 'Казахстан',
    destination: 'ОАЭ',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Морской транзит (Актау → Бандар-Аббас → Дубай)', 'Таможенное оформление (ОАЭ)', 'Доставка получателю'],
  },
  {
    id: 'route-kz-uz',
    name: 'Казахстан → Узбекистан',
    origin: 'Казахстан',
    destination: 'Узбекистан',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Транзит автодорога / ж/д', 'Таможенное оформление (УЗ)', 'Доставка получателю'],
  },
  {
    id: 'route-kz-de',
    name: 'Казахстан → Германия',
    origin: 'Казахстан',
    destination: 'Германия',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Ж/д транзит (Россия / Беларусь / Польша)', 'Таможенное оформление (ЕС)', 'Доставка получателю'],
  },
  {
    id: 'route-kz-in',
    name: 'Казахстан → Индия',
    origin: 'Казахстан',
    destination: 'Индия',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Морской транзит (Актау → Мумбаи)', 'Таможенное оформление (ИН)', 'Доставка получателю'],
  },
  {
    id: 'route-kz-kr',
    name: 'Казахстан → Южная Корея',
    origin: 'Казахстан',
    destination: 'Южная Корея',
    stages: ['Отгрузка со склада', 'Таможенное оформление (КЗ)', 'Ж/д → морской транзит (Китай → Корея)', 'Таможенное оформление (КР)', 'Доставка получателю'],
  },
]

/* ── In-memory store ── */

const shipments: Shipment[] = []
let nextId = 1

export function getShipmentsByDeal(dealId: string): Shipment[] {
  return shipments.filter((s) => s.dealId === dealId)
}

export function getShipmentById(id: string): Shipment | undefined {
  return shipments.find((s) => s.id === id)
}

export function getAllShipments(): Shipment[] {
  return [...shipments]
}

export function createShipment(input: {
  dealId: string
  routeTemplateId?: string
  origin?: string
  destination?: string
}): Shipment {
  const now = new Date().toISOString()
  const template = ROUTE_TEMPLATES.find((r) => r.id === input.routeTemplateId)

  const stages: ShipmentStage[] = (template?.stages ?? ['Отгрузка', 'Таможня', 'Транзит', 'Доставка']).map((name, i) => ({
    id: `stage-${nextId}-${i}`,
    name,
    status: 'pending',
    location: '',
    date: null,
    notes: '',
  }))

  const shipment: Shipment = {
    id: `ship-${String(nextId++).padStart(4, '0')}`,
    dealId: input.dealId,
    origin: input.origin ?? template?.origin ?? '',
    destination: input.destination ?? template?.destination ?? '',
    routeName: template?.name ?? `${input.origin ?? '?'} → ${input.destination ?? '?'}`,
    stages,
    documentIds: [],
    createdAt: now,
    updatedAt: now,
  }
  shipments.push(shipment)
  notifyPlatformDataChange()
  return shipment
}

export function updateShipmentStage(
  shipmentId: string,
  stageId: string,
  updates: Partial<Pick<ShipmentStage, 'status' | 'location' | 'date' | 'notes'>>,
): Shipment | null {
  const shipment = shipments.find((s) => s.id === shipmentId)
  if (!shipment) return null
  const stage = shipment.stages.find((s) => s.id === stageId)
  if (!stage) return null

  if (updates.status !== undefined) stage.status = updates.status
  if (updates.location !== undefined) stage.location = updates.location
  if (updates.date !== undefined) stage.date = updates.date
  if (updates.notes !== undefined) stage.notes = updates.notes
  shipment.updatedAt = new Date().toISOString()

  notifyPlatformDataChange()
  return shipment
}

export function addShipmentDocument(shipmentId: string, fileId: string): boolean {
  const shipment = shipments.find((s) => s.id === shipmentId)
  if (!shipment) return false
  shipment.documentIds.push(fileId)
  shipment.updatedAt = new Date().toISOString()
  notifyPlatformDataChange()
  return true
}
