import { Center, Container, Modal, ScrollArea, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { BsQuestionCircleFill } from "react-icons/bs";
import Markdown from 'react-markdown'
import HowToPlay from '@data/how_to_play.md'
import Button from "@/src/userInterface/CustomButton";

export default function HelpIcon() {
    const [opened, { open, close }] = useDisclosure(false);
    return (
        <>
            <HelpModal opened={opened} close={close} />
            <UnstyledButton onClick={open}>
                <Center>
                    <BsQuestionCircleFill size={20} />
                </Center>
            </UnstyledButton>
        </>
    );
}

export function HelpButton() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Button w="100%" variant="outline" onClick={open}>How to Play</Button>
            <HelpModal opened={opened} close={close} />
        </>
    );
}

export function HelpModal({
    opened,
    close,
}: {
    opened: boolean;
    close: () => void;
}) {
    return (
        <Modal
            opened={opened}
            onClose={close}
            centered
            mah="70vh"
            title={
                <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                    How to play Connect 4
                </span>
            }>
            <Container style={{
                maxHeight: "60vh",
                overflowY: "scroll",
            }}
                className="markdown"
            >
                <Markdown>{HowToPlay}</Markdown>
            </Container>
        </Modal>
    );
}
