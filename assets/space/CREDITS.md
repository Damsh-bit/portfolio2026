# Créditos de los assets 3D (`assets/space/`)

## Modelos — NASA 3D Resources

Fuente: <https://github.com/nasa/NASA-3D-Resources> (contenido de NASA, de uso libre;
NASA no respalda este sitio).

| Archivo | Modelo original | Uso en el sitio |
|---|---|---|
| `models/iss.glb` | International Space Station (ISS) (A) | Orbita la Tierra |
| `models/cassini.glb` | Cassini-Huygens (B) | Orbita Saturno |
| `models/spitzer.glb` | Spitzer Space Telescope | Orbita TRAPPIST-1e (Spitzer lo descubrió en 2017) |
| `models/cubesat.glb` | CubeSat - 1 RU Generic | Easter egg de Alfa Muscae |
| `models/bennu.glb` | 1999 RQ36 asteroid (Bennu) | Asteroides que cruzan la pantalla |

Optimizados offline con [glTF-Transform](https://gltf-transform.dev/): sin Draco
(decodificado), materiales deduplicados, mallas unidas y simplificadas con
meshoptimizer, centradas, normalizadas a radio 1 y cuantizadas
(`KHR_mesh_quantization`, soportado nativamente por three.js — no requiere WASM).

## Texturas — Solar System Scope (CC BY 4.0)

Fuente: <https://www.solarsystemscope.com/textures/> — licencia
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

| Archivo | Textura original |
|---|---|
| `textures/saturn.jpg` | 2k_saturn.jpg |
| `textures/saturn-ring.png` | 2k_saturn_ring_alpha.png (recortada a una tira radial) |
| `textures/lucero-ice.jpg` | 2k_eris_fictional.jpg (re-comprimida) |

## Texturas existentes del proyecto

`earth-*.jpg` y `coruscant-*.jpg` provienen de los assets que ya usaba el sitio
(re-empaquetados: las nubes pasaron de PNG RGBA a JPG en escala de grises).

## Código

Ruido simplex 3D en GLSL: Ashima Arts / Stefan Gustavson, licencia MIT
(<https://github.com/ashima/webgl-noise>), en `js/space/shaders/chunks.js`.
