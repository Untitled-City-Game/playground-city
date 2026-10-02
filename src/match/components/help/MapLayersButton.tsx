import { setTransitLayer, TransitLayerSettings, useTransitLayers } from "@/src/match/components/transit/transitLayerSettings";
import { Center, Checkbox, Modal, Stack, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { BsLayersFill } from "react-icons/bs";

const layerOptions: { layer: keyof TransitLayerSettings, label: string, description?: string }[] = [
	{ layer: "train", label: "Train lines" },
	{ layer: "metro", label: "Metro lines" },
	{ layer: "tram", label: "Light rail & tram lines" },
	{ layer: "bus", label: "Bus lines", description: "Shown when zoomed in" },
];

export default function MapLayersIcon() {
	const [opened, { open, close }] = useDisclosure(false);

	return (
		<>
			<MapLayersModal opened={opened} close={close} />
			<UnstyledButton onClick={open} aria-label="Map layers">
				<Center>
					<BsLayersFill size={20} />
				</Center>
			</UnstyledButton>
		</>
	);
}

export function MapLayersModal({
	opened,
	close,
}: {
	opened: boolean;
	close: () => void;
}) {
	const layers = useTransitLayers();
	return (
		<Modal
			opened={opened}
			onClose={close}
			title={
				<span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
					Map layers
				</span>
			}>
			<Stack>
				{layerOptions.map(({ layer, label, description }) =>
					<Checkbox
						key={layer}
						label={label}
						description={description}
						checked={layers[layer]}
						onChange={(event) => setTransitLayer(layer, event.currentTarget.checked)}
					/>
				)}
			</Stack>
		</Modal>
	);
}
