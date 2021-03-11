import React from 'react'

export default function LocalStoreTextField({ id, label, onChange, type = 'text' }) {
  if (typeof id !== 'string') throw new Error('TextField missing id')

  const localStorageKey = `LocalStoreTextField:${id}`
  const localStorageValue = window.localStorage.getItem(localStorageKey) || ''

  // Annoyingly, it seems like we have to store the state locally. To pass the
  // state up, use onChange method, and store the result in a ref.
  const [text, setText] = React.useState(localStorageValue)

  const localOnChange = (event) => {
    const text = event.target.value
    window.localStorage.setItem(localStorageKey, text)
    setText(text)
    if (typeof onChange === 'function') onChange(text)
  }

  return (
  <div>
    <label>{label}
      <input id={id} type={type} onChange={localOnChange} value={text} />
    </label>
  </div>)
}
