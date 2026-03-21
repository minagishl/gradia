precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.11;
  float w = sin(uv.x * 6.2831853 + t) * 0.5 + 0.5;
  float w2 =
      sin(uv.y * 4.5 - t * 0.72 + uv.x * 2.1) * 0.5 + 0.5;
  vec3 col = mix(uColorA, uColorB, w);
  col = mix(col, uColorC,
              w2 * (0.5 + 0.5 * sin(t * 0.31 + (uv.x + uv.y) * 3.2)));
  gl_FragColor = vec4(col, 1.0);
#include <colorspace_fragment>
}
