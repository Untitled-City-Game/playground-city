import { MatchTeamColor } from "@/scripts/types/types";
import { CSSProperties } from "react";

interface TeamAvatarProps {
	color: MatchTeamColor;
	photoURL?: string;
	style?: CSSProperties;
}

export default function TeamAvatar({ color, photoURL, style }: TeamAvatarProps) {
	if (photoURL) {
		return <img style={style} src={photoURL} />;
	}
	return (
		<div
			style={{
				backgroundColor: `var(--mantine-color-${color}-6)`,
				color: "white",
				fontWeight: 700,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				textTransform: "uppercase",
				aspectRatio: "1 / 1",
				containerType: "inline-size",
				overflow: "hidden",
				...style,
			}}
		>
			<span style={{ fontSize: "55cqw", lineHeight: 1 }}>{color.charAt(0)}</span>
		</div>
	);
}
