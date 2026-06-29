import { heatMeters, waterMeters } from './data/equipment.js';
import { calculateAskuvt } from './utils/calculation.js';
import './styles.css';

const app = document.querySelector('#app');
const icons = { meter: '▦', box: '◫', server: '▣', cable: '⌁', repeater: '⇄', power: '⚡', software: '✓' };
let result = null;

const optionList = (items) => items.map((item) => `<option value="${item.id}">${item.name} · ${item.article}</option>`).join('');

const validate = (form) => {
  const errors = {};
  ['floors', 'waterRisers', 'heatRisers'].forEach((key) => {
    if (form[key] === '') errors[key] = 'Обязательное поле';
    else if (Number(form[key]) < 0) errors[key] = 'Значение не может быть отрицательным';
    else if (!Number.isInteger(Number(form[key]))) errors[key] = 'Введите целое число';
  });
  if (form.floors !== '' && Number(form.floors) <= 0) errors.floors = 'Этажность должна быть больше 0';
  if (!form.waterMeterId) errors.waterMeterId = 'Выберите счётчик воды';
  if (!form.heatMeterId) errors.heatMeterId = 'Выберите теплосчётчик';
  return errors;
};

const card = (item) => `<article class="equipment-card">
  <div class="equipment-image"><span aria-hidden="true">${icons[item.imageType]}</span></div>
  <div class="equipment-content">
    <div class="equipment-heading"><h3>${item.name}</h3><strong>${item.quantity}</strong></div>
    <p class="article">Артикул: ${item.article}</p>
    <p>${item.description}</p>
    ${item.note ? `<p class="note">${item.note}</p>` : ''}
  </div>
</article>`;

const render = (errors = {}) => {
  app.innerHTML = `<main>
    <section class="hero">
      <div><p class="eyebrow">Инженерный онлайн‑подбор</p><h1>Подбор оборудования для системы АСКУВТ</h1><p class="lead">Расчёт состава оборудования для поквартирного учёта воды и тепла с интерфейсом RS‑485, преобразователями, кабельной линией и ПО.</p></div>
      <div class="hero-card"><b aria-hidden="true">▰</b><span>RS‑485 · Ethernet · Cloud</span></div>
    </section>
    <section class="layout">
      <form class="panel form-panel" id="calcForm" novalidate>
        <div class="section-title"><span>01</span><h2>Исходные данные</h2></div>
        <div class="grid">
          ${field('Этажность здания', 'floors', 'number', 'Например, 17', errors.floors, '1')}
          ${field('Количество стояков воды для квартир', 'waterRisers', 'number', 'Например, 8', errors.waterRisers, '0')}
          ${field('Количество стояков теплоснабжения для квартир', 'heatRisers', 'number', 'Например, 8', errors.heatRisers, '0')}
          <label class="field"><span>Счётчики воды СГВ на RS-485</span><select name="waterMeterId">${optionList(waterMeters)}</select>${errors.waterMeterId ? `<small>${errors.waterMeterId}</small>` : ''}</label>
          <label class="field"><span>Теплосчётчики RUT-01 на RS-485</span><select name="heatMeterId">${optionList(heatMeters)}</select>${errors.heatMeterId ? `<small>${errors.heatMeterId}</small>` : ''}</label>
        </div>
        <label class="checkbox"><input type="checkbox" name="hasThirdPartyEquipment"/><span>Есть оборудование сторонних производителей</span></label>
        <button class="calculate" type="submit">Рассчитать</button>
        ${Object.keys(errors).length ? '<p class="hint">Заполните обязательные поля: отрицательные значения недопустимы.</p>' : ''}
      </form>
      <aside class="panel info-panel"><div class="section-title"><span>02</span><h2>Правила расчёта</h2></div><ul><li>КМ‑222: стояки × этажи.</li><li>MWN‑580: один сервер на каждые 8 стояков.</li><li>Кабель: (((этажи × 5) × 1.2) × стояки) + 100 м.</li><li>Повторитель нужен при линии больше 1200 м или сети больше 247 приборов.</li><li>Топология подключения всегда — шина.</li></ul></aside>
    </section>
    ${result ? `<section class="panel result-panel"><div class="result-header"><div><p class="eyebrow">Результат расчёта</p><h2>Система АСКУВТ состоит из следующего оборудования:</h2></div><div class="summary"><span>Всего стояков: ${result.totalRisers}</span><span>${result.topology}</span></div></div><div class="cards">${result.items.map(card).join('')}</div></section>` : ''}
  </main>`;
  document.querySelector('#calcForm').addEventListener('submit', onSubmit);
};

const field = (label, name, type, placeholder, error, min) => `<label class="field"><span>${label}</span><input type="${type}" min="${min}" name="${name}" placeholder="${placeholder}"/>${error ? `<small>${error}</small>` : ''}</label>`;

const onSubmit = (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const form = {
    floors: data.get('floors')?.toString() ?? '',
    waterRisers: data.get('waterRisers')?.toString() ?? '',
    heatRisers: data.get('heatRisers')?.toString() ?? '',
    waterMeterId: data.get('waterMeterId')?.toString() ?? '',
    heatMeterId: data.get('heatMeterId')?.toString() ?? '',
    hasThirdPartyEquipment: data.get('hasThirdPartyEquipment') === 'on',
  };
  const errors = validate(form);
  if (Object.keys(errors).length) return render(errors);
  result = calculateAskuvt({ ...form, floors: Number(form.floors), waterRisers: Number(form.waterRisers), heatRisers: Number(form.heatRisers) });
  render();
  document.querySelector('.result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

render();
