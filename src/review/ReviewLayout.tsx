import { MatchFiles } from "@/src/review/replay";
import { theme } from "@/src/styles/theme";
import { MantineProvider } from "@mantine/core";
import { useState } from "react";
import { Outlet, useOutletContext } from "react-router";

// Holds the match files loaded on /review for the review screen. They're also
// kept in sessionStorage so a refresh doesn't lose them; that can fail (size
// limit, private browsing), in which case a refresh goes back to the upload page.
const STORAGE_KEY = "reviewMatchFiles";

type ReviewFiles = {
	files: MatchFiles | undefined;
	setFiles: (files: MatchFiles) => void;
};

export function useReviewFiles() {
	return useOutletContext<ReviewFiles>();
}

export default function ReviewLayout() {
	const [files, setFilesState] = useState<MatchFiles | undefined>(() => {
		try {
			const stored = sessionStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) as MatchFiles : undefined;
		} catch {
			return undefined;
		}
	});

	function setFiles(newFiles: MatchFiles) {
		setFilesState(newFiles);
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles));
		} catch (error) {
			console.warn("couldn't keep match files for refresh", error);
		}
	}

	return (
		<MantineProvider theme={theme}>
			<Outlet context={{ files, setFiles } satisfies ReviewFiles} />
		</MantineProvider>
	);
}
