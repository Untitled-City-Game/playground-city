// Evidence is shown at most ~300px wide in the log, so full-resolution phone
// photos (several MB) are mostly wasted upload time on mobile data.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
// Small enough already; not worth re-encoding.
const SKIP_BELOW_BYTES = 300 * 1024;
// Animated or vector formats would be flattened by a canvas re-encode.
const SKIP_TYPES = ["image/gif", "image/svg+xml"];
// iPhone photos. Only Safari can display these, so they're always converted,
// however small. Some browsers leave file.type empty for them, hence the name check.
const HEIF_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
function isHeif(file: File) {
	return HEIF_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name);
}

// Downscales a photo to fit within MAX_DIMENSION and re-encodes it as JPEG.
// Anything that isn't a resizable image, or that fails to decode (e.g. HEIC in
// browsers without support), is returned unchanged.
export default async function resizeImage(file: File): Promise<File> {
	const mustConvert = isHeif(file);
	if (!mustConvert && (!file.type.startsWith("image/") || SKIP_TYPES.includes(file.type) || file.size < SKIP_BELOW_BYTES)) {
		return file;
	}
	try {
		const bitmap = await decodeImage(file);
		const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		const context = canvas.getContext("2d");
		if (!context) {
			release(bitmap);
			return file;
		}
		// JPEG has no alpha, so give transparent images a white background
		// rather than black.
		context.fillStyle = "white";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		release(bitmap);

		const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
		// HEIF compresses better than JPEG, so a converted copy can be larger.
		// Keep it anyway: a smaller file nobody can view is no use.
		if (!blob || (!mustConvert && blob.size >= file.size)) return file;
		// The log picks image vs video rendering from the URL's extension, so
		// the name must match the new format.
		const name = file.name.replace(/\.[^.]*$/, "") + ".jpg";
		return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
	} catch (e) {
		console.warn("couldn't resize image, uploading original", e);
		return file;
	}
}

// createImageBitmap can't decode HEIF in every browser that can display it,
// so fall back to an <img>, which uses the browser's full set of decoders.
async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
	try {
		// Explicit, since older Safari doesn't apply EXIF rotation by default.
		return await createImageBitmap(file, { imageOrientation: "from-image" });
	} catch (e) {
		const url = URL.createObjectURL(file);
		try {
			const image = new Image();
			image.src = url;
			await image.decode();
			return image;
		} finally {
			URL.revokeObjectURL(url);
		}
	}
}

function release(image: ImageBitmap | HTMLImageElement) {
	if (image instanceof ImageBitmap) image.close();
}
