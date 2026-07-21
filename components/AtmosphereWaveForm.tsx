import dynamic from "next/dynamic";

const AtmosphereWaveform = dynamic(
  () => import("@/components/AtmosphereWaveform"),
  { ssr: false }
);