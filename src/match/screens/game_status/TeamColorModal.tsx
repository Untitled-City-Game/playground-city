import { Color } from "@/scripts/types/types";
import { ComplexHeader } from "@/src/userInterface/Header/Header";
import { Box, Container, Group, Modal, useMantineTheme } from "@mantine/core";

// Centered modal with a title bar tinted in the given team's colour.
export default function TeamColorModal({ opened, onClose, team, title, children }: {
    opened: boolean,
    onClose: () => void,
    team: Color,
    title: React.ReactNode,
    children: React.ReactNode,
}) {
    const theme = useMantineTheme();
    const teamColors = theme.colors[team];
    const headerStyle = {
        background: teamColors[1],
        borderBottom: `2px solid ${teamColors[6]}`,
    };

    return (
        <Modal.Root opened={opened} onClose={onClose} padding={0} radius={0} centered>
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header style={{ gap: 0, padding: 0, justifyContent: "flex-start", alignItems: "flex-start" }}>
                    <ComplexHeader w="100%" style={headerStyle}>
                        <Group w="100%" justify="space-between" align="flex-start" wrap="nowrap" gap="0">
                            <Box flex="1 1 30px"></Box>
                            <Box flex="1 0 auto" ta="center">
                                <h1>{title}</h1>
                            </Box>
                            <Box flex="1 1 30px" ta="right">
                                <Modal.CloseButton size="lg" mt="5px" mr="5px" />
                            </Box>
                        </Group>
                    </ComplexHeader>
                </Modal.Header>
                <Modal.Body>
                    <Container pb="md">
                        {children}
                    </Container>
                </Modal.Body>
            </Modal.Content>
        </Modal.Root>
    );
}
