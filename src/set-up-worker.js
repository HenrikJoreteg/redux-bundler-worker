export default (getStore, logMessages = false) => {
  let store

  self.addEventListener('message', ({ data }) => {
    if (logMessages) {
      console.log('📦 sent to worker', data)
    }
    const { type, payload, name } = data

    if (type === 'initial') {
      getStore(payload).then(result => {
        store = result
        self.postMessage({ type: 'changes', changes: store.selectAll() })
        store.subscribeToAllChanges(changes => {
          self.postMessage({ type: 'changes', changes })
        })
      })
    } else if (type === 'action') {
      const args = payload || []
      const fn = store[name]
      if (!fn) {
        throw Error(`💥 no action ${name} on store`)
      }
      fn(...args)
    }
  })
}
