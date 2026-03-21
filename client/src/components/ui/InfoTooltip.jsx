import * as Tooltip from "@radix-ui/react-tooltip";

/**
 * Accessible hover/focus tooltip (Radix). Requires {@link TooltipProvider} at app root.
 */
export function InfoTooltip({ children, content, side = "top" }) {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
			<Tooltip.Portal>
				<Tooltip.Content
					className="rum-tooltip-content"
					side={side}
					sideOffset={8}
				>
					{content}
					<Tooltip.Arrow className="rum-tooltip-arrow" width={12} height={6} />
				</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip.Root>
	);
}
