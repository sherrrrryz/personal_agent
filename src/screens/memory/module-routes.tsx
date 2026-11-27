import type { ModuleChildRoute } from '@/module'

import { MemoryView } from './MemoryView'

// `/m/<ia-id>/memory` — every module and sub-module has a memory view (a stub's
// is empty), so the route has no `match`. The frame's 记忆 view link, 服务时长's
// page and the editor's memory node point here.
export const moduleRoutes: ModuleChildRoute[] = [{ path: 'memory', element: <MemoryView /> }]
