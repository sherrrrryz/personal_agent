import type { ReactNode } from 'react'

import { useT } from '@/i18n'
import { behaviourMode, behaviourModes, capMode, isAboveCeiling, type BehaviourMode } from '@/lib/vocab'

import { RadioGroup, type RadioOption } from './RadioGroup'

export type BehaviourModePickerProps<Extra extends string = never> = {
  /** The visible legend — what the mode is chosen for; it is the group's accessible name. */
  legend: ReactNode
  description?: ReactNode
  /** Present → the group is invalid and this text says how to fix it. */
  error?: ReactNode
  value?: BehaviourMode | NoInfer<Extra>
  defaultValue?: BehaviourMode | NoInfer<Extra>
  onValueChange?: (value: BehaviourMode | NoInfer<Extra>) => void
  /**
   * The most the user's settings allow here (D-22). A mode above it cannot be
   * chosen, a value above it is shown as the ceiling, and the group says why.
   */
  ceiling?: BehaviourMode
  /**
   * Choices that are not a mode, listed after the three — "not set" on the
   * settings screen. Their values are the only source of `Extra`.
   */
  extraOptions?: ReadonlyArray<RadioOption<Extra>>
  disabled?: boolean
  readOnly?: boolean
  name?: string
}

/**
 * The choice of a behaviour mode: our `RadioGroup` with the three modes of the
 * shared vocabulary — the icon, name and one line of meaning every other
 * surface shows for the same mode.
 */
export function BehaviourModePicker<Extra extends string = never>({
  legend,
  description,
  value,
  defaultValue,
  ceiling,
  extraOptions = [],
  ...rest
}: BehaviourModePickerProps<Extra>) {
  const t = useT('inputs')
  const tCommon = useT('common')

  const isMode = (candidate: string): candidate is BehaviourMode => candidate in behaviourMode
  const shown = <Candidate extends BehaviourMode | Extra | undefined>(candidate: Candidate) =>
    ceiling && candidate !== undefined && isMode(candidate) ? capMode(candidate, ceiling) : candidate

  const modeOptions = behaviourModes.map((mode): RadioOption<BehaviourMode> => {
    const { icon: Icon, nameKey, meaningKey } = behaviourMode[mode]
    return {
      value: mode,
      label: (
        <>
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 wrap-anywhere">{tCommon(nameKey)}</span>
        </>
      ),
      description: tCommon(meaningKey),
      disabled: ceiling ? isAboveCeiling(mode, ceiling) : false,
    }
  })
  // The reason is ordinary text of the group, read with it — a dimmed option alone would say nothing.
  const limit =
    ceiling && modeOptions.some((option) => option.disabled)
      ? t('modePicker.limit', { mode: tCommon(behaviourMode[ceiling].nameKey) })
      : undefined

  return (
    <RadioGroup<BehaviourMode | Extra>
      {...rest}
      legend={legend}
      description={
        description && limit ? (
          <>
            <span className="block">{description}</span>{' '}
            <span className="block">{limit}</span>
          </>
        ) : (
          (description ?? limit)
        )
      }
      options={[...modeOptions, ...extraOptions]}
      value={shown(value)}
      defaultValue={shown(defaultValue)}
    />
  )
}
