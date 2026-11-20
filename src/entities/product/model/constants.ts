/** Certificate type select options for product forms. */
export const CERT_TYPE_OPTIONS = [
  { value: 'CONFORMITY_CERTIFICATE', label: 'Сертификат соответствия' },
  { value: 'CONFORMITY_DECLARATION', label: 'Декларация о соответствии' },
  {
    value: 'STATE_REGISTRATION_CERTIFICATE',
    label: 'Свидетельство о гос. регистрации',
  },
] as const;

/** Product lifetime unit select options. */
export const LIFETIME_UNIT_OPTIONS = [
  { value: 'DAYS', label: 'Дни' },
  { value: 'MONTHS', label: 'Месяцы' },
  { value: 'YEARS', label: 'Годы' },
];

export const PRODUCT_TYPE_OPTIONS = {
	UNIT: 'UNIT',
	BUNDLE: 'BUNDLE',
	SET: 'SET',
	GROUP: 'GROUP',
}

export const MEASURE_UNIT_OPTIONS = [
  { value: 'U', label: 'Штук', },
  { value: 'V', label: 'Литры', },
  { value: 'W', label: 'Вес', },
];

export const CHARACTERISTIC_OPTIONS = [{
	value: 'QUANTITY',
	label: 'Количество товара',
},{
	value: 'WEIGHT',
	label: 'Вес товара',
},{
	value: 'LENGTH',
	label: 'Длина товара',
},{
	value: 'VOLUME',
	label: 'Объём товара',
}]

export const CHARACTERISTIC_BOUNDS = {
    QUANTITY: [1, 99_999_999, 0],
    WEIGHT: [0.00001, 999.999, 5],
    LENGTH: [0.00001, 999.999, 5],
    VOLUME: [0.00001, 999.999, 5],
}

export const PRODUCT_GROUPS_DM = [
	{
		value: 'NaN',
		label: 'Не маркируеться',
	},
    {
		value: 'JUICE',
		label: 'Безалкогольные напитки и соки',
	},
	{
		value: 'MILK',
		label: 'Молочная продукция',
	},
	{
		value: 'PRESERVES',
		label: 'Консервированная продукция',
	},
	{
		value: 'WATER',
		label: 'Вода упакованная',
	},
];


export const CRPT_TEMPLATE_IDX = [
  {
		value: 0,
		label: 'Стандартный',
	},
	{
		value: 1,
		label: 'Укороченный',
	},
];

