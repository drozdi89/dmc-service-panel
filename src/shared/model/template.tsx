import {
	cloneElement,
	isValidElement,
	useId,
	useLayoutEffect,
	useState,
	type ReactElement,
	type ReactNode,
} from 'react';
import { templateStore, useTemplateSlot } from './template-store';

type TemplateProps = {
	slot?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
};

function serializeValue(value: unknown, depth: number, seen: WeakSet<object>): string {
	if (value == null || typeof value === 'boolean') {
		return String(value);
	}
	if (typeof value === 'string' || typeof value === 'number') {
		return String(value);
	}
	if (typeof value === 'function') {
		return '[fn]';
	}
	if (Array.isArray(value)) {
		return `[${value.map((item) => serializeValue(item, depth + 1, seen)).join(',')}]`;
	}
	if (typeof value === 'object') {
		if (seen.has(value)) {
			return '[cycle]';
		}
		seen.add(value);
		if (value instanceof Date) {
			return value.toISOString();
		}
		const entries = Object.entries(value as Record<string, unknown>)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, item]) => `${key}:${serializeValue(item, depth + 1, seen)}`);
		return `{${entries.join(',')}}`;
	}
	return String(value);
}

function serializeProps(props: Record<string, unknown>, depth: number): string {
	const seen = new WeakSet<object>();
	const parts: string[] = [];

	for (const key of Object.keys(props).sort()) {
		if (key === 'ref' || key === '_owner' || key === 'children') {
			continue;
		}
		const propValue = props[key];
		if (
			typeof propValue === 'object' &&
			propValue !== null &&
			!Array.isArray(propValue) &&
			!(propValue instanceof Date)
		) {
			parts.push(`${key}=[obj]`);
			continue;
		}
		parts.push(`${key}=${serializeValue(propValue, depth + 1, seen)}`);
	}

	return parts.join(',');
}

function getComponentTypeName(type: ReactElement['type']): string {
	if (typeof type === 'string') {
		return type;
	}
	if (typeof type === 'function') {
		const fn = type as { displayName?: string; name?: string };
		return fn.displayName || fn.name || 'Component';
	}
	if (typeof type === 'object' && type !== null) {
		const obj = type as { displayName?: string };
		return obj.displayName || 'Component';
	}
	return 'Component';
}

function getTemplateContentKey(node: ReactNode, depth = 0): string {
	if (depth > 4) {
		return '[deep]';
	}
	if (node == null || typeof node === 'boolean') {
		return '';
	}
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	}
	if (Array.isArray(node)) {
		return node.map((item) => getTemplateContentKey(item, depth + 1)).join('|');
	}
	if (isValidElement(node)) {
		const element = node as ReactElement<Record<string, unknown>>;
		const propsKey = serializeProps(element.props, depth + 1);
		const childrenKey = getTemplateContentKey(
			element.props['children'] as ReactNode,
			depth + 1,
		);
		return `${getComponentTypeName(element.type)}:${propsKey}|${childrenKey}`;
	}
	return 'unknown';
}

export function Template({ slot = 'default', children, ...props }: TemplateProps) {
	const uniqueId = useId();
	const contentKey = getTemplateContentKey(children);
	const [snapshot, setSnapshot] = useState({ children, contentKey });
	if (snapshot.contentKey !== contentKey) {
		setSnapshot({ children, contentKey });
	}

	useLayoutEffect(() => {
		const currentChildren = snapshot.children;
		const element = isValidElement(currentChildren)
			? cloneElement(currentChildren, { key: uniqueId, ...props })
			: currentChildren;

		templateStore.register(slot, element, contentKey);

		return () => {
			templateStore.unregister(slot);
		};
		// props intentionally omitted: rest-object is new on every render
		// eslint-disable-next-line react-hooks/exhaustive-deps -- contentKey + snapshot
	}, [slot, contentKey, uniqueId, snapshot]);

	return null;
}

function TemplateSlot({
	name = 'default',
	children,
	...slotProps
}: {
	name?: string;
	children?: React.ReactNode;
	[key: string]: unknown;
}) {
	const template = useTemplateSlot(name);
	const resolved = template ?? children;

	if (typeof resolved === 'function') {
		return (resolved as (props: Record<string, unknown>) => React.ReactNode)(
			slotProps,
		);
	}

	if (!isValidElement(resolved)) {
		return <>{resolved}</>;
	}

	return cloneElement(resolved, { ...slotProps, key: resolved.key });
}

function useTemplate() {
	return {
		get: (slotName: string): React.ReactNode => templateStore.getSlot(slotName),
		has: (slotName: string): boolean => templateStore.getSlot(slotName) != null,
	};
}

function TemplateHas({ name, children, ...props }: { name: string; children: React.ReactNode, [key: string]: unknown }) {
	const template = useTemplateSlot(name);
	return template ? (children ?? TemplateSlot({ name, ...props })) : null;
}

function templateElement(name: string) {
	return ({children, ...props}: { children: React.ReactNode; [key: string]: unknown }) => (
		<Template slot={name} {...props}>
			{children}
		</Template>
	);
}

Template.Has = TemplateHas;
Template.Slot = TemplateSlot;
Template.use = useTemplate;
Template.factory = templateElement;
Template.Title = templateElement('title');
Template.Header = templateElement('header');
Template.Footer = templateElement('footer');
