import { moduleId, tableId } from '@/fixtures/keys'
import { numberCell, tableOf, type ModuleDefinition } from '@/runtime'
import { pageTools } from '@/screens/profession/page-tools'

// `profession.inventory` 商品与库存 (spec part 3 § Screens and flows): what is
// below its safety level, the stock table with each product's status as text,
// and what to restock. 状态 and 补货建议 are worked out here from the rows.

const definition: ModuleDefinition = {
  id: moduleId.inventory,
  page(view, _preview, { locale }) {
    const tools = pageTools(view, locale)
    const { t, cell, number } = tools
    const products = tableOf(view, tableId.products)
    const rows = (products?.rows ?? []).map((row) => ({
      row,
      name: cell(products, row, 'name'),
      stock: numberCell(row, 'stock') ?? 0,
      safety: numberCell(row, 'safety') ?? 0,
      sold: numberCell(row, 'sold') ?? 0,
    }))
    if (rows.length === 0) {
      return { blocks: [tools.empty('inventory.empty.section', t('inventory.empty.title'), t('inventory.empty.body'))] }
    }
    const low = rows.filter((each) => each.stock < each.safety)
    return {
      blocks: [
        {
          key: 'summary',
          block: 'block.summary',
          title: t('summary.title'),
          span: 'full',
          props: {
            items: [
              { id: 'low', label: t('inventory.summary.low'), value: number(low.length) },
              { id: 'sold', label: t('inventory.summary.sold'), value: number(rows.reduce((sum, each) => sum + each.sold, 0)) },
            ],
          },
        },
        {
          key: 'stock',
          block: 'block.table',
          title: t('inventory.stock.title'),
          span: 'full',
          props: {
            caption: t('inventory.stock.caption'),
            columns: [
              { id: 'name', label: t('inventory.col.name') },
              { id: 'stock', label: t('inventory.col.stock'), align: 'end' },
              { id: 'safety', label: t('inventory.col.safety'), align: 'end' },
              { id: 'status', label: t('inventory.col.status') },
            ],
            rows: rows.map((each) => ({
              id: each.row.id,
              cells: {
                name: each.name,
                stock: number(each.stock),
                safety: number(each.safety),
                status: t(each.stock < each.safety ? 'inventory.status.low' : each.stock === each.safety ? 'inventory.status.edge' : 'inventory.status.ok'),
              },
            })),
          },
        },
        {
          key: 'restock',
          block: 'block.list',
          title: t('inventory.restock.title'),
          span: 'full',
          props: {
            items: low.map((each) => ({
              id: each.row.id,
              title: t('inventory.restock.item', { name: each.name }),
              // Back to twice the safety level.
              meta: t('inventory.restock.meta', { stock: each.stock, safety: each.safety, sold: each.sold, order: each.safety * 2 - each.stock }),
              badges: [],
            })),
          },
        },
      ],
    }
  },
}

export default definition
