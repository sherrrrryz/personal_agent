import { Button } from '@/components/actions'
import { Grid } from '@/components/layout'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/i18n'

export default function CardDemo() {
  const t = useT('navigation')
  return (
    <Grid>
      <Card>
        <CardHeader>
          <CardTitle>{t('demo.card.title')}</CardTitle>
          <CardDescription>{t('demo.card.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t('demo.card.body')}</p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary">{t('demo.card.action')}</Button>
        </CardFooter>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t('demo.card.small')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('demo.card.smallBody')}</p>
        </CardContent>
      </Card>
    </Grid>
  )
}
