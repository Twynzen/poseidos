export {
  createAmbientBus,
  resetAmbientAfterRestart,
  tickAmbient,
  ambientTickApplies,
  ambientLevels,
  ambientTargets,
  describeAmbient,
  toggleAmbientMute,
  muteHudMsg,
  MUTE_HUD_MSG,
  SOUND_HUD_MSG,
  type AmbientLayer,
  type AmbientLevels,
  type AmbientState,
  type AmbientBus,
} from "./ambientStub";

export {
  createFootstepsBus,
  resetFootstepsAfterRestart,
  tickFootsteps,
  footstepsLevel,
  footstepsTarget,
  describeFootsteps,
  type FootstepsState,
  type FootstepsBus,
} from "./footstepsStub";

export {
  shouldEmitFootstep,
  createFootstepPlayer,
  resetFootstepPlayerAfterRestart,
  syncFootstepPlayer,
  type FootstepPlayer,
  type FootstepPlayerSync,
} from "./footstepPlayer";

export {
  computeLayerGain,
  shouldBeSilent,
  createAmbientPlayer,
  ambientPlayerGainsAfterRestart,
  ambientPlayerVoiceGains,
  resetAmbientPlayerAfterRestart,
  syncAmbientPlayer,
  GAIN_RAMP_SEC,
  type AmbientPlayer,
} from "./ambientPlayer";

export {
  shouldPlayCombatSfx,
  combatBeepSpec,
  createCombatPlayer,
  combatBeepsAfterRestart,
  combatPlayerScheduled,
  resetCombatPlayerAfterRestart,
  playMelee,
  playHit,
  playGun,
  playDryFire,
  type CombatSfxKind,
  type CombatBeepSpec,
  type CombatVoice,
  type CombatPlayer,
} from "./combatPlayer";

export {
  shouldPlayInteractSfx,
  interactBeepSpec,
  createInteractPlayer,
  interactBeepsAfterRestart,
  interactPlayerScheduled,
  resetInteractPlayerAfterRestart,
  playDoor,
  playLoot,
  playUse,
  type InteractSfxKind,
  type InteractBeepSpec,
  type InteractVoice,
  type InteractPlayer,
} from "./interactPlayer";

export {
  shouldPlaySpeechSfx,
  speechBeepSpec,
  createSpeechPlayer,
  speechBeepsAfterRestart,
  speechPlayerScheduled,
  resetSpeechPlayerAfterRestart,
  playSpeech,
  type SpeechBeepSpec,
  type SpeechVoice,
  type SpeechPlayer,
} from "./speechPlayer";

export {
  HEARTBEAT_HP_RATIO,
  heartbeatIntervalSec,
  createHeartbeatBus,
  tickHeartbeat,
  type HeartbeatBus,
} from "./heartbeat";

export {
  shouldPlayHeartbeatSfx,
  heartbeatBeepSpec,
  createHeartbeatPlayer,
  heartbeatBeepsAfterRestart,
  heartbeatPlayerScheduled,
  resetHeartbeatPlayerAfterRestart,
  playHeartbeat,
  type HeartbeatBeepSpec,
  type HeartbeatVoice,
  type HeartbeatPlayer,
} from "./heartbeatPlayer";
