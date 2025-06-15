# ngx-silk-bg

<a href="https://ngxui.com" target="_blank" style="display: flex;gap: .5rem;align-items: center;cursor: pointer; padding: 0 0 0 0; height: fit-content;">
  <img src="https://ngxui.com/assets/img/ngxui-logo.png" style="width: 64px;height: 64px;">
</a>

This library is part of the NGXUI ecosystem.
View all available components at [https://ngxui.com](https://ngxui.com)

`@omnedia/ngx-silk-bg` is an Angular library for a highly-performant animated silk/wave shader background. The effect is GPU-accelerated with three.js, customizable, and SSR-safe.

## Features

* Modern fragment+vertex shader animated silk/wave effect using three.js
* Customizable color, scale, speed, rotation, and noise intensity
* Always fills/resizes to its parent container, responsive
* Animation is paused when scrolled out of view (intersection observer)
* Angular v20+, standalone, signal/zoneless ready
* Zero Angular dependencies except three.js (GPU, no CSS trickery)

## Installation

```sh
npm install @omnedia/ngx-silk-bg three
```

## Usage

Import the `NgxSilkBgComponent` in your Angular module or component:

```typescript
import { NgxSilkBgComponent } from '@omnedia/ngx-silk-bg';

@Component({
  ...
  imports: [NgxSilkBgComponent],
  ...
})
```

Use it in your template:

```html
<div style="width: 100vw; height: 100vh; position: relative;">
  <om-silk-bg
    [color]="'#1976d2'"
    [speed]="4"
    [scale]="1.2"
    [noiseIntensity]="1.7"
    [rotation]="0.1"
    style="position: absolute; inset: 0; z-index: 0;"
  ></om-silk-bg>
  <div style="position: relative; z-index: 1; color: white; padding: 5rem; font-size: 3rem;">
    Overlay content here
  </div>
</div>
```

## API

```html
<om-silk-bg
  [color]="'#7B7481'"
  [speed]="0.1"
  [scale]="1"
  [noiseIntensity]="1.5"
  [rotation]="0"
></om-silk-bg>
```

* `color`: Silk color (hex, default: `#7B7481`)
* `speed`: Animation speed (default: `0.1`)
* `scale`: Scale of pattern (default: `1`)
* `noiseIntensity`: Fuzz/noise strength (default: `1.5`)
* `rotation`: Rotate the pattern in radians (default: `0`)

## Styling

The component automatically fills the parent element. Add `position: absolute|fixed|relative` to the parent/container as needed.

## Notes

* Fully SSR-safe (no DOM access on server)
* Animation is only running when the element is visible (intersection observer)
* No Angular change detection / zone usage — pure JS and signals
* Requires [three.js](https://www.npmjs.com/package/three)

## Contributing

Contributions are welcome. Please submit a pull request or open an issue.

## License

MIT
