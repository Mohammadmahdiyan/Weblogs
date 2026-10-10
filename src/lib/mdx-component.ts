import { createElement, type ComponentType } from 'react'
import { MdxErrorBoundary } from '../components/mdx/MdxErrorBoundary'

export function withMdxErrorBoundary<Props extends object>(
  name: string,
  ComponentToGuard: ComponentType<Props>,
): ComponentType<Props> {
  function GuardedMdxComponent(props: Props) {
    return createElement(MdxErrorBoundary, {
      name,
      children: createElement(ComponentToGuard, props),
    })
  }

  GuardedMdxComponent.displayName = `Guarded(${name})`
  return GuardedMdxComponent
}