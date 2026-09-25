// Phone video is ~40-60MB/min at 1080p (far more at 4K), but evidence plays in
// a ~300px player. Re-encoding to 720p H.264 cuts upload size several-fold.
const MAX_DIMENSION = 1280;
const VIDEO_BITRATE = 2_500_000;
// Short clips upload quickly anyway; not worth the encode time.
const SKIP_BELOW_BYTES = 8 * 1024 * 1024;
// Give up and upload the original if encoding stalls or the device is too slow.
const TIMEOUT_BASE_MS = 60_000;
const TIMEOUT_PER_VIDEO_SECOND_MS = 2_000;

// Re-encodes a video to at most 720p H.264/AAC MP4 using the browser's
// (usually hardware) WebCodecs encoder. Anything that can't be converted
// cleanly — no WebCodecs, unsupported codec, a track that would be dropped, a
// larger result, or a timeout — is returned unchanged.
export default async function compressVideo(file: File): Promise<File> {
	if (!file.type.startsWith("video/") || file.size < SKIP_BELOW_BYTES || typeof VideoEncoder === "undefined") {
		return file;
	}
	try {
		// Loaded on demand so photo-only players never download the encoder.
		const {
			Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS, Quality, canEncodeVideo
		} = await import("mediabunny");

		const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) return file;

		// Display dimensions already account for rotation metadata, so this
		// scales the long edge whether the clip is portrait or landscape.
		const { displayWidth, displayHeight } = videoTrack;
		const scale = Math.min(1, MAX_DIMENSION / Math.max(displayWidth, displayHeight));
		// Encoders need even dimensions.
		const width = Math.round(displayWidth * scale / 2) * 2;
		const height = Math.round(displayHeight * scale / 2) * 2;
		const videoQuality = new Quality({ bitrate: VIDEO_BITRATE });
		if (!(await canEncodeVideo("avc", { width, height, quality: videoQuality }))) return file;

		const output = new Output({
			// Moov atom up front so the log's player can start before the whole file downloads.
			format: new Mp4OutputFormat({ fastStart: "in-memory" }),
			target: new BufferTarget(),
		});
		const conversion = await Conversion.init({
			input,
			output,
			video: { width, height, fit: "contain", codec: "avc", quality: videoQuality },
			// No bitrate: phone audio is already AAC and small, so it's copied
			// as-is. Setting one would force a re-encode, and not every browser
			// can encode AAC (e.g. Firefox).
			audio: { codec: "aac" },
			showWarnings: false,
		});
		// Rather upload the original than silently lose the video or its sound
		// (e.g. a browser that can't encode AAC for a non-AAC source).
		const lostMedia = conversion.discardedTracks.some(({ track }) => track.isVideoTrack() || track.isAudioTrack());
		if (!conversion.isValid || lostMedia) return file;

		const duration = await input.computeDuration();
		const timeoutMs = TIMEOUT_BASE_MS + duration * TIMEOUT_PER_VIDEO_SECOND_MS;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const timedOut = new Promise<"timeout">(resolve => { timer = setTimeout(() => resolve("timeout"), timeoutMs); });
		const result = await Promise.race([conversion.execute(), timedOut]);
		clearTimeout(timer);
		if (result === "timeout") {
			console.warn("video compression timed out, uploading original");
			await conversion.cancel();
			return file;
		}

		const buffer = output.target.buffer;
		if (!buffer || buffer.byteLength >= file.size) return file;
		// The log picks image vs video rendering from the URL's extension.
		const name = file.name.replace(/\.[^.]*$/, "") + ".mp4";
		return new File([buffer], name, { type: "video/mp4", lastModified: file.lastModified });
	} catch (e) {
		console.warn("couldn't compress video, uploading original", e);
		return file;
	}
}
