const vars_data = [
	{
		name: 'taskid',
		description: 'номер задания DMC',
	},
	{
		name: 'product',
		description: 'Описание товара',
	},
	{
		name: 'product0',
		description: 'Первая строка товара',
	},
	{
		name: 'product1',
		description: 'Вторая строка товара',
	},
	{
		name: 'product2',
		description: 'Третья строка товара',
	},
	{
		name: 'product3',
		description: 'Четвертая строка товара',
	},
	{
		name: 'product4',
		description: 'Пятая строка товара',
	},
	{
		name: 'product5',
		description: 'Шестая строка товара',
	},
	{
		name: 'product6',
		description: 'Седьмая строка товара',
	},
	{
		name: 'product7',
		description: 'Восьмая строка товара',
	},
	{
		name: 'product8',
		description: 'Девятая строка товара',
	},
	{
		name: 'product8',
		description: 'Девятая строка товара',
	},
    {
		name: 'additional_text',
		description: 'Дополнительные сведения из карточки товара',	
	},
	{
		name: 'aggregate_size',
		description: 'Размер агрегата',
	},
	{
		name: 'ai21',
		description: 'AI21 из КМ/КИГУ',
	},
	{
		name: 'barcode',
		description: 'Код маркировки продукта / штрихкод упаковки с AI00 для SSCC',
	},
	{
		name: 'barcode_nofnc1',
		description: 'Код маркировки продукта / штрихкод упаковки к которому не добавляется ~1 (FNC1) при печати',
	},
	{
		name: 'barcode_nogs',
		description: 'Код маркировки продукта / штрихкод упаковки к которому не добавляется ~1 (FNC1) при печати и удаляются все GS символы',
	},
	{
		name: 'batch',
		description: 'Номер партии из задания',
	},
	{
		name: 'batch_10',
		description: 'Номер партии из задания 10 знаков с лидирующими нулями',
	},
	{
		name: 'boil',
		description: 'Номер варки из задания',
	},
	{
		name: 'boil_10',
		description: 'Номер варки из задания 10 знаков с лидирующими нулями',
	},
	{
		name: 'brutto_weight_g',
		description: 'Вес брутто агрегата в граммах',
	},
	{
		name: 'brutto_weight_kg',
		description: 'Вес брутто агрегата в килограммах',
	},
	{
		name: 'cell',
		description: 'Адрес ячейки хранения агрегата',
	},
	{
		name: 'count',
		description: 'Количество собранных кодов в задании',
	},
	{
		name: 'counter',
		description: 'Инкрементальный счётчик переданных на печать кодов (Только для станции печати)',
	},
	{
		name: 'ean13',
		description: 'весовой ШК в формате 22 + 5 знаков артикул + 5 знаков вес',
	},
	{
		name: 'ean13_2',
		description: 'весовой ШК в формате 2 + 6 знаков артикул + вес 5 знаков',
	},
	{
		name: 'ean13_3',
		description: 'весовой ШК в формате 23 + 6 знаков артикул + вес 4 знака',
	},
	{
		name: 'ean13barcode',
		description: 'Линейный штрихкод продукции из карточки товара либо GTIN без 0 если ШК не задан',
	},
	{
		name: 'expdate_17',
		description: 'срок годности продукта в формате ггммдд',
	},
	{
		name: 'expdate_mm_dot_yyyy',
		description: 'срок годности продукта в формате мм.гггг',
	},
	{
		name: 'expdate_month_name_yyyy',
		description: 'срок годности продукта в формате название месяца гг',
	},
	{
		name: 'expdate_yyyymm',
		description: 'срок годности продукта в формате гггг-мм',
	},
	{
		name: 'factory',
		description: 'номер завода из настроек маркировки',
	},
	{
		name: 'gs',
		description: 'Символ GS для AI переменной длины',
	},
	{
		name: 'gtin',
		description: 'GTIN продукта',
	},
	{
		name: 'lifetime',
		description: 'срок годности продукта в формате дд.мм.гггг',
	},
	{
		name: 'line_name',
		description: 'Наименование линии',
	},
	{
		name: 'mandate',
		description: 'дата производства в формате дд.мм.гггг',
	},
	{
		name: 'mandate_11',
		description: 'дата производства в формате ггммдд',
	},
	{
		name: 'mandate_dot_mmdd',
		description: 'дата производства в формате мм.гггг',
	},
	{
		name: 'mandate_mm_dot_yyyy',
		description: 'дата производства в формате мм.гггг',
	},
	{
		name: 'mandate_mmdd',
		description: 'дата производства в формате ммдд',
	},
	{
		name: 'mandate_month_name_yyyy',
		description: 'дата производства в формате название месяца гггг',
	},
	{
		name: 'pack_ean13barcode',
		description: 'Линейный штрихкод упаковки из уровня агрегации товара либо GTIN без 0 если ШК не задан',
	},
	{
		name: 'pack_gtin',
		description: 'GTIN КИГУ упаковки',
	},
	{
		name: 'pack_name',
		description: 'Наименование уровня агрегации',
	},
	{
		name: 'package_size',
		description: 'Количество вложений в агрегате',
	},
	{
		name: 'package_size_units',
		description: 'Количество штучной продукции в агрегате',
	},
	{
		name: 'packaging_weight_g',
		description: 'Вес упаковки в граммах',
	},
	{
		name: 'product',
		description: 'Описание товара (можно указывать с номером строки, тогда будет выводиться только конкретная строка, например product0 - будет выведена первая строка. Нумерация строк с нуля',
	},
	{
		name: 'serial',
		description: 'Артикул продукта из карточки товара',
	},
	{
		name: 'shift',
		description: 'номер смены из задания',
	},
	{
		name: 'sizing_l',
		description: 'Вес/Объём продукта в килограммах/литрах',
	},
	{
		name: 'sizing_s',
		description: 'Вес/Объём продукта в граммах/миллилитрах',
	},
	{
		name: 'slifetime',
		description: 'срок годности продукта в формате дд.мм.гг',
	},
	{
		name: 'slifetime_mmddyy',
		description: 'срок годности продукта в формате мм.дд.гг',
	},
	{
		name: 'smandate',
		description: 'дата производства в формате дд.мм.гг',
	},
	{
		name: 'smandate_mmddyy',
		description: 'дата производства в формате мм.дд.гг',
	},
	{
		name: 'sscc',
		description: 'код SSCC продукта / SSCC упаковки без AI00',
	},
	{
		name: 'sscc_nofnc1',
		description: 'код SSCC продукта / SSCC упаковки без AI00',
	},
	{
		name: 'task_expdate_17',
		description: 'Срок годности из ``task.expiration_date`` в формате ггммдд. Unlike :attr:`expdate_17`, always reads the task field (KITU alt1 GLN series key and AI 17 parity with builtin generators).',
	},
	{
		name: 'unique',
		description: 'Уникальная строка длиной 8 символов',
	},
	{
		name: 'variable_char_label',
		description: 'Подпись переменной характеристики («Характеристика Количество»).',
	},
	{
		name: 'variable_char_value',
		description: 'Значение переменной характеристики задания с точностью по типу.',
	},
	{
		name: 'weight',
		description: 'Вес в килограммах',
	},
	{
		name: 'weight_04',
		description: 'Вес в граммах 4 знака с лидирующими нулями',
	},
	{
		name: 'weight_05',
		description: 'Вес в граммах 5 знаков с лидирующими нулями',
	},
	{
		name: 'weight_3103',
		description: 'Вес в формате для AI 3103 (три знака кг и три знака г без разделителя)',
	},
	{
		name: 'weight_g',
		description: 'Вес в граммах',
	},
];

export const getVars = () => {
	return vars_data.map((item) => ({
		name: item.name,
		description: item.description,
	}));
};