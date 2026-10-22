// Evidence is shown at most ~300px wide in the log, so full-resolution phone
// photos (several MB) are mostly wasted upload time on mobile data.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
// Small enough already; not worth re-encoding.
const SKIP_BELOW_BYTES = 300 * 1024;
// Animated or vector formats would be flattened by a canvas re-encode.
const SKIP_TYPES = ["image/gif", "image/svg+xml"];

// Downscales a photo to fit within MAX_DIMENSION and re-encodes it as JPEG.
// Anything that isn't a resizable image, or that fails to decode (e.g. HEIC in
// browsers without support), is returned unchanged.
export default async function resizeImage(file: File): Promise<File> {
	if (!file.type.startsWith("image/") || SKIP_TYPES.includes(file.type) || file.size < SKIP_BELOW_BYTES) {
		return file;
	}
	try {
		// Explicit, since older Safari doesn't apply EXIF rotation by default.
		const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
		const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		const context = canvas.getContext("2d");
		if (!context) {
			bitmap.close();
			return file;
		}
		// JPEG has no alpha, so give transparent images a white background
		// rather than black.
		context.fillStyle = "white";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();

		const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
		if (!blob || blob.size >= file.size) return file;
		// The log picks image vs video rendering from the URL's extension, so
		// the name must match the new format.
		const name = file.name.replace(/\.[^.]*$/, "") + ".jpg";
		return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
	} catch (e) {
		console.warn("couldn't resize image, uploading original", e);
		return file;
	}
}
