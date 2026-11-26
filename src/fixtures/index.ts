// The story data (spec part 2 § Fake workflow runtime, "A module's two
// halves"): every fact of the pet-grooming story, in both locales, per scene.
// A page builder (`src/modules/<ia-id>/module.ts`, part 3) reads the state the
// runtime gives it and uses the ids of `keys.ts`; it holds no fact itself.

export {
  accountId,
  appointmentStatus,
  basis,
  blockKey,
  column,
  defaultEstimate,
  firstVisitParam,
  moduleId,
  nodeId,
  tableId,
} from './keys'
export { emptyThread, emptyVariant, longSizes, longText, longVariant, previewErrors, withoutSource, withoutSummaries } from './preview'
export type { PreviewError } from './preview'
export { scene, sceneGroupNames, sceneNames } from './scenes'
export { cannedReply, chatScripts, miscTopic, scriptId } from './scripts'
export { customModule, stubWorkflow, subModuleTemplates } from './templates'
export {
  appointmentStatusNames,
  basisNames,
  breedBasisNames,
  breeds,
  breedType,
  breedTypes,
  channels,
  coats,
  confirmationStatusNames,
  services,
  sizes,
  staff,
  swapStatusNames,
  taskKindNames,
} from './vocabulary'
