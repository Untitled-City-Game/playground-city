import { fetchMapData, matchMapCenter } from "@/scripts/fetchMapData";
import { CityOrCustom, MatchMapData } from "@/scripts/types/types";
import VisGlMapElement from "@/src/match/googleMaps/VisGLMapElement";
import { GenericMapZones } from "@/src/match/screens/connect_four/GenericMapZones";
import P from "@/src/userInterface/P";
import { Box, Loader, Select, Stack } from "@mantine/core";
import React, { useEffect, useState } from "react";

export default function StartingZonePicker({
    city,
    customMapId,
    mapData: mapDataProp,
    value,
    onChange,
    onMapDataLoaded,
}: {
    city: CityOrCustom;
    customMapId?: string;
    mapData?: MatchMapData;
    value?: string;
    onChange: (zone: string) => void;
    onMapDataLoaded?: (mapData: MatchMapData) => void;
}) {
    const [fetchedMapData, setFetchedMapData] = useState<MatchMapData | undefined>();
    const [error, setError] = useState<string | undefined>();
    const mapData = mapDataProp ?? fetchedMapData;

    useEffect(() => {
        // If the parent supplied map data, skip the internal fetch.
        if (mapDataProp) return;
        let cancelled = false;
        setFetchedMapData(undefined);
        setError(undefined);
        fetchMapData(city, customMapId).then((data) => {
            if (cancelled) return;
            setFetchedMapData(data);
            onMapDataLoaded?.(data);
        }).catch((e) => {
            if (cancelled) return;
            setError(e instanceof Error ? e.message : "Could not load that map.");
        });
        return () => {
            cancelled = true;
        };
    }, [city, customMapId, mapDataProp]);

    if (error) {
        return <P fz="sm" c="red">{error}</P>;
    }

    if (!mapData) {
        return (
            <Stack align="center" gap="xs">
                <Loader />
                <P fz="sm">Loading map...</P>
            </Stack>
        );
    }

    const options = mapData.zonePolygons.map((zone) => ({
        value: zone.featureName,
        label: zone.featureName,
    }));

    return (
        <Stack gap="0.5rem">
            <div>
                <P fz="sm">The starting neighbourhood cannot be claimed first.</P>
                <P fz="sm">Teams must leave the starting neighbourhood, and claim another neighbourhood.</P>
            </div>
            <Select
                label="Starting neighbourhood"
                data={options}
                value={value || null}
                onChange={(v) => onChange(v ?? "")}
            />
            <Box style={mapContainerStyle}>
                <VisGlMapElement center={matchMapCenter(mapData)} gestureHandling="cooperative">
                    <GenericMapZones
                        MapData={mapData}
                        selectedZone={value ?? ""}
                        onClick={onChange}
                    />
                </VisGlMapElement>
            </Box>
        </Stack>
    );
}

const mapContainerStyle: React.CSSProperties = {
    minHeight: "40vh",
    width: "100%",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
    position: "relative",
    height: 0,
};
