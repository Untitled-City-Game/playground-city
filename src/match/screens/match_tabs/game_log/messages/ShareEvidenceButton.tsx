import { ActionIcon, Tooltip } from "@mantine/core";
import { useState } from "react";
import { IoShareSocialOutline } from "react-icons/io5";

// Share button for one piece of challenge evidence, shown beside it in the log.
//
// Sharing the file itself needs the storage bucket to send CORS headers.
// Without them the fetch fails and we share the link instead.

const fileCache = new Map<string, Promise<File>>();

function fetchFile(link: string, mime: string): Promise<File> {
	let file = fileCache.get(link);
	if (!file) {
		file = fetch(link)
			.then(response => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.blob();
			})
			.then(blob => new File([blob], fileName(link), { type: blob.type || mime }));
		// Don't cache failures, so a later tap can retry.
		file.catch(() => fileCache.delete(link));
		fileCache.set(link, file);
	}
	return file;
}

// Firebase download URLs look like .../o/images%2Fplayer01234.jpg?alt=media
function fileName(link: string) {
	const path = decodeURIComponent(new URL(link).pathname);
	return path.split("/").pop() || "evidence";
}

export function ShareEvidenceButton({ link, mime, title }: { link: string; mime: string; title: string }) {
	const [message, setMessage] = useState<string>();

	function flash(text: string) {
		setMessage(text);
		setTimeout(() => setMessage(undefined), 2000);
	}

	async function share() {
		if (!navigator.share) {
			// Desktop browsers without a share sheet: copy the link instead.
			await navigator.clipboard?.writeText(link);
			flash("Link copied");
			return;
		}
		let data: ShareData = { title, url: link };
		try {
			const file = await fetchFile(link, mime);
			if (navigator.canShare?.({ files: [file] })) data = { title, files: [file] };
		} catch {
			// No CORS access to the file; share the link.
		}
		try {
			await navigator.share(data);
		} catch (error) {
			// Safari refuses to share if the download took too long after the tap.
			// The file is cached now, so a second tap opens the share sheet at once.
			if (error instanceof DOMException && error.name === "NotAllowedError") {
				flash("Tap again to share");
			}
			// AbortError means the user closed the share sheet: nothing to do.
		}
	}

	return (
		<Tooltip label={message} opened={message !== undefined} withArrow>
			<ActionIcon
				variant="light"
				color="gray"
				radius="xl"
				size="lg"
				aria-label="Share"
				onClick={share}
				style={{ flexShrink: 0 }}
			>
				<IoShareSocialOutline size={18} />
			</ActionIcon>
		</Tooltip>
	);
}
