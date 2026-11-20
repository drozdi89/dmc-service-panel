import { PRODUCT_TYPE_OPTIONS } from './constants';
import { type ProductFormValues } from './types';

/**
 * Product-group driven form visibility (desktop `ware_data_manager` / `apps/crpt/PG.py` parity).
 */

/** ТГ с `vsd_required=True` (+ bio показывается отдельно с другим текстом). */
export const VSD_REQUIRED_GROUPS: readonly string[] = [
  'milk',
  'seafood',
  'conserve',
  'petfood',
  'sweets',
  'meat',
  'frozen',
];

/** Product groups that show the well-number field on certificates. */
export const SHOWED_LICS: readonly string[] = ['water'];

/** ТГ, для которых показывается блок ВЕТИС (vsd_required или bio). */
export const SHOW_VET_CONTROL_GROUPS: readonly string[] = [
  ...VSD_REQUIRED_GROUPS,
  'bio',
];

/** ТГ с `volume_required=True`. */
export const VOLUME_REQUIRED_GROUPS: readonly string[] = ['beer', 'nabeer'];

/** ТГ, где «Формат КМ» видим (`len(unit_templates) > 1`). */
export const CRPT_TEMPLATE_IDX_GROUPS: readonly string[] = [
  'NaN',
  'antiseptic',
  'seafood',
  'vegetableoil',
  'petfood',
  'conserve',
  'chemistry',
  'toys',
  'grocery',
  'construction',
  'autofluids',
  'radio',
  'opticfiber',
  'carparts',
  'cableraw',
  'heater',
  'sweets',
  'fire',
  'bio',
  'meat',
  'frozen',
  'homeware',
  'pyrotechnics',
  'polymer',
];

/** ТГ с полем МРЦ (руб.). */
export const MRP_PRICE_GROUPS: readonly string[] = ['tobacco'];

/** ТГ с полем «Процент спирта». */
export const MRP_ALCOHOL_GROUPS: readonly string[] = ['beer', 'chemistry'];

/** ТГ, где артикул и доп. текст обязательны. */
export const ASSORTMENT_REQUIRED_GROUPS: readonly string[] = [
  'ncp',
  'tobacco',
  'otp',
];

/**
 * Whether the VETIS switch is shown for the product group.
 *
 * @param pg - Честный Знак product group name.
 */
export function showsVetControl(pg: string | null | undefined): boolean {
  return SHOW_VET_CONTROL_GROUPS.includes(pg ?? '');
}

/**
 * Whether VETIS is forced on for the product group (`vsd_required`).
 *
 * @param pg - Product group name.
 */
export function isVsdRequired(pg: string | null | undefined): boolean {
  return VSD_REQUIRED_GROUPS.includes(pg ?? '');
}

/**
 * VETIS switch label (bio uses «Сырьё…»).
 *
 * @param pg - Product group name.
 */
export function vetControlLabel(pg: string | null | undefined): string {
  return pg === 'bio'
    ? 'Сырьё подконтрольно ВЕТИС'
    : 'Продукция подконтрольна ВЕТИС';
}

/**
 * Volume / weight field label by measure unit (desktop `unit_changed`).
 *
 * @param measureUnit - U / W / V.
 */
export function amountFieldLabel(
  measureUnit: string | null | undefined,
): string {
  if (measureUnit === 'W') {
    return 'Вес продукции';
  }
  if (measureUnit === 'V') {
    return 'Объём продукции';
  }
  return 'Объём/вес продукции';
}

export function visibilityFormControl ({ pg, measure_unit, type, ...values }: ProductFormValues) {
  const showCrptTemplateIdx = CRPT_TEMPLATE_IDX_GROUPS.includes(pg ?? '');
  const showVet = showsVetControl(pg);
  const showMrpAlcohol = MRP_ALCOHOL_GROUPS.includes(pg ?? '');
  const showMrpPrice = MRP_PRICE_GROUPS.includes(pg ?? '');
  const showWeightBounds = measure_unit === 'W';
  const assortmentRequired = ASSORTMENT_REQUIRED_GROUPS.includes(pg ?? '');
  const volumeRequired = VOLUME_REQUIRED_GROUPS.includes(pg ?? '');
  const showCompound = PRODUCT_TYPE_OPTIONS.BUNDLE === type;
  const showAutoorder = Boolean(pg) && pg !== 'NaN';
  const showedWellNumber = SHOWED_LICS.includes(pg ?? '');
  const showVaribleChar = pg === 'radio';
  
  return {
    showedWellNumber,
    showCrptTemplateIdx,
    showVet,
    showMrpAlcohol,
    showMrpPrice,
    showWeightBounds,
    assortmentRequired,
    volumeRequired,
    showCompound,
    showAutoorder,
    showVaribleChar
  }
}