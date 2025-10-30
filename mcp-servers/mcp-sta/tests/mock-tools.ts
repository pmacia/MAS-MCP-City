import { z } from "zod";

// --- Actuation Schemas ---
const ActuateInputSchema = z.object({
  deviceId: z.string().describe("The unique ID of the device to actuate."),
  action: z.enum(["turn_on", "turn_off", "set_level"]).describe("The action to perform."),
  params: z.record(z.any()).optional().describe("Additional parameters."),
});
const ActuateOutputSchema = z.object({
  ok: z.boolean().describe("True if the action was executed successfully."),
  message: z.string().optional().describe("Confirmation or error message."),
});

// --- NGSI Schemas ---
const GetNgsiDataInputSchema = z.object({
    entityId: z.string().describe("The ID of the NGSI entity."),
    attribute: z.string().optional().describe("The specific attribute to retrieve."),
});
const NgsiOutputSchema = z.object({
    entityId: z.string(),
    result: z.any().describe("The requested entity data."),
    success: z.boolean(),
});

// --- STA Schemas ---
const GetStaObservationInputSchema = z.object({
    thingId: z.string().describe("The ID of the Thing/Sensor in the STA API."),
    datastreams: z.array(z.string()).optional().describe("List of Datastreams to query."),
    latest: z.boolean().default(true).describe("True to get the latest observation, False for historical data."),
});
const StaOutputSchema = z.object({
    thingId: z.string(),
    observations: z.any().describe("The sensor observations."),
    success: z.boolean(),
});


// Exporting the manifests using the .shape property (what the SDK expects)
export const MOCK_MANIFESTS = {
    'actuate-device': {
        title: "Smart Device Actuator",
        description: "Allows actuation on IoT devices.",
        inputSchema: ActuateInputSchema.shape,
        outputSchema: ActuateOutputSchema.shape,
    },
    'get-ngsi-data': {
        title: "Retrieve NGSI Entity Data",
        description: "Queries real-time data from an entity.",
        inputSchema: GetNgsiDataInputSchema.shape,
        outputSchema: NgsiOutputSchema.shape,
    },
    'get-sta-observation': {
        title: "Retrieve STA Observations",
        description: "Queries sensor observations via the SensorThings API.",
        inputSchema: GetStaObservationInputSchema.shape,
        outputSchema: StaOutputSchema.shape,
    },
};
