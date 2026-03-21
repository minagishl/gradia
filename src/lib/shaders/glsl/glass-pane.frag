uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uWaviness;
uniform float uFrequency;
uniform float uRods;
varying vec2 vUv;

vec2 getCoverUV(vec2 uv, vec2 textureSize) {
  vec2 s = uResolution / textureSize;
  float scale = max(s.x, s.y);
  vec2 scaledSize = textureSize * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}

void main() {
  vec2 p = (vUv * 2.0 - 1.0);
  p.x *= uResolution.x / uResolution.y;

  float angle = radians(45.0);
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 p_rot = rot * p;

  float wave = uWaviness * sin(p_rot.y * uFrequency);
  float rod_x = fract((p_rot.x + wave) * uRods) * 2.0 - 1.0;

  float rod_z_sq = 1.0 - rod_x * rod_x;
  float rod_z = sqrt(max(rod_z_sq, 0.0));

  vec3 n = vec3(rod_x, 0.0, -rod_z);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  float refractive_index = 0.6;
  vec3 refracted_ray = mix(n, rd, refractive_index);

  float z_dist = 0.5 / (abs(refracted_ray.z) + 0.001);
  vec3 hit_pos = vec3(p_rot, 0.0) + (z_dist * uDistortion) * refracted_ray;

  mat2 rot_inv = mat2(cos(-angle), -sin(-angle), sin(-angle), cos(-angle));
  vec2 uv_hit = rot_inv * hit_pos.xy;

  uv_hit.x /= (uResolution.x / uResolution.y);
  uv_hit = uv_hit * 0.5 + 0.5;

  vec2 coverUv = getCoverUV(uv_hit, uTextureSize);

  float t = uTime * 0.1;
  vec2 flow = vec2(sin(t), cos(t * 0.8)) * 0.05;

  float dispersion = uChromaticAberration;

  vec2 coverUvFlow = coverUv + flow;
  float r = texture2D(uTexture, coverUvFlow + vec2(dispersion, 0.0)).r;
  float g = texture2D(uTexture, coverUvFlow).g;
  float b = texture2D(uTexture, coverUvFlow - vec2(dispersion, 0.0)).b;

  float g_factor = 1.0 - abs(n.z);
  g_factor = smoothstep(0.0, 1.0, g_factor);
  float glass = g_factor * 0.0025;

  vec3 finalColor = vec3(r, g, b) + glass;
  gl_FragColor = vec4(finalColor, 1.0);
#include <colorspace_fragment>
}
