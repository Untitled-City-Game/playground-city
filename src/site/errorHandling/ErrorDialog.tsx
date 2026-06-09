import Span from "@/src/userInterface/Span";
import { FallbackProps } from "react-error-boundary";
import { useDisclosure } from '@mantine/hooks';
import { Accordion, Anchor, Code, Collapse, Modal } from '@mantine/core';
import P from '@/src/userInterface/P';
import Button from "@/src/userInterface/CustomButton";
export default function ErrorDialog({ error, resetErrorBoundary } : {error: Error, resetErrorBoundary : () => void}){
	const [opened, { open, close }] = useDisclosure(true);
	const [stack, { toggle }] = useDisclosure(false);
	return (
		<Modal opened={opened} onClose={close} title={<h2>Something went wrong</h2>}>
			<P><Code fw="bold">{error.name}</Code></P>
       		<P><Code>{error.message}</Code></P>
			        <Button onClick={toggle}>More details</Button>
			       <Collapse in={stack}>
					<P><Code>{error.stack}</Code></P>
				</Collapse>
			{process.env.BUG_REPORT ?
				<P><Anchor href={process.env.BUG_REPORT} target="_blank" rel="noopener noreferrer">Report a bug</Anchor></P>
				: null}
      	</Modal>

	)
}