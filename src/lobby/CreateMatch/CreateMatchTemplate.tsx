import { games } from "@/scripts/consts";
import { CityOrCustom, NamedColor, PlayerData } from "@/scripts/types/types";
import Loading from "@/src/match/screens/game_status/Loading";
import Span from "@/src/userInterface/Span";
import { Alert, Radio, Paper, Group, LoadingOverlay, Stack, TextInput, Checkbox, Stepper, StepperProps } from "@mantine/core";
import { hasLength, useForm, UseFormReturnType } from "@mantine/form";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LobbyClient } from "boardgame.io/client";
import { joinMatch } from "@/scripts/joinMatch";
import { FaRegSnowflake } from "react-icons/fa6";
import SafariWarning from "@/src/site/SafariWarning";
interface CreateGameFormUniversal extends UseFormReturnType<any> { }
import { MdOutlineMoneyOff } from "react-icons/md";
import Button from "@/src/userInterface/CustomButton";
export type FormValues = {
    PlayerName: string;
    teamColor: NamedColor;
    gameName: string;
    city?: CityOrCustom;
    customMapLink?: string;
    winter?: boolean;
    money?: boolean;
    [key: string]: any;
};

export interface ExtraStep {
    label: string;
    content: React.ReactNode;
    fields?: string[];
}

export default function CreateMatchTemplate({
    teamOptions,
    gameCode,
    getSetupData,
    createGameForm,
    extraSteps,
    firstStepFields,
    firstStepBlocked,
    children
}: {
    teamOptions: string[]
    gameCode: string
    getSetupData: (args: FormValues) => Record<string, unknown> | Promise<Record<string, unknown>>;
    createGameForm: CreateGameFormUniversal;
    extraSteps?: ExtraStep[];
    /** Form fields on the game-specific first step to validate before advancing. */
    firstStepFields?: string[];
    /** Holds the first step open for reasons the form can't express, e.g. a custom map that hasn't loaded yet. */
    firstStepBlocked?: boolean;
    children: React.ReactNode
}) {
    const [loading, setLoading] = useState(false);
    const [createError, setCreateError] = useState<string | undefined>();
    const [step, setStep] = useState(0);
    const teamCards = createTeamCards(teamOptions);
    const navigate = useNavigate();
    const baseStepCount = 4;
    const totalSteps = baseStepCount + (extraSteps?.length ?? 0);

    const stepFields: string[][] = [
        firstStepFields ?? [],  // step 0: game-specific (children)
        [],            // step 1: modes (toggles, no validation)
        ["PlayerName"],
        ["teamColor"],
        ...(extraSteps?.map((s) => s.fields ?? []) ?? []),
    ];

    function handleNext(e?: React.SyntheticEvent) {
        e?.preventDefault();
        if (step === 0 && firstStepBlocked) return;
        const fields = stepFields[step];
        const hasError = fields
            .map((field) => createGameForm.validateField(field).hasError)
            .some(Boolean);
        if (hasError) return;
        setStep((s) => Math.min(s + 1, totalSteps - 1));
    }

    function handleBack(e?: React.SyntheticEvent) {
        e?.preventDefault();
        if (step === 0) {
            navigate(-1);
            return;
        }
        setStep((s) => Math.max(s - 1, 0));
    }

    const lobbyClient = useMemo(
        () => new LobbyClient({ server: process.env.GAME_SERVER }),
        []
    );

    async function handleCreateGame(values: FormValues) {
        setLoading(true);
        setCreateError(undefined);
        if (!gameCode) { throw new Error("No game code provided"); }
        try {
            const gameSetupData = await getSetupData(values);
            const setupData = {
                winter: values.winter ?? false,
                money: values.money ?? false,
                ...gameSetupData
            }
            console.log("creating game", values, setupData);
            console.log("env game server", process.env.GAME_SERVER)
            console.log("env location server path", process.env.LOCATION_SERVER_PATH)
            //create match
            console.log("setting up match");
            const { matchID } = await lobbyClient.createMatch(gameCode, {
                numPlayers: 20,
                setupData
            });
            console.log("joining match");
            //join match
            const playerData: PlayerData = await joinMatch(
                lobbyClient,
                gameCode,
                matchID,
                values.PlayerName,
                values.teamColor,
                true
            );
            localStorage.setItem("localPlayerData", JSON.stringify(playerData));
            navigate("/match");
        } catch (error) {
            // Without this the loading overlay would sit there forever — most
            // likely cause is a custom map that stopped loading between steps.
            console.error("Failed to create match", error);
            setCreateError(error instanceof Error ? error.message : "Could not create the match. Please try again.");
            setLoading(false);
        }
    }

    const game = games.filter(game => game.code === gameCode)[0]

    return (
        <>
            <LoadingOverlay visible={loading} loaderProps={{ children: <Loading message="Joining match..." /> }} />
            <SafariWarning />

            <form
                style={{ width: "100%", height: "100%" }}
                onSubmit={(e) => {
                    if (step < totalSteps - 1) {
                        e.preventDefault();
                        handleNext();
                        return;
                    }
                    createGameForm.onSubmit(handleCreateGame)(e);
                }}
            >

                <Stack id="formstack" pb="sm" pt="sm" h="100%" justify="space-between">
                    <div>
                        <StyledStepper active={step} onStepClick={setStep} size="xs" pb="md">
                            <Stepper.Step label="City" />
                            <Stepper.Step label="Modes" />
                            <Stepper.Step label="Name" />
                            <Stepper.Step label="Team" />
                            {extraSteps?.map((s, i) => (
                                <Stepper.Step key={i} label={s.label} />
                            ))}
                        </StyledStepper>
                    </div>
                    <Stack>
                        {step === 0 && children}
                        {step >= baseStepCount && extraSteps?.[step - baseStepCount]?.content}
                        {step === 1 && (
                            <>
                                <Checkbox
                                    label="Frozen mode?"
                                    description="Removes challenges which don't work well in snowy winter weather"
                                    color="cyan"
                                    icon={FaRegSnowflake}
                                    key={createGameForm.key("winter")}
                                    {...createGameForm.getInputProps("winter", { type: "checkbox" })}
                                />
                                <Checkbox
                                    label="No money?"
                                    description="Removes challenges which involve small purchases e.g. boba, coffee"
                                    color="yellow"
                                    icon={MdOutlineMoneyOff}
                                    key={createGameForm.key("money")}
                                    {...createGameForm.getInputProps("money", { type: "checkbox" })}
                                />
                            </>
                        )}
                        {step === 2 && (
                            <TextInput
                                fz="lg"
                                label="Your name"
                                key={createGameForm.key("PlayerName")}
                                {...createGameForm.getInputProps("PlayerName")}
                            />
                        )}
                        {step === 3 && (
                            <Radio.Group
                                label="Choose a team"
                                key={createGameForm.key("teamColor")}
                                {...createGameForm.getInputProps("teamColor")}>
                                <Stack gap="xs">
                                    {teamCards}
                                </Stack>
                            </Radio.Group>
                        )}
                    </Stack>
                    <Group justify="space-between" pt="sm">
                        {createError && <Alert color="red" w="100%">{createError}</Alert>}
                        <Button onClick={handleBack} type="button">Back</Button>
                        {step < totalSteps - 1
                            ? <Button onClick={handleNext} type="button">Next</Button>
                            : <Button type="submit">Create and Join</Button>}
                    </Group>
                </Stack>
            </form>
        </>
    )
}

