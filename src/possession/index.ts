export {
  LINE_BANK,
  POSSESSION_TONES,
  pickLine,
  pickTone,
  lineCount,
  type PossessionTone,
} from "./lineBank";

export {
  SpeechDirector,
  type SpeechActive,
  type SpeechDirectorOptions,
  type SpeechTrigger,
  type SpeechUtterance,
} from "./speech";

export {
  TRUST_MIN,
  TRUST_MAX,
  TRUST_DEFAULT,
  TRUST_PACIFY,
  TRUST_AGGRO,
  TrustLedger,
  clampTrust,
  isPacified,
  isAggressive,
  attitudeFromTrust,
  type HostileAttitude,
} from "./trust";

export {
  DIALOGUE_OPTIONS,
  DIALOGUE_REACH,
  DialogueSession,
  applyDialogueChoice,
  applyDialogueChoiceAsync,
  nearestPossessed,
  optionFor,
  type DialogueIntent,
  type DialogueOption,
  type DialogueResult,
  type DialogueLlmOpts,
  type NearbyPossessed,
} from "./dialogue";

export {
  MEMORY_CAPACITY,
  MEMORY_SUMMARY_MAX_LEN,
  ShortMemory,
  formatMemorySummary,
  toneBiasFromEntries,
  type MemoryEntry,
} from "./memory";

export {
  StubLlmBridge,
  MemoryLlmFileIo,
  formatLlmPrompt,
  compactMoodBias,
  compactTtl,
  resolveLineWithBridge,
  type LlmAskSnapshot,
  type LlmBridge,
  type LlmFileIo,
  type StubLlmBridgeOptions,
  type ResolveLineOptions,
  type LineSource,
} from "./llmBridge";

export {
  GATE_CALM_MIN_TRUST,
  GATE_CALM_PACIFY_TTL,
  GATE_THREAT_MAX_TRUST,
  GATE_THREAT_SPEED_TTL,
  GATE_THREAT_SPEED_MUL,
  GATE_ASK_MIN_TRUST,
  GATE_ASK_EXTRA_TRUST,
  GATE_OFFER_MIN_TRUST,
  GATE_OFFER_PACIFY_TTL,
  GATE_DISTRACT_MIN_TRUST,
  GATE_DISTRACT_NOISE,
  GATE_DISTRACT_DEFAULT_OFFSET,
  GATE_LINE_MAX_LEN,
  GATE_THRESHOLDS,
  GATE_TAGS,
  isGateTag,
  compactKnownGateTags,
  proposeDialogueGates,
  DialogueBehaviorGates,
  type GateTag,
  type GateProposal,
  type DialogueGateContext,
} from "./gates";

export {
  emptyPossession,
  capturePossession,
  normalizePossession,
  applyPossession,
  type SavePossession,
  type SaveGateState,
} from "./persist";
