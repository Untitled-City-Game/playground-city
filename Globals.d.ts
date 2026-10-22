declare module "*.md";
declare module "csvjson-csv2json" {
	const csv2json: (csv: string, options?: { parseNumbers?: boolean }) => unknown[];
	export default csv2json;
}