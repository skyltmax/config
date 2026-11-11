type AvatarProps = {
  src: string
}

// Deliberate: the fixture's proof that eslint-plugin-jsx-a11y-x (which replaced eslint-plugin-jsx-a11y in 4.0.0) is
// wired in and reports under the `jsx-a11y-x/` rule namespace consumers now see.
export function Avatar({ src }: AvatarProps) {
  // jsx-a11y-x/alt-text — was jsx-a11y/alt-text
  return <img src={src} />
}
