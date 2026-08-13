export {
  createAmbientBus,
  tickAmbient,
  ambientLevels,
  ambientTargets,
  describeAmbient,
  toggleAmbientMute,
  type AmbientLayer,
  type AmbientLevels,
  type AmbientState,
  type AmbientBus,
} from "./ambientStub";

export {
  createFootstepsBus,
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
  syncFootstepPlayer,
  type FootstepPlayer,
  type FootstepPlayerSync,
} from "./footstepPlayer";

export {
  computeLayerGain,
  shouldBeSilent,
  createAmbientPlayer,
  syncAmbientPlayer,
  type AmbientPlayer,
} from "./ambientPlayer";

export {
  shouldPlayCombatSfx,
  combatBeepSpec,
  createCombatPlayer,
  playMelee,
  playHit,
  playGun,
  type CombatSfxKind,
  type CombatBeepSpec,
  type CombatPlayer,
} from "./combatPlayer";

export {
  shouldPlayInteractSfx,
  interactBeepSpec,
  createInteractPlayer,
  playDoor,
  playLoot,
  playUse,
  type InteractSfxKind,
  type InteractBeepSpec,
  type InteractPlayer,
} from "./interactPlayer";
