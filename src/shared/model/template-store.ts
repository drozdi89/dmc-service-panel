import { useSyncExternalStore, type ReactNode } from 'react';

type Listener = () => void;

const slots: Record<string, ReactNode | undefined> = {};
const slotKeys: Record<string, string | undefined> = {};
const listeners = new Set<Listener>();

function emit() {
	for (const listener of listeners) {
		listener();
	}
}

export const templateStore = {
	subscribe(listener: Listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
	getSlot(name: string) {
		return slots[name];
	},
	register(name: string, element: ReactNode, contentKey = '') {
		const changed = slotKeys[name] !== contentKey || slots[name] !== element;
		slotKeys[name] = contentKey;
		slots[name] = element;
		if (changed) {
			emit();
		}
	},
	unregister(name: string) {
		if (!(name in slots)) {
			return;
		}
		delete slots[name];
		delete slotKeys[name];
		emit();
	},
};

export function useTemplateSlot(name: string) {
	return useSyncExternalStore(templateStore.subscribe, () =>
		templateStore.getSlot(name),
	);
}
