precision highp float;
	varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform vec3 uBackgroundColor;
uniform float uSpeed;
uniform float uDistortion;
uniform float uHueShift;
uniform float uIntensity;

	mat3 hueRot(float a) {
		float c = cos(a), s = sin(a), t = 1.0 - c;
		return mat3(
		t*.333+c,    t*.333-s*.577, t*.333+s*.577,
		t*.333+s*.577, t*.333+c,   t*.333-s*.577,
		t*.333-s*.577, t*.333+s*.577, t*.333+c
		);
	}

	float colorLuma(vec3 c) {
		return dot(c, vec3(0.2126, 0.7152, 0.0722));
	}

	vec3 hueFromColor(vec3 c, vec3 fallback) {
		float m = max(max(c.r, c.g), c.b);
		if (m < 1e-5) return fallback;
		return clamp(c / m, 0.0, 1.0);
	}

	vec3 blendAdaptive(vec3 bg, vec3 effect, float softness) {
		float bgLum = colorLuma(bg);
		float lightBg = smoothstep(0.45, 0.95, bgLum);
		float edge = clamp(softness, 0.0, 1.0);

		vec3 additive = bg + effect;
		vec3 effectHue = hueFromColor(effect, vec3(1.0));
		vec3 tintTarget = mix(bg, effectHue, 0.9);
		vec3 tint = mix(bg, tintTarget, edge);

		return mix(additive, tint, lightBg);
	}

void mainImage(out vec4 o, vec2 uv) {
	vec2 u = (uv * 2.0 - 1.0);
	u.x *= uResolution.x / uResolution.y;

	float time = uTime * uSpeed;

	u /= 0.5 + uDistortion * dot(u, u);
	u += 0.2 * cos(time) - 7.56;

	vec3 baseColor = uColor;

	vec3 palette[3];
	palette[0] = baseColor;
	palette[1] = hueRot(radians(uHueShift)) * baseColor;
	palette[2] = hueRot(radians(-uHueShift)) * baseColor;

		vec3 col = vec3(0.0);
		float edgeField = 0.0;
		for(int i = 0; i < 3; i++) {
			vec2 uv_loop = sin(1.5 * u.yx + 2.0 * cos(u -= 0.01));
			float val = 1.0 - exp(-6.0 / exp(6.0 * length(uv_loop + sin(5.0 * uv_loop.y - 3.0 * time) / 4.0)));
			val = pow(clamp(val, 0.0, 1.0), 1.4);
			edgeField += val;
			col += val * palette[i];
		}
		vec3 bands = col * uIntensity;
		float softMask = 1.0 - exp(-0.85 * edgeField * uIntensity);
		vec3 rgb = blendAdaptive(uBackgroundColor, bands, softMask);
		o = vec4(rgb, 1.0);
	}

void main() {
	vec4 fragColor;
	mainImage(fragColor, vUv);
	gl_FragColor = fragColor;
	#include <colorspace_fragment>
}
