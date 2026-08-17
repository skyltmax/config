type CardProps = {
  labels: string[]
  onDismiss?: () => void
}

// Every issue below is deliberate: this file is the fixture's proof that the @eslint-react rule set replacing
// eslint-plugin-react (4.0.0) still reports what the old plugin reported.
export function Card({ labels, onDismiss }: CardProps) {
  return (
    <div>
      {/* @eslint-react/no-missing-key — was react/jsx-key */}
      {labels.map(label => (
        <span>{label}</span>
      ))}

      {/* @eslint-react/no-leaked-conditional-rendering — was react/jsx-no-leaked-render; needs type information */}
      {labels.length && <p>has labels</p>}

      {/* @eslint-react/dom-no-missing-button-type — was react/button-has-type */}
      <button onClick={onDismiss}>Dismiss</button>

      {/* @eslint-react/dom-no-unsafe-target-blank — was react/jsx-no-target-blank */}
      <a href="https://example.com" target="_blank">
        example
      </a>

      {/* @eslint-react/dom-no-unknown-property — was react/no-unknown-property */}
      <div class="not-className" />
    </div>
  )
}
