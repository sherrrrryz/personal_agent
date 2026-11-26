import { basis, blockKey, column, moduleId, tableId } from '@/fixtures/keys'
import { stringCell, tableOf, type ModuleDefinition } from '@/runtime'
import { appliedFor, pageTools, petPath } from '@/screens/profession/page-tools'

// `profession.clients` 顾客与宠物 (spec part 3 § Screens and flows): one row
// per dog — breed, owner, 适用时长 with its basis, 下次到店 — each opening the
// dog's file (`src/screens/profession/PetFile.tsx`).

const d = column.dogs

const definition: ModuleDefinition = {
  id: moduleId.clients,
  page(view, _preview, { locale }) {
    const tools = pageTools(view, locale)
    const { t, cell } = tools
    const dogs = tableOf(view, tableId.dogs)
    const rows = dogs?.rows ?? []
    if (rows.length === 0) {
      return { blocks: [tools.empty('clients.empty.section', t('clients.empty.title'), t('clients.empty.body'))] }
    }
    const applied = new Map(rows.map((row) => [row.id, appliedFor(view, row.id)]))
    return {
      blocks: [
        {
          key: 'summary',
          block: 'block.summary',
          title: t('summary.title'),
          span: 'full',
          props: {
            items: [
              { id: 'dogs', label: t('clients.summary.dogs'), value: tools.number(rows.length) },
              { id: 'due', label: t('clients.summary.due'), value: tools.number(rows.filter((row) => stringCell(row, d.nextDue) !== null).length) },
              { id: 'own', label: t('clients.summary.own'), value: tools.number(rows.filter((row) => applied.get(row.id)?.basis === basis.own).length) },
            ],
          },
        },
        {
          key: blockKey.clients.dogs,
          block: 'block.list',
          title: t('clients.dogs.title'),
          span: 'full',
          props: {
            items: rows.map((row) => {
              const time = applied.get(row.id) ?? appliedFor(view, row.id)
              const nextDue = stringCell(row, d.nextDue)
              return {
                id: row.id,
                title: cell(dogs, row, d.name),
                meta: t('clients.dog.meta', {
                  breed: cell(dogs, row, d.breed),
                  owner: cell(dogs, row, d.owner),
                  duration: tools.duration(time.minutes),
                  basis: tools.basisWords(time.basis),
                  next: nextDue ? tools.date(nextDue) : t('none.date'),
                }),
                badges: [],
                href: petPath(row.id),
              }
            }),
          },
        },
      ],
    }
  },
}

export default definition