function createTeamCards(teamOptions: string[]) {
    return teamOptions.map((team) => (
        <Radio.Card radius="md" value={team} key={team}>
            <Paper radius="md" p="md">
                <Group wrap="nowrap" align="center">
                    <Radio.Indicator
                        iconColor='white'
                        color={team}
                        size="lg" />
                    <div>
                        <Span>{team}</Span>
                    </div>
                </Group>
            </Paper>
        </Radio.Card>
    ));
}



export function createGameFormConstructor(formValues: Record<string, any>, validators: Record<string, any>, teamOptions: string[]) {
    return useForm({
        mode: "uncontrolled",
        initialValues: {
            PlayerName: "",
            teamColor: "blue" as NamedColor,
            //numPlayers: numPlayers,
            gameName: "",
            ...formValues
        },
        validate: {
            PlayerName: hasLength(
                { min: 2, max: 20 },
                "Player name must be between 2 and 20 characters"
            ),
            teamColor: (teamColor) =>
                teamOptions.map((option) => option).includes(teamColor)
                    ? null
                    : "Invalid team",
            // gameName: hasLength(
            // 	{ min: 2, max: 20 },
            // 	"Game name must be between 2 and 20 characters"
            // ),
            ...validators
        },
    });

}

function StyledStepper(props: StepperProps) {
    return (
        <Stepper
            styles={{
                stepBody: {
                    display: 'none',
                },

                step: {
                    padding: 0,
                },

                stepIcon: {
                    borderWidth: 4,
                },

                separator: {
                    marginLeft: -2,
                    marginRight: -2,
                    height: 10,
                },
            }}
            {...props}
        />
    );
}