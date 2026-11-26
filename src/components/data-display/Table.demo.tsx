import { useT } from '@/i18n'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './Table'

export default function TableDemo() {
  const t = useT('feedback')
  const minutes = (count: number) => t('table.demo.minutes', { count })
  const rows = [
    { dog: t('table.demo.row1.dog'), service: t('table.demo.row1.service'), estimated: 90, actual: 100, basis: t('table.demo.row1.basis') },
    { dog: t('table.demo.row2.dog'), service: t('table.demo.row2.service'), estimated: 20, actual: 15, basis: t('table.demo.row2.basis') },
    { dog: t('table.demo.row3.dog'), service: t('table.demo.row3.service'), estimated: 150, actual: 165, basis: t('table.demo.row3.basis') },
  ]
  const total = (key: 'estimated' | 'actual') => rows.reduce((sum, row) => sum + row[key], 0)
  return (
    <Table caption={t('table.demo.caption')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.demo.dog')}</TableHead>
          <TableHead>{t('table.demo.service')}</TableHead>
          <TableHead align="end">{t('table.demo.estimated')}</TableHead>
          <TableHead align="end">{t('table.demo.actual')}</TableHead>
          <TableHead>{t('table.demo.basis')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.dog}>
            <TableHead scope="row">{row.dog}</TableHead>
            <TableCell>{row.service}</TableCell>
            <TableCell align="end">{minutes(row.estimated)}</TableCell>
            <TableCell align="end">{minutes(row.actual)}</TableCell>
            <TableCell>{row.basis}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row">{t('table.demo.total')}</TableHead>
          <TableCell />
          <TableCell align="end">{minutes(total('estimated'))}</TableCell>
          <TableCell align="end">{minutes(total('actual'))}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  )
}
