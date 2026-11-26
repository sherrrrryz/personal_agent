import { useState } from 'react'
import { RouterProvider } from 'react-router'

import { Providers } from './app/Providers.tsx'
import { createAppRouter } from './app/router.tsx'

// `src/App.tsx` and the folder `src/app/` differ only in case, and macOS and
// Windows do not tell them apart: `@/app` resolves to this file there and to
// the folder on Linux. So the folder has no `index.ts` — always import a file
// of it by name (`@/app/routes`, `@/app/router`, `@/app/Providers`).

export default function App() {
  const [router] = useState(createAppRouter)
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
