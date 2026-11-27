// The module frame (D-12) — registry and contract: docs/design/components/module.md.
//
// A child route of a module (`src/screens/<area>/module-routes.tsx`):
//
//     export const moduleRoutes: ModuleChildRoute[] = [{ path: 'workflow', element: <WorkflowView /> }]
//
//     function WorkflowView() {
//       const { module } = useRouteModule()
//       return <ModuleFrame module={module} view="workflow" title={…}>…</ModuleFrame>
//     }
export { collectDefinitions, definitionOf, moduleDefinitions, stubDefinition } from './definitions'
export type { ModuleDefinitions } from './definitions'
export { accountsPath, failureWords, ModuleFrame } from './ModuleFrame'
export type { FailureWords, ModuleFrameProps } from './ModuleFrame'
export { RouteModuleContext, useRouteModule } from './route-context'
export type { ModuleChildRoute, RouteModule } from './route-context'
export { collectSettingsPanels, ModuleSettingsPanelsContext, useModuleSettingsPanels } from './settings-panels'
export type { ModuleSettingsPanel, ModuleSettingsPanels, SettingsPanelId, SettingsPanelProps } from './settings-panels'
