import { fixedEquipment, heatMeters, waterMeters } from '../data/equipment.js';

const maxDevicesPerNetwork = 247;
const maxLineLength = 1200;
const converterPorts = 8;
const powerSupplyCapacity = 80;

const findOption = (options, id) => {
  const option = options.find((item) => item.id === id);
  if (!option) throw new Error('Не выбрано оборудование из справочника');
  return option;
};

export const calculatePowerSupplies = (waterMetersCount, heatMetersCount, converters, repeaters) => {
  const loadUnits = waterMetersCount + heatMetersCount * 2 + converters * 4 + repeaters * 2;
  return Math.max(1, Math.ceil(loadUnits / powerSupplyCapacity));
};

export const calculateAskuvt = (input) => {
  const totalRisers = input.waterRisers + input.heatRisers;
  const terminalBoxes = totalRisers * input.floors;
  const converters = Math.ceil(totalRisers / converterPorts);
  const cableLength = Math.ceil(((input.floors * 5) * 1.2) * totalRisers + 100);
  const waterMeter = findOption(waterMeters, input.waterMeterId);
  const heatMeter = findOption(heatMeters, input.heatMeterId);
  const devicesInOneNetwork = input.waterRisers + input.heatRisers;
  const repeaterRequired = cableLength > maxLineLength || devicesInOneNetwork > maxDevicesPerNetwork;
  const repeaters = repeaterRequired ? Math.max(1, Math.ceil(cableLength / maxLineLength) - 1) : 0;
  const powerSupplies = calculatePowerSupplies(input.waterRisers, input.heatRisers, converters, repeaters);
  const software = input.hasThirdPartyEquipment ? 'Ридан Измерения' : 'Indiv ARM Cloud';

  return {
    totalRisers,
    cableLength,
    converters,
    terminalBoxes,
    powerSupplies,
    repeaterRequired,
    software,
    topology: 'Рекомендуемая топология подключения — Шина',
    items: [
      { key: 'water', ...waterMeter, quantity: input.waterRisers, imageType: 'meter', description: waterMeter.description },
      { key: 'heat', ...heatMeter, quantity: input.heatRisers, imageType: 'meter', description: heatMeter.description },
      { key: 'terminal', ...fixedEquipment.terminalBox, quantity: terminalBoxes, imageType: 'box' },
      { key: 'converter', ...fixedEquipment.converter, quantity: converters, imageType: 'server' },
      { key: 'cable', ...fixedEquipment.cable, quantity: `${cableLength} м`, imageType: 'cable', note: 'В кабеле 8 проводов / 4 пары: 1 пара используется для коммуникации AB, 3 пары — для питания (3 провода «+» и 3 провода «-»). Это увеличивает сечение жилы питания и поддерживает достаточное напряжение на дальних участках линии.' },
      ...(repeaterRequired ? [{ key: 'repeater', ...fixedEquipment.repeater, quantity: repeaters, imageType: 'repeater', note: 'Требуется повторитель RS-485' }] : [{ key: 'repeater-info', name: 'Повторитель RS-485', article: '—', quantity: 0, description: 'Повторитель RS-485 не требуется: длина линии не превышает 1200 м, а приборов в одной сети не больше 247.', imageType: 'repeater' }]),
      { key: 'power', ...fixedEquipment.powerSupply, quantity: powerSupplies, imageType: 'power' },
      { key: 'software', name: software, article: 'ПО', quantity: 1, description: 'Программное обеспечение для сбора, визуализации и диспетчеризации показаний.', imageType: 'software' },
    ],
  };
};
