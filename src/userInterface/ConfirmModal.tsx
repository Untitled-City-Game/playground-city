import Button from "@/src/userInterface/CustomButton";
import P from "@/src/userInterface/P";
import {  ButtonProps, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createContext, useContext } from "react";

// Closes every modal the current component is nested in. Modals opt in by
// wrapping their contents in CloseWithConfirm.
const CloseParentModalsContext = createContext<() => void>(() => {});

export function CloseWithConfirm({ close, children }: { close: () => void, children: React.ReactNode }) {
	const closeParents = useContext(CloseParentModalsContext);
	return (
		<CloseParentModalsContext value={() => { close(); closeParents(); }}>
			{children}
		</CloseParentModalsContext>
	)
}

export default function ConfirmButton({action, description, children, ...rest}: {action:  (...args: any[]) => void, description: string, children: React.ReactNode} & ButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const closeParents = useContext(CloseParentModalsContext);
	return (
		<>
		<Button variant={rest.variant || "filled"} onClick = {open}>{children}</Button>
		<Modal zIndex={1000} opened={opened} onClose={close} title="Confirm" centered>
			<Stack>
        	<P>Are you sure you want to {description}?</P>
			<Button onClick={() => {
					action();
					close();
					closeParents();
				}}>Confirm</Button>
			</Stack>
      	</Modal>
		</>
	)
}
