import { Notification, Affix, Transition } from '@mantine/core'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Shows a small "new version — refresh" prompt when an updated service worker is
 * waiting, so the offline cache never strands the user on a stale build.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <Affix position={{ bottom: 16, left: 16, right: 16 }}>
      <Transition mounted={needRefresh} transition="slide-up">
        {(styles) => (
          <Notification
            style={styles}
            title="Update available"
            color="teal"
            withCloseButton
            onClose={() => setNeedRefresh(false)}
            withBorder
          >
            A new version is ready.{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                updateServiceWorker(true)
              }}
            >
              Refresh
            </a>
          </Notification>
        )}
      </Transition>
    </Affix>
  )
}
