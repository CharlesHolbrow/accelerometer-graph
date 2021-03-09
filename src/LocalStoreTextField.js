import React from 'react'

export default function LocalStoreTextField({ id, label, storageRef, type = 'text' }) {
  if (typeof id !== 'string') throw new Error('TextField missing id')

  const localStorageKey = `LocalStoreTextField:${id}`

  // The first time this is instantiated, get the local storage element.
  // Remember local storage will return null when we set it to an empty string.
  React.useEffect(() => {
    const text = window.localStorage.getItem(localStorageKey)
    if (text) storageRef.current = text
  }, [])

  const localOnChange = (event) => {
    const text = event.target.value
    window.localStorage.setItem(localStorageKey, text)
    storageRef.current = text
  }

  return (
  <div>
    <label>{label}
      <input id={id} type={type} onChange={localOnChange} value={storageRef.current} />
    </label>
  </div>)
}
