import {
  selectorNameToValueName,
  initScrollPosition,
  saveScrollPosition
} from 'redux-bundler'
import { enable } from 'worker-proof'

export const getStoreProxy = (worker, debug) => {
  const combinedData = {}

  const subscriptions = new Set()
  const watchedSelectors = {}
  const watchedValues = {}

  const watch = selectorName => {
    watchedSelectors[selectorName] = (watchedSelectors[selectorName] || 0) + 1
  }

  const unwatch = selectorName => {
    let count = watchedSelectors[selectorName] - 1
    if (count === 0) {
      delete watchedSelectors[selectorName]
    } else {
      watchedSelectors[selectorName] = count
    }
  }

  const select = selectorNames =>
    selectorNames.reduce((obj, name) => {
      const valueName = selectorNameToValueName(name)
      obj[valueName] = combinedData[valueName]
      return obj
    }, {})

  const store = {
    getAll: () => combinedData,
    select,
    subscribeToSelectors: (keys, callback) => {
      const subscription = {
        fn: callback,
        names: keys.map(selectorNameToValueName)
      }
      subscriptions.add(subscription)
      keys.forEach(watch)

      // make sure starting values are in watched so we can
      // track changes
      Object.assign(watchedValues, select(keys))

      // return function that can be used to unsubscribe
      return () => {
        subscriptions.delete(subscription)
        keys.forEach(unwatch)
      }
    },
    action: (name, args) => {
      worker.postMessage({ type: 'action', name, payload: args })
    }
  }

  worker.postMessage({
    type: 'initial',
    payload: {
      url: window.location.href,
      debug
    }
  })

  window.addEventListener('popstate', () => {
    store.action('doUpdateUrl', [window.location.pathname])
  })

  let firstMessage = true
  worker.addEventListener('message', e => {
    if (e.data.type !== 'changes') {
      return
    }

    const { changes } = e.data

    if (debug) {
      console.log('📦 got changes from worker', changes)
    }
    if (changes.urlRaw) {
      const { url } = changes.urlRaw
      if (url !== window.location.href) {
        saveScrollPosition()
        window.history[changes.urlRaw.replace ? 'replaceState' : 'pushState'](
          {},
          null,
          url
        )
        document.body.scrollTop = 0
        document.body.scrollLeft = 0
      }
    }

    Object.assign(combinedData, changes)

    // look through subscriptions to trigger
    subscriptions.forEach(subscription => {
      const relevantChanges = {}
      let hasChanged = false
      if (subscription.names === 'all') {
        Object.assign(relevantChanges, changes)
        hasChanged = !!Object.keys(relevantChanges).length
      } else {
        subscription.names.forEach(name => {
          if (changes.hasOwnProperty(name)) {
            relevantChanges[name] = changes[name]
            hasChanged = true
          }
        })
      }
      if (hasChanged) {
        subscription.fn(relevantChanges)
      }
    })

    if (firstMessage) {
      initScrollPosition()
      firstMessage = false
    }
  })

  return store
}

export default (worker, debug = false) => {
  enable(worker)
  return getStoreProxy(worker, debug)
}
