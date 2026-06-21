import { useState } from 'react'
import { Container, Title, Text, Button, Group, Box } from '@mantine/core'
import FishSlot from './components/FishSlot.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import MinnesotaIcon from './components/MinnesotaIcon.jsx'

const MAX_FISH = 3
let nextId = 1

function makeFish() {
  return { id: nextId++, species: 'walleye', length: null }
}

export default function App() {
  const [fishes, setFishes] = useState(() => [makeFish(), makeFish()])

  function updateFish(id, patch) {
    setFishes((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function addFish() {
    setFishes((prev) => (prev.length >= MAX_FISH ? prev : [...prev, makeFish()]))
  }

  function removeFish(id) {
    setFishes((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)))
  }

  return (
    <Container size="sm" py="md" px="xs">
      <Box ta="center" mb="md">
        <MinnesotaIcon size={56} color="var(--mantine-color-teal-4)" />
        <Title order={1} fz={{ base: 'h2', sm: 'h1' }} mt="xs">
          Fish Length to Weight
        </Title>
        <Text size="sm" c="dimmed">
          Estimate weight from length — compare up to {MAX_FISH} fish.
        </Text>
      </Box>

      <Group align="stretch" gap="xs" wrap="nowrap">
        {fishes.map((fish, i) => (
          <FishSlot
            key={fish.id}
            fish={fish}
            index={i}
            canRemove={fishes.length > 1}
            onChange={(patch) => updateFish(fish.id, patch)}
            onRemove={() => removeFish(fish.id)}
          />
        ))}
      </Group>

      <Group justify="center" mt="md">
        <Button
          variant="light"
          onClick={addFish}
          disabled={fishes.length >= MAX_FISH}
          size="sm"
        >
          + Add fish
        </Button>
      </Group>

      <Text ta="center" size="xs" c="dimmed" mt="xl">
        Weights are estimates based on MN DNR length-to-weight data. Not official measurements.
      </Text>

      <UpdatePrompt />
    </Container>
  )
}
