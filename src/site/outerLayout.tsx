import { theme } from "@/src/styles/theme";
import Header from "@/src/userInterface/Header/Header";
import { Anchor, Center, Container, MantineProvider, Stack, Text } from "@mantine/core";
import { Outlet } from "react-router";
import packageJson from "@/package.json";

export default function OuterLayout() {
	return (
		<MantineProvider theme={theme}>
			{/* <Header color="rainbow">Playground City</Header> */}
			<Center>
			<img src="logo.png" style={{
				width: "80%",
				maxWidth: "30rem",
				paddingTop: "1rem"
			}} />
			</Center>
			<Container>
				<Center>
					<Outlet />
				</Center>
			</Container>
			<Center mt="xl" mb="md">
				<Stack gap={4} align="center">
					<Text size="xs" c="dimmed">v{packageJson.version}</Text>
					{process.env.BUG_REPORT ?
						<Anchor href={process.env.BUG_REPORT} target="_blank" rel="noopener noreferrer" size="xs" c="dimmed">Report a bug</Anchor>
						: null}
				</Stack>
			</Center>
		</MantineProvider>
	);
}
