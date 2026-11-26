import type { ModuleChildRoute } from '@/module'

import { WorkflowEditor } from './WorkflowEditor'

// `/m/<ia-id>/workflow` — every module and sub-module has a workflow (D-10),
// so the route has no `match`. The frame's 工作流 view link points here.
export const moduleRoutes: ModuleChildRoute[] = [{ path: 'workflow', element: <WorkflowEditor /> }]
