// src/otel.ts
import { NodeSDK } from "@opentelemetry/sdk-node"
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api"
import { Resource } from "@opentelemetry/resources"
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions"
import { OTLPTraceExporter as OTLPTraceExporterHTTP } from "@opentelemetry/exporter-trace-otlp-http"
import { OTLPTraceExporter as OTLPTraceExporterGRPC } from "@opentelemetry/exporter-trace-otlp-grpc"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

const endpoint = process.env.OTLP_ENDPOINT || "http://localhost:4318"
const protocol = (process.env.OTLP_PROTOCOL || "http/protobuf").toLowerCase()
const sampling = Number(process.env.TRACE_SAMPLING || "1.0")

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]:
    process.env.SERVICE_NAME || "mcp-server",
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
    process.env.NODE_ENV || "development"
})

const exporter =
  protocol.includes("grpc")
    ? new OTLPTraceExporterGRPC({
        // el SDK gRPC suele usar endpoint sin schema
        url: endpoint.replace("http://", "").replace("https://", "")
      })
    : new OTLPTraceExporterHTTP({
        url: endpoint
      })

const sdk = new NodeSDK({
  resource,
  traceExporter: exporter,
  spanProcessor: new BatchSpanProcessor(exporter)
})

export async function startOTel() {
  await sdk.start()
  console.log("[OTEL] started", { endpoint, protocol, sampling })
}

export async function shutdownOTel() {
  await sdk.shutdown()
}
