import type { MactLicenceInfo, RegisteredClient } from '../model/types';

/**
 * Drops licences already bound to a DMC client.
 *
 * MACT `available` can still contain a pin that is bound locally (for example right after
 * registration), so a licence is treated as bound when it has a `client_id` or its `pin`
 * matches the `licence_key` of a registered client.
 *
 * @param available - `available` list from the MACT snapshot.
 * @param registered - Registered clients with licence metadata.
 * @returns Unbound licences in the original order.
 */
export function filterUnboundLicences(
  available: MactLicenceInfo[],
  registered: Pick<RegisteredClient, 'licence_key'>[],
): MactLicenceInfo[] {
  const boundPins = new Set<string>();
  for (const row of registered) {
    if (row.licence_key) {
      boundPins.add(row.licence_key);
    }
  }
  return available.filter((licence) => !licence.client_id && !boundPins.has(licence.pin));
}
