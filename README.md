# redux-bundler-worker

![](https://img.shields.io/npm/dm/redux-bundler-worker.svg)![](https://img.shields.io/npm/v/redux-bundler-worker.svg)![](https://img.shields.io/npm/l/redux-bundler-worker.svg)

Utilities for running a redux-bundler app inside a worker. Largely for demonstration purposes, I have not shipped any production apps built this way.

But it demonstrates a rather feature-complete mechanism for doing so. Utilizing a worker for the entire redux application and then simply doing rendering in the main thread.

## install

```
npm install redux-bundler-worker
```

## example

In the main thread:

```js
import { render, h } from 'preact'
import { Provider } from 'redux-bundler-preact'
import RootComponent from './components/root'
import { getStoreProxy } from 'redux-bundler-worker'

// init our worker
const worker = new Worker('/build/worker.js')
// pass it to our store proxy
const storeProxy = getStoreProxy(worker)

// render our root component passing the proxy
// as if it were the store to Provider:
render(
  <Provider store={storeProxy}>
    <RootComponent />
  </Provider>,
  document.getElementById('app')
)
```

In the worker:

```js
import getStore from './src/bundles'
import { setUpWorker } from 'redux-bundler-worker'

// setUpWorker expects a function it can call *with* initial
// data that will return our redux store. This is what is returned
// by calling redux-bundle's `composeBundles` function anyway.
setUpWorker(getStore)
```

## credits

If you like this follow [@HenrikJoreteg](http://twitter.com/henrikjoreteg) on twitter.

## license

[MIT](http://mit.joreteg.com/)
