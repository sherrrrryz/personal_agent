import { translate, type MessageKey } from '@/i18n'
import { accountsPath } from '@/module/ModuleFrame/failure'
import type { ModuleDefinition } from '@/runtime'

// 待办 · 邮件 · 文件 (D-37): a base module the story never fills. Its page is
// one `block.empty` saying what the module will do once its account is
// connected, with the way to the accounts; its run state stays 尚未运行.

/** The page of a base module that waits for its account. */
export function connectStub(id: 'todo' | 'mail' | 'files'): ModuleDefinition {
  const title: MessageKey<'base-modules'> = `stub.${id}.title`
  const body: MessageKey<'base-modules'> = `stub.${id}.body`
  return {
    id,
    page: (_view, _preview, { locale }) => ({
      blocks: [
        {
          key: 'connect',
          block: 'block.empty',
          title: translate(locale, 'base-modules', 'stub.section'),
          span: 'full',
          props: {
            title: translate(locale, 'base-modules', title),
            body: translate(locale, 'base-modules', body),
            action: { label: translate(locale, 'base-modules', 'stub.action'), href: accountsPath },
          },
        },
      ],
    }),
  }
}
