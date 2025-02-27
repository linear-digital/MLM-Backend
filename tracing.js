const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-grpc");

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4400", // Adjust this if using a different tracing backend
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start OpenTelemetry
sdk.start();
console.log("✅ OpenTelemetry Initialized!");