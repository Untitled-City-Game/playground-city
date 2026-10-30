import { useReviewFiles } from "@/src/review/ReviewLayout";
import { parseMatchFiles } from "@/src/review/replay";
import P from "@/src/userInterface/P";
import { Alert, Center, Container, FileInput, Stack, Title } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function ReviewUpload() {
	const { setFiles } = useReviewFiles();
	const navigate = useNavigate();
	const [error, setError] = useState<string>();

	async function load(files: File[]) {
		if (files.length === 0) return;
		setError(undefined);
		try {
			const matchFiles = await parseMatchFiles(files);
			setFiles(matchFiles);
			navigate(`/review/${encodeURIComponent(matchFiles.matchID)}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}

	return (
		<Container size="xs" pt="xl">
			<Center>
				<Stack w="100%">
					<Title order={1}>Review a match</Title>
					<P mb="0">
						Select the match files saved by <code>scripts/fetch-log.sh</code>: at least <code>initial.json</code> and <code>log.json</code> from the match's folder. Add <code>state.json</code> to check the replay against the final saved state.
					</P>
					<FileInput
						label="Match files"
						placeholder="Choose files"
						multiple
						accept=".json,application/json"
						onChange={load}
					/>
					{error ? <Alert color="red">{error}</Alert> : null}
					<P mb="0" c="dimmed" fz="sm">
						While reviewing, use the arrow keys or A and D to step through the match. The step controls and the choice of player are in the settings menu.
					</P>
				</Stack>
			</Center>
		</Container>
	);
}
