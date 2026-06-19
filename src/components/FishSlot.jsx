import { useMemo } from 'react'
import {
  Card,
  Select,
  NativeSelect,
  Stack,
  Group,
  Text,
  Title,
  ActionIcon,
  Divider,
  Box,
  Input,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  SPECIES,
  SPECIES_DETAILS,
  CONVERSION_SYSTEMS,
  validLengthsFor,
  lengthToWeight,
  formatLbOz,
} from '../lib/fishweight.js'

const SPECIES_OPTIONS = SPECIES.map((s) => ({
  value: s,
  label: SPECIES_DETAILS[s].label,
}))

const FRACTIONS = [
  { value: '0', label: '0' },
  { value: '0.25', label: '1/4' },
  { value: '0.5', label: '1/2' },
  { value: '0.75', label: '3/4' },
]

export default function FishSlot({ fish, index, canRemove, onChange, onRemove }) {
  const [breakdownOpen, breakdown] = useDisclosure(false)

  const validLengths = useMemo(() => validLengthsFor(fish.species), [fish.species])
  const validSet = useMemo(() => new Set(validLengths), [validLengths])

  // Whole-inch options (native <select> data): a placeholder followed by distinct
  // integer floors that have at least one valid length.
  const wholeData = useMemo(() => {
    const wholes = new Set(validLengths.map((l) => Math.floor(l)))
    return [
      { value: '', label: 'in', disabled: true },
      ...[...wholes].sort((a, b) => a - b).map((w) => ({ value: String(w), label: String(w) })),
    ]
  }, [validLengths])

  const whole = fish.length == null ? null : Math.floor(fish.length)
  const fraction = fish.length == null ? null : fish.length - whole

  // Fraction options (native <select> data) with a leading placeholder; each fraction is
  // disabled unless whole+fraction is a valid length for this species.
  const fractionData = useMemo(() => {
    const opts = FRACTIONS.map((f) => ({
      ...f,
      disabled: whole == null || !validSet.has(whole + Number(f.value)),
    }))
    return [{ value: '', label: '–', disabled: true }, ...opts]
  }, [whole, validSet])

  function handleSpecies(value) {
    if (!value) return
    // Reset length when species changes (its valid range/values differ).
    onChange({ species: value, length: null })
  }

  function handleWhole(value) {
    if (!value) {
      onChange({ length: null })
      return
    }
    const w = Number(value)
    // Keep the current fraction if still valid, else snap to the first valid one.
    const keep = fraction != null && validSet.has(w + fraction) ? fraction : null
    const f = keep != null ? keep : firstValidFraction(w, validSet)
    onChange({ length: w + f })
  }

  function handleFraction(value) {
    if (whole == null || !value) return
    onChange({ length: whole + Number(value) })
  }

  let result = null
  let error = null
  if (fish.length != null) {
    try {
      result = lengthToWeight(fish.species, String(fish.length))
    } catch (e) {
      error = e.message
    }
  }

  return (
    <Card withBorder padding="sm" radius="md" style={{ flex: 1, minWidth: 0 }}>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Text size="xs" c="dimmed" fw={700}>
            Fish {index + 1}
          </Text>
          {canRemove && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={onRemove}
              aria-label={`Remove fish ${index + 1}`}
            >
              ✕
            </ActionIcon>
          )}
        </Group>

        <Select
          label="Species"
          data={SPECIES_OPTIONS}
          value={fish.species}
          onChange={handleSpecies}
          allowDeselect={false}
          size="sm"
          comboboxProps={{ width: 'target', position: 'bottom-start' }}
        />

        <Input.Wrapper label="Length (in.)">
          <Group gap={4} wrap="nowrap" align="center">
            <NativeSelect
              data={wholeData}
              value={whole == null ? '' : String(whole)}
              onChange={(e) => handleWhole(e.currentTarget.value)}
              size="sm"
              rightSectionWidth={0}
              rightSection={<span />}
              styles={{ input: { paddingInline: 4, textAlign: 'center' } }}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Text c="dimmed" fw={700}>
              –
            </Text>
            <NativeSelect
              data={fractionData}
              value={fraction == null ? '' : String(fraction)}
              onChange={(e) => handleFraction(e.currentTarget.value)}
              disabled={whole == null}
              size="sm"
              rightSectionWidth={0}
              rightSection={<span />}
              styles={{ input: { paddingInline: 4, textAlign: 'center' } }}
              style={{ flex: 1, minWidth: 0 }}
            />
          </Group>
        </Input.Wrapper>

        <Divider my={4} />

        <Box ta="center">
          {result ? (
            <>
              <Title order={3} fz={{ base: 'h4', sm: 'h3' }} c="teal.4">
                {formatLbOz(result.average).text}
              </Title>
              <Text
                size="xs"
                c="dimmed"
                style={{ cursor: 'pointer' }}
                onClick={breakdown.toggle}
              >
                avg of {result.tableCount} table{result.tableCount === 1 ? '' : 's'}{' '}
                {breakdownOpen ? '▲' : '▼'}
              </Text>
            </>
          ) : error ? (
            <Text size="sm" c="red.4">
              {error}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Pick a length
            </Text>
          )}
        </Box>

        {breakdownOpen && result && (
          <Stack gap={2}>
            {CONVERSION_SYSTEMS.map(({ lookup, label }) => {
              const value = result.weights[label]
              return (
                <Group key={lookup} justify="space-between" wrap="nowrap" gap={4}>
                  <Text size="xs" c="dimmed" truncate title={label}>
                    {lookup}
                  </Text>
                  <Text size="xs">{value == null ? '—' : formatLbOz(value).text}</Text>
                </Group>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

function firstValidFraction(whole, validSet) {
  for (const f of [0, 0.25, 0.5, 0.75]) {
    if (validSet.has(whole + f)) return f
  }
  return 0
}
