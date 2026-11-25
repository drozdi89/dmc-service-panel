import type { CrptOrganization } from '../model/types';

/**
 * Trims text fields and nulls empty optional ones before save.
 *
 * @param values - CRPT organization form values.
 */
export function normalizeCrptOrganization(values: CrptOrganization): CrptOrganization {
  return {
    ...values,
    inn: values.inn.trim(),
    name: values.name.trim(),
    kpp: values.kpp?.trim() || null,
    thumbprint: values.thumbprint.trim(),
    oms_id: values.oms_id.trim(),
    oms_connection: values.oms_connection.trim(),
    bill_email: values.bill_email?.trim() || null,
    mods_list: values.mods_list ?? '',
  };
}
