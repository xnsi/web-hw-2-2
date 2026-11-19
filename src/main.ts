import './style.css'
import type { Booking, BookingStatus } from './models/booking'
import { initialBookings } from './models/booking'
import { legacyCard, updateLegacy } from './legacy-card'
import { mountLab } from './lab'
// А1: импортируйте модуль регистрации. А5: импортируйте тип BookingCard.
import './components/booking-card'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main>
    <header><p class="eyebrow">ВЕБ-МАСТЕРСКАЯ · ДЗ 2/2</p><h1>Подтвердить и вернуть в очередь</h1>
      <p>Возврат меняет статус заявки. Участники остаются в общем списке.</p></header>
    <section class="panel" aria-labelledby="form-title"><h2 id="form-title">Новая заявка</h2>
      <form id="form" novalidate><label>Имя<input name="name" autocomplete="given-name"></label>
        <label>Участников<input name="seats" type="text" inputmode="numeric" value="1"></label>
        <button>Добавить заявку</button><p id="message" role="status"></p></form></section>
    <p class="summary">Участников: <strong id="total">0</strong> · Получено событий компонента: <strong id="events">0</strong></p>
    <div id="lists" class="columns">
      <section><h2>Все заявки</h2><div id="all" class="cards"></div></section>
      <section><h2>Подтверждённые</h2><div id="confirmed" class="cards"></div><p id="empty">Нет подтверждённых заявок</p></section>
    </div>
    <section class="panel" aria-labelledby="lab-title"><h2 id="lab-title">Проверка компонента</h2>
      <p>Независимый образец: события считаются, но данные приложения не меняются.</p><div id="lab"></div></section>
    <footer>Перезагрузка возвращает исходные данные. Инструкция и критерии находятся в README.md.</footer>
  </main>`
let bookings = initialBookings()
const all = document.querySelector<HTMLElement>('#all')!
const confirmed = document.querySelector<HTMLElement>('#confirmed')!
const empty = document.querySelector<HTMLElement>('#empty')!
const total = document.querySelector<HTMLElement>('#total')!
const events = document.querySelector<HTMLElement>('#events')!
const lists = document.querySelector<HTMLElement>('#lists')!
const form = document.querySelector<HTMLFormElement>('#form')!
const message = document.querySelector<HTMLElement>('#message')!
let received = 0

function makeCard(booking: Booking): HTMLElement {
  // А5: создайте booking-card и передайте booking вместо обычной карточки.
  return legacyCard(booking, setBookingStatus)
}
function updateCard(card: HTMLElement, booking: Booking) {
  // А5: обновляйте публичное свойство booking.
  updateLegacy(card, booking)
}

// Готовая синхронизация сохраняет экземпляры по id. Переписывать её не требуется.
const allCards = new Map<string, HTMLElement>()
const confirmedCards = new Map<string, HTMLElement>()
function sync(target: HTMLElement, cards: Map<string, HTMLElement>, rows: Booking[]) {
  for (const [id, card] of cards) {
    if (!rows.some(row => row.id === id)) { card.remove(); cards.delete(id) }
  }
  for (const booking of rows) {
    let card = cards.get(booking.id)
    if (!card) { card = makeCard(booking); cards.set(booking.id, card) }
    updateCard(card, booking)
    if (card.parentElement !== target) target.append(card)
  }
}
function renderLists() {
  sync(all, allCards, bookings)
  const accepted = bookings.filter(row => row.status === 'confirmed')
  sync(confirmed, confirmedCards, accepted)
  empty.hidden = accepted.length > 0
  total.textContent = String(bookings.reduce((sum, row) => sum + row.seats, 0))
  events.textContent = String(received)
}
function setBookingStatus(id: string, nextStatus: BookingStatus) {
  bookings = bookings.map(row => row.id === id ? { ...row, status: nextStatus } : row)
  renderLists()
}
lists.addEventListener('booking-status-request', (event) => {
  if (!(event instanceof CustomEvent)) return
  const detail: unknown = event.detail
  if (typeof detail !== 'object' || detail === null || !('id' in detail) || !('nextStatus' in detail)) return
  const { id, nextStatus } = detail
  if (typeof id !== 'string' || (nextStatus !== 'new' && nextStatus !== 'confirmed')) return
  if (!bookings.some(row => row.id === id)) return
  // Считаем каждый корректный запрос, в том числе повторный: дубли не скрываются.
  received += 1
  events.textContent = String(received)
  // А5: примените запрос готовой функцией setBookingStatus.
})
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = new FormData(form)
  const name = data.get('name')
  const raw = data.get('seats')
  if (typeof name !== 'string' || name.trim() === '') { message.textContent = 'Укажите имя.'; return }
  const seats = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
  if (!Number.isInteger(seats) || seats < 1 || seats > 5) {
    message.textContent = 'Введите целое число участников от 1 до 5.'; return
  }
  bookings.push({ id: crypto.randomUUID(), name: name.trim(), seats, status: 'new', source: 'web' })
  renderLists(); form.reset(); message.textContent = 'Заявка добавлена.'
})
mountLab(document.querySelector<HTMLElement>('#lab')!)
renderLists()
