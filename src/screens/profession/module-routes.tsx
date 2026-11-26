import { useParams } from 'react-router'

import { NotFound } from '@/app/NotFound'
import { moduleId, tableId } from '@/fixtures/keys'
import { useRouteModule, type ModuleChildRoute } from '@/module'
import { rowOf, tableOf, useRuntimeState } from '@/runtime'
import { ModulePage } from '@/screens/module/ModulePage'

import { AppointmentSheet } from './AppointmentSheet'
import { PetFile } from './PetFile'

/** `/m/profession.clients/pets/<id>`: the file of one dog; an id no file answers to is not found. */
function PetFileRoute() {
  const { module } = useRouteModule()
  const { petId = '' } = useParams()
  const known = useRuntimeState((state) => rowOf(tableOf(state, tableId.dogs), petId) !== undefined)
  return known ? <PetFile module={module} dogId={petId} /> : <NotFound />
}

/**
 * `/m/profession.appointments/appointments/<id>`: the module's page with the
 * appointment sheet open over it. Closing the sheet goes back to the page.
 */
function AppointmentRoute() {
  const { module, definition, basePath } = useRouteModule()
  const { appointmentId = '' } = useParams()
  const known = useRuntimeState((state) => rowOf(tableOf(state, tableId.appointments), appointmentId) !== undefined)
  if (!known) return <NotFound />
  return (
    <ModulePage module={module} definition={definition} basePath={basePath}>
      <AppointmentSheet moduleId={module.id} appointmentId={appointmentId} basePath={basePath} />
    </ModulePage>
  )
}

export const moduleRoutes: ModuleChildRoute[] = [
  { path: 'pets/:petId', match: (module) => module.id === moduleId.clients, element: <PetFileRoute /> },
  { path: 'appointments/:appointmentId', match: (module) => module.id === moduleId.appointments, element: <AppointmentRoute /> },
]
