import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Accordion({
    className,
    type: _type,
    defaultValue: _defaultValue,
    value: _value,
    collapsible: _collapsible,
    ...props
}: React.ComponentProps<'div'> & {
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
    value?: string | string[];
    collapsible?: boolean;
}) {
    return (
        <div data-slot="accordion" className={className} {...props} />
    );
}

function AccordionItem({
    className,
    value,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & { value: string }) {
    return (
        <CollapsiblePrimitive.Root
            data-slot="accordion-item"
            className={cn('border-b last:border-b-0', className)}
            {...props}
        />
    );
}

function AccordionTrigger({
    className,
    children,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
    return (
        <CollapsiblePrimitive.Trigger
            data-slot="accordion-trigger"
            className={cn(
                'group flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
                className,
            )}
            {...props}
        >
            {children}
            <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsiblePrimitive.Trigger>
    );
}

function AccordionContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
    return (
        <CollapsiblePrimitive.Content
            data-slot="accordion-content"
            className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden text-sm"
            {...props}
        >
            <div className={cn('pt-0 pb-4', className)}>{children}</div>
        </CollapsiblePrimitive.Content>
    );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
