import { zoneColors } from "@/scripts/zoneColors";
import { theme } from "@/src/styles/theme";
import Span from "@/src/userInterface/Span";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { max } from "lodash";
import { FaBan, FaLock } from "react-icons/fa";
type PolygonLabelProps = {
    label: string,
    position: { lat: number, lng: number },
    zoom: number,
    color?: string,
    locked?: boolean,
    selected?: boolean,
    disabled?: boolean,
    handleClick: () => void,
}
export default function PolygonLabel(props: PolygonLabelProps) {
    const { label, position, zoom, color, locked, selected, disabled, handleClick } = props;
    const zoomThreshold = 15;
    if (zoom > zoomThreshold) {
        return null;
    }
    return (
        <AdvancedMarker
            position={position}
            onClick={handleClick}
            anchorTop="-50%"
            zIndex={selected ? 10 : 1}
        >
            <div
                style={{
                    borderStyle: color ? locked ? "solid" : "dashed" : "solid",
                    borderWidth: color ? locked ? "4px" : "2px" : selected ? "4px" : "2px",
                    backgroundColor: "white",

                    borderColor: color ? theme.colors[color][6] : selected ? zoneColors.selectedBorder : "grey",

                    ...labelStyle
                }}>
                {locked ? <FaLock size="1rem" color={theme.colors[color || "yellow"][6]} /> : null}
                {disabled ? <FaBan size="1rem" color="black" /> : null}
                <Span
                    className="mono"
                    style={{
                        lineHeight: "1rem",
                        width: "min-content",
                    }}
                    fw="500" >
                    {label}
                </Span>
            </div>
        </AdvancedMarker>
    )
}

const labelStyle: React.CSSProperties = {
    borderRadius: "8px",
    padding: "0.3rem",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    animation: "growIn 0.1s ease-out",
    transformOrigin: "center",
}