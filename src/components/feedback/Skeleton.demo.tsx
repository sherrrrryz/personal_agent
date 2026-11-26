import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/i18n'

// Shapes only, hidden from assistive technology and outside any `aria-busy`
// region: a demo that stayed busy would hold every matrix cell for its full
// eight-second wait. The busy region is `DataState`'s, shown in its own demo.
export default function SkeletonDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="lg">
      <p className="text-muted-foreground">{t('skeleton.demo.note')}</p>
      <DemoGroup caption={t('skeleton.demo.lines')}>
        <div aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </DemoGroup>
      <DemoGroup caption={t('skeleton.demo.row')}>
        <div aria-hidden="true" className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </DemoGroup>
    </Stack>
  )
}
