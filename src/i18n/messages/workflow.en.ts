import type { Messages } from '../types'

// Namespace `workflow` — the node canvas (`src/components/workflow/`) and the
// workflow editor (`src/screens/workflow/`, except `diff/` and `history/`,
// which are namespace `workflow-history`).
const messages = {
  title: 'Workflow',

  'version.current': 'Version {n} (current)',
  'version.old': 'Version {n}',
  'version.proposed': 'A change waiting for your approval',

  'view.label': 'How the workflow is shown',
  'view.canvas': 'Canvas',
  'view.list': 'Step list',
  'hint.canvas': 'Use Tab to move between the steps and Enter to look at one and adjust it. The step list shows the same steps as a list.',
  'hint.list': 'The steps in the order the workflow runs them. Open one to look at it and adjust it.',

  'canvas.label': 'Workflow canvas',
  'canvas.zoom.label': 'Canvas zoom',
  'canvas.zoomIn': 'Zoom in',
  'canvas.zoomOut': 'Zoom out',
  'canvas.fit': 'Fit to view',
  'canvas.nodeHint': 'Press Enter or Space to look at this step and adjust it.',
  'canvas.handle': 'Connection point',
  'list.label': 'Step list',
  'list.open': 'Look and adjust',
  'list.open.name': 'Look and adjust: {name}',

  'kind.trigger': 'Trigger',
  'kind.source': 'Source',
  'kind.step': 'Step',
  'kind.condition': 'Condition',
  'kind.action': 'Action',
  'kind.output': 'Output',
  'kind.memory': 'Memory',

  'node.name': '{kind}: {label}',
  'node.name.mode': '{kind}: {label}, {mode}',
  'node.connectsTo': 'Leads to: {targets}',
  'node.separator': ', ',
  'node.capped': 'Held back by your limit',
  'node.selected': 'Selected',

  'trigger.schedule': 'On a schedule',
  'trigger.event': 'Account event',
  'trigger.manual': 'By hand',
  'trigger.module': 'From a module',
  'trigger.rule.weekly': 'Every {weekday} at {time}',
  'trigger.rule.daily': 'Every day at {time}',
  'trigger.rule.module': 'When {module} changes',

  'weekday.1': 'Monday',
  'weekday.2': 'Tuesday',
  'weekday.3': 'Wednesday',
  'weekday.4': 'Thursday',
  'weekday.5': 'Friday',
  'weekday.6': 'Saturday',
  'weekday.7': 'Sunday',

  'source.module': 'Reads what {module} produces',
  'source.account': 'Reads the account {account}',
  'source.tables': 'Reads the memory tables: {tables}',
  'source.open': 'Open {module}',

  'condition.threshold': 'Threshold: {minutes} minutes',
  'param.line': '{name}: {value}',

  'action.target': 'Acts on {module}',
  'action.account': 'Through {account}',

  'output.emits': 'Emits the block “{title}” ({block})',
  'output.view': 'See it on the page',

  'memory.tables': 'Tables: {tables}',
  'memory.readers': { one: 'Read by {count} module', other: 'Read by {count} modules' },
  'memory.open': 'Open the memory view',

  'inspector.description': 'Saving creates a new version of the workflow.',
  'inspector.readOnly.source': 'A source follows the accounts and modules that are connected. It cannot be adjusted here.',
  'inspector.readOnly.output': 'The workflow decides what this output shows. It cannot be adjusted here.',
  'inspector.readOnly.memory': 'The workflow writes this memory itself. It cannot be adjusted here.',
  'inspector.readOnly.none': 'This step has nothing to adjust.',
  'inspector.readOnly.version': 'This is not the version in force, so it can only be read.',

  'field.weekday': 'Day of the week',
  'field.time': 'Time',
  'field.time.error': 'Enter a time, for example 09:00.',
  'field.threshold': 'Threshold',
  'field.minutes': 'minutes',
  'field.number.error': 'Enter a whole number above 0.',
  'field.text.error': 'Enter a value.',
  'field.mode': 'Behaviour mode',
  'field.mode.description': 'How much the AI does on its own for this action.',
  'field.param': 'Parameter {name}',
  'field.param.on': 'On',

  'reason.weekly': 'You changed “{label}” to every {weekday} at {time}',
  'reason.daily': 'You changed “{label}” to every day at {time}',
  'reason.threshold': 'You changed the threshold of “{label}” to {minutes} minutes',
  'reason.mode': 'You changed the mode of “{label}” to {mode}',
  'reason.params': 'You adjusted the parameters of “{label}”',

  saved: 'Saved as version {n}',

  loading: 'Loading the workflow…',
  'error.title': 'The workflow could not be loaded',
  'error.body': 'The workflow did not arrive. Nothing was changed, the links above still work, and you can try again.',

  'demo.kinds.caption': 'The seven kinds of node. Each says its kind in words; an action also says its mode.',
  'demo.selected.caption': 'Selected, and an action held below its own mode by your limit:',
  'demo.canvas.caption': 'Four steps laid out in the order they run. Tab moves through them, then to the zoom buttons.',
  'demo.canvas.opened': 'Last opened: {name}',
  'demo.canvas.none': 'No step opened yet.',
  'demo.node.trigger': 'Review every Monday',
  'demo.node.trigger.rule': 'Every Monday at 18:00',
  'demo.node.source': 'Client and pet files',
  'demo.node.source.line': 'Reads what Clients and pets produces',
  'demo.node.source.link': 'Open Clients and pets',
  'demo.node.step': 'Estimate the duration',
  'demo.node.step.line': 'Two or more visits: use this dog’s own record; otherwise: use the breed table.',
  'demo.node.condition': 'Off by more than 30 minutes',
  'demo.node.condition.line': 'Threshold: 30 minutes',
  'demo.node.action': 'Set the booking’s duration',
  'demo.node.action.line': 'Acts on Appointments',
  'demo.node.output': 'Estimated and actual',
  'demo.node.output.line': 'Emits the block “Estimated and actual” (block.table)',
  'demo.node.output.link': 'See it on the page',
  'demo.node.memory': 'Memory',
  'demo.node.memory.line': 'Tables: Rough time per breed, Actual time per dog',
  'demo.node.memory.link': 'Open the memory view',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    workflow: typeof messages
  }
}
